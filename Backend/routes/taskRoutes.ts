import { Router, Request, Response } from "express";
import isAuth from "../middleware/isAuth";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} from "../controllers/taskController";
import requireRole from "../middleware/isRole";
import { TryCatch } from "../utils/tryCatch";
import prisma from "../config/client";

const router = Router();

router.use(isAuth);

// OWNER, ADMIN, MANAGER can create/view tasks, SALES can only view their own
router.post("/", requireRole("OWNER", "ADMIN", "MANAGER"), createTask);
router.get("/", getTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

// Bulk delete tasks
router.post("/bulk/delete", requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
    const { ids } = req.body;
    const orgId = req.user!.orgId;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs array is required' });
    }

    // Verify all tasks belong to the organization
    const tasks = await prisma.task.findMany({
        where: { id: { in: ids }, orgId },
        select: { id: true }
    });

    const validIds = tasks.map(t => t.id);

    if (validIds.length === 0) {
        return res.status(404).json({ message: 'No valid tasks found' });
    }

    // Delete associated records and tasks
    await prisma.$transaction([
        prisma.attachment.deleteMany({ where: { taskId: { in: validIds } } }),
        prisma.task.deleteMany({ where: { id: { in: validIds } } })
    ]);

    res.json({ message: `Deleted ${validIds.length} tasks`, deletedCount: validIds.length });
}));

// Bulk update tasks
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
    const allowedFields = ['status', 'priority', 'assigneeId'];
    const updateData: any = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    }

    const result = await prisma.task.updateMany({
        where: { id: { in: ids }, orgId },
        data: updateData
    });

    res.json({ message: `Updated ${result.count} tasks`, updatedCount: result.count });
}));

export default router;