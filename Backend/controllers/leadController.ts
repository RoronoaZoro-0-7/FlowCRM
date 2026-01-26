import { Request, Response } from "express";
import { TryCatch } from "../utils/tryCatch";
import prisma from "../config/client";
import { LeadStatus, NotificationType } from "@prisma/client";
import { getIO } from "../index";
import { sendNotificationToOrg } from "../utils/socketNotification";
import { emitLeadEvent, EventType } from "../services/eventEmitter";
import { invalidateDashboardCache } from "../services/cacheService";

// Create a new lead
const createLead = TryCatch(async (req: Request, res: Response) => {
    const { name, email, company, source, status, value, assignedToId, phone } = req.body;
    const userId = req.user?.userId;
    const orgId = req.user?.orgId;

    if (!name) {
        return res.status(400).json({ message: "Lead name is required" });
    }

    if (!userId || !orgId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Get creator name for notification
    const creator = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });

    const lead = await prisma.lead.create({
        data: {
            name,
            email,
            phone,
            company,
            source,
            value: value || 0,
            status: status || LeadStatus.NEW,
            orgId: orgId,
            ownerId: userId,
            assignedToId,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            },
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    // Emit event for event-driven architecture
    await emitLeadEvent(
        EventType.LEAD_CREATED,
        userId,
        orgId,
        lead.id,
        lead.name,
        { assignedTo: assignedToId, notifyAssignee: !!assignedToId }
    );

    // Invalidate dashboard cache
    await invalidateDashboardCache(orgId);

    // Notify org members about new lead (existing functionality)
    const io = getIO();
    await sendNotificationToOrg(
        io,
        orgId,
        NotificationType.LEAD_ASSIGNED,
        "New Lead Added",
        `${creator?.name || 'Someone'} added a new lead: "${name}"`,
        userId // exclude the creator
    );

    res.status(201).json({ message: "Lead created successfully", lead });
});

const getLeads = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    let leads;

    if (req.user.role === "SALES") {
        leads = await prisma.lead.findMany({
            where: { ownerId: req.user.userId },
        });
    } else {
        leads = await prisma.lead.findMany({
            where: { orgId: req.user.orgId },
        });
    }

    res.json(leads);
});
// Get a single lead by ID
const getLeadById = TryCatch(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { orgId: true }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const lead = await prisma.lead.findFirst({
        where: {
            id,
            orgId: user.orgId
        },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            },
            activities: {
                orderBy: { createdAt: 'desc' }
            },
            tasks: true,
            deals: true
        }
    });

    if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ lead });
});

// Update a lead
const updateLead = TryCatch(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { name, email, company, source, status, ownerId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { orgId: true }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if lead exists and belongs to user's organization
    const existingLead = await prisma.lead.findFirst({
        where: {
            id,
            orgId: user.orgId
        }
    });

    if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
    }

    // If ownerId is being updated, verify the new owner belongs to the same org
    if (ownerId && ownerId !== existingLead.ownerId) {
        const newOwner = await prisma.user.findFirst({
            where: {
                id: ownerId,
                orgId: user.orgId
            }
        });

        if (!newOwner) {
            return res.status(400).json({ message: "New owner must be in the same organization" });
        }
    }

    const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(email !== undefined && { email }),
            ...(company !== undefined && { company }),
            ...(source !== undefined && { source }),
            ...(status && { status }),
            ...(ownerId && { ownerId }),
        },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    // Emit appropriate event
    if (status && status !== existingLead.status) {
        await emitLeadEvent(
            EventType.LEAD_STATUS_CHANGED,
            userId,
            user.orgId!,
            updatedLead.id,
            updatedLead.name,
            { previousStatus: existingLead.status, newStatus: status }
        );
    } else {
        await emitLeadEvent(
            EventType.LEAD_UPDATED,
            userId,
            user.orgId!,
            updatedLead.id,
            updatedLead.name
        );
    }

    // Invalidate dashboard cache
    await invalidateDashboardCache(user.orgId!);

    res.status(200).json({ message: "Lead updated successfully", lead: updatedLead });
});

// Delete a lead
const deleteLead = TryCatch(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { orgId: true, role: true }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if lead exists and belongs to user's organization
    const lead = await prisma.lead.findFirst({
        where: {
            id,
            orgId: user.orgId
        }
    });

    if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
    }

    // Delete associated records first (cascading delete)
    await prisma.$transaction([
        prisma.task.deleteMany({ where: { leadId: id } }),
        prisma.activity.deleteMany({ where: { leadId: id } }),
        prisma.deal.deleteMany({ where: { leadId: id } }),
        prisma.lead.delete({ where: { id } })
    ]);

    // Emit delete event
    await emitLeadEvent(
        EventType.LEAD_DELETED,
        userId,
        user.orgId!,
        id,
        lead.name
    );

    // Invalidate dashboard cache
    await invalidateDashboardCache(user.orgId!);

    res.status(200).json({ message: "Lead deleted successfully" });
});

export { createLead, getLeads, getLeadById, updateLead, deleteLead };
