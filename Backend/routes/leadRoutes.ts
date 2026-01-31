import { Router, Request, Response } from "express";
import { createLead, getLeads, getLeadById, updateLead, deleteLead } from "../controllers/leadController";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/isRole";
import { TryCatch } from "../utils/tryCatch";
import prisma from "../config/client";
import { invalidateDashboardCache } from "../services/cacheService";

const router = Router();

// All lead routes require authentication
router.use(isAuth);

router.post("/", createLead);
router.get("/", getLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

// Bulk delete leads
router.post("/bulk/delete", requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
    const { ids } = req.body;
    const orgId = req.user!.orgId;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs array is required' });
    }

    // Verify all leads belong to the organization
    const leads = await prisma.lead.findMany({
        where: { id: { in: ids }, orgId },
        select: { id: true }
    });

    const validIds = leads.map(l => l.id);

    if (validIds.length === 0) {
        return res.status(404).json({ message: 'No valid leads found' });
    }

    // Delete associated records and leads in transaction
    await prisma.$transaction([
        prisma.task.deleteMany({ where: { leadId: { in: validIds } } }),
        prisma.activity.deleteMany({ where: { leadId: { in: validIds } } }),
        prisma.deal.deleteMany({ where: { leadId: { in: validIds } } }),
        prisma.attachment.deleteMany({ where: { leadId: { in: validIds } } }),
        prisma.followUpEnrollment.deleteMany({ where: { leadId: { in: validIds } } }),
        prisma.callLog.deleteMany({ where: { leadId: { in: validIds } } }),
        prisma.lead.deleteMany({ where: { id: { in: validIds } } })
    ]);

    await invalidateDashboardCache(orgId);

    res.json({ message: `Deleted ${validIds.length} leads`, deletedCount: validIds.length });
}));

// Bulk update leads
router.post("/bulk/update", requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
    const { ids, data } = req.body;
    const orgId = req.user!.orgId;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs array is required' });
    }

    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'Update data is required' });
    }

    // Only allow certain fields to be bulk updated
    const allowedFields = ['status', 'assignedToId', 'source'];
    const updateData: any = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    }

    const result = await prisma.lead.updateMany({
        where: { id: { in: ids }, orgId },
        data: updateData
    });

    await invalidateDashboardCache(orgId);

    res.json({ message: `Updated ${result.count} leads`, updatedCount: result.count });
}));

// Bulk assign leads
router.post("/bulk/assign", requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
    const { ids, userId } = req.body;
    const orgId = req.user!.orgId;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs array is required' });
    }

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    // Verify user exists and belongs to organization
    const targetUser = await prisma.user.findFirst({
        where: { id: userId, orgId }
    });

    if (!targetUser) {
        return res.status(404).json({ message: 'User not found in organization' });
    }

    const result = await prisma.lead.updateMany({
        where: { id: { in: ids }, orgId },
        data: { assignedToId: userId }
    });

    res.json({ message: `Assigned ${result.count} leads to ${targetUser.name}`, assignedCount: result.count });
}));

// Recalculate lead score
router.post("/:id/recalculate-score", TryCatch(async (req: Request, res: Response) => {
    const leadId = req.params.id as string;
    const orgId = req.user!.orgId;

    const lead = await prisma.lead.findFirst({
        where: { id: leadId, orgId },
        include: {
            activities: true,
            tasks: true,
            deals: true,
            callLogs: true
        }
    });

    if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
    }

    // Calculate score based on various factors
    let score = 0;

    // Base score from value
    if (lead.value) {
        score += Math.min(lead.value / 1000, 20); // Max 20 points from value
    }

    // Activity engagement score
    score += Math.min(lead.activities.length * 2, 20); // Max 20 points from activities

    // Communication score
    score += Math.min(lead.callLogs.length * 3, 15); // Max 15 points from calls

    // Task completion
    const completedTasks = lead.tasks.filter(t => t.status === 'DONE').length;
    score += Math.min(completedTasks * 5, 15); // Max 15 points from completed tasks

    // Deal association
    if (lead.deals.length > 0) {
        score += 15; // 15 points for having deals
    }

    // Status progression
    const statusScores: Record<string, number> = {
        'NEW': 0,
        'CONTACTED': 5,
        'QUALIFIED': 10,
        'PROPOSAL': 15,
        'NEGOTIATION': 18,
        'WON': 20,
        'LOST': 0
    };
    score += statusScores[lead.status] || 0;

    // Ensure score is between 0-100
    score = Math.min(Math.max(Math.round(score), 0), 100);

    // Update lead score (if column exists)
    // For now, return the calculated score
    res.json({ 
        leadId,
        score,
        breakdown: {
            valueScore: Math.min(lead.value ? lead.value / 1000 : 0, 20),
            activityScore: Math.min(lead.activities.length * 2, 20),
            communicationScore: Math.min(lead.callLogs.length * 3, 15),
            taskScore: Math.min(completedTasks * 5, 15),
            dealScore: lead.deals.length > 0 ? 15 : 0,
            statusScore: statusScores[lead.status] || 0
        }
    });
}));

export default router;
