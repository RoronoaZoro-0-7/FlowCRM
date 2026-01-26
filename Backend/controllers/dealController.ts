import { Request, Response } from "express";
import prisma from "../config/client";
import { TryCatch } from "../utils/tryCatch";
import { emitDealEvent, EventType } from "../services/eventEmitter";
import { invalidateDashboardCache } from "../services/cacheService";

const createDeal = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { name, leadId, value, stage, expectedCloseDate, assignedToId } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Deal name is required" });
    }

    // If leadId provided, verify lead belongs to user's org
    if (leadId) {
        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                orgId: req.user.orgId,
            },
        });

        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }
    }

    const deal = await prisma.deal.create({
        data: {
            name,
            value: value || 0,
            stage: stage || 'QUALIFICATION',
            expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
            orgId: req.user.orgId,
            leadId,
            assignedToId: assignedToId || req.user.userId,
        },
        include: {
            lead: true,
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // Emit deal created event
    await emitDealEvent(
        EventType.DEAL_CREATED,
        req.user.userId,
        req.user.orgId,
        deal.id,
        deal.name,
        { dealValue: deal.value, assignedTo: deal.assignedToId || undefined, notifyAssignee: !!deal.assignedToId }
    );

    // Invalidate dashboard cache
    await invalidateDashboardCache(req.user.orgId);

    res.status(201).json(deal);
});

const getDeals = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const deals = await prisma.deal.findMany({
        where: {
            orgId: req.user.orgId,
        },
        include: {
            lead: true,
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json(deals);
});

const getDealById = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const id = req.params.id as string;

    const deal = await prisma.deal.findFirst({
        where: {
            id,
            orgId: req.user.orgId,
        },
        include: {
            lead: true,
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            tasks: true,
        },
    });

    if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
    }

    res.json(deal);
});

const updateDeal = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const id = req.params.id as string;
    const { name, value, stage, expectedCloseDate, closeDate, assignedToId } = req.body;

    const deal = await prisma.deal.findFirst({
        where: {
            id,
            orgId: req.user.orgId,
        },
    });

    if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
    }

    const previousStage = deal.stage;

    const updated = await prisma.deal.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(value !== undefined && { value }),
            ...(stage && { stage }),
            ...(expectedCloseDate !== undefined && { expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null }),
            ...(closeDate !== undefined && { closeDate: closeDate ? new Date(closeDate) : null }),
            ...(assignedToId && { assignedToId }),
        },
        include: {
            lead: true,
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // Emit appropriate event based on stage change
    if (stage && stage !== previousStage) {
        if (stage === 'WON') {
            await emitDealEvent(
                EventType.DEAL_WON,
                req.user.userId,
                req.user.orgId,
                updated.id,
                updated.name,
                { dealValue: updated.value, previousStage, newStage: stage, broadcastWon: true }
            );
        } else if (stage === 'LOST') {
            await emitDealEvent(
                EventType.DEAL_LOST,
                req.user.userId,
                req.user.orgId,
                updated.id,
                updated.name,
                { dealValue: updated.value, previousStage, newStage: stage }
            );
        } else {
            await emitDealEvent(
                EventType.DEAL_STAGE_CHANGED,
                req.user.userId,
                req.user.orgId,
                updated.id,
                updated.name,
                { dealValue: updated.value, previousStage, newStage: stage }
            );
        }
    } else {
        await emitDealEvent(
            EventType.DEAL_UPDATED,
            req.user.userId,
            req.user.orgId,
            updated.id,
            updated.name,
            { dealValue: updated.value }
        );
    }

    // Invalidate dashboard cache
    await invalidateDashboardCache(req.user.orgId);

    res.json(updated);
});

const deleteDeal = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const id = req.params.id as string;

    const deal = await prisma.deal.findFirst({
        where: {
            id,
            orgId: req.user.orgId,
        },
    });

    if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
    }

    // Delete associated tasks first
    await prisma.task.deleteMany({ where: { dealId: id } });
    await prisma.deal.delete({ where: { id } });

    // Emit delete event
    await emitDealEvent(
        EventType.DEAL_DELETED,
        req.user.userId,
        req.user.orgId,
        id,
        deal.name,
        { dealValue: deal.value }
    );

    // Invalidate dashboard cache
    await invalidateDashboardCache(req.user.orgId);

    res.json({ message: "Deal deleted successfully" });
});

export { createDeal, getDeals, getDealById, updateDeal, deleteDeal };
