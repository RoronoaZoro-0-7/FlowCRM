import { Router, Request, Response } from "express";
import { createDeal, getDeals, getDealById, updateDeal, deleteDeal } from "../controllers/dealController";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/isRole";
import { TryCatch } from "../utils/tryCatch";
import prisma from "../config/client";
import { invalidateDashboardCache } from "../services/cacheService";

const router = Router();

router.use(isAuth);

router.post("/", createDeal);
router.get("/", getDeals);
router.get("/:id", getDealById);
router.put("/:id", updateDeal);
router.delete("/:id", deleteDeal);

// Bulk delete deals
router.post("/bulk/delete", requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
    const { ids } = req.body;
    const orgId = req.user!.orgId;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs array is required' });
    }

    // Verify all deals belong to the organization
    const deals = await prisma.deal.findMany({
        where: { id: { in: ids }, orgId },
        select: { id: true }
    });

    const validIds = deals.map(d => d.id);

    if (validIds.length === 0) {
        return res.status(404).json({ message: 'No valid deals found' });
    }

    // Delete associated records and deals
    await prisma.$transaction([
        prisma.activity.deleteMany({ where: { dealId: { in: validIds } } }),
        prisma.attachment.deleteMany({ where: { dealId: { in: validIds } } }),
        prisma.deal.deleteMany({ where: { id: { in: validIds } } })
    ]);

    await invalidateDashboardCache(orgId);

    res.json({ message: `Deleted ${validIds.length} deals`, deletedCount: validIds.length });
}));

// Bulk update deals
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
    const allowedFields = ['stage', 'ownerId', 'currency'];
    const updateData: any = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    }

    const result = await prisma.deal.updateMany({
        where: { id: { in: ids }, orgId },
        data: updateData
    });

    await invalidateDashboardCache(orgId);

    res.json({ message: `Updated ${result.count} deals`, updatedCount: result.count });
}));

export default router;
