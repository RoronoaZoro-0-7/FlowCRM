import { Router, Request, Response } from 'express';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';
import { getDashboardStats, getWeeklyStats, CACHE_TTL } from '../services/cacheService';
import { cache } from '../config/redis';
import prisma from '../config/client';
import { triggerTokenCleanup, cleanupExpiredTokens } from '../services/tokenCleanupService';

const router = Router();

// ==================== DASHBOARD STATS ====================

/**
 * Get dashboard statistics with Redis caching
 */
router.get('/stats', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    const stats = await getDashboardStats(user.orgId, user.role);
    
    return res.json(stats);
}));

/**
 * Get weekly performance stats for charts
 */
router.get('/weekly', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    const weeklyStats = await getWeeklyStats(user.orgId);
    
    return res.json(weeklyStats);
}));

// ==================== PIPELINE STATS ====================

/**
 * Get deal pipeline summary
 */
router.get('/pipeline', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cacheKey = `pipeline:${user.orgId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    
    const pipeline = await prisma.deal.groupBy({
        by: ['stage'],
        where: { orgId: user.orgId },
        _count: true,
        _sum: { value: true },
    });
    
    const pipelineStats = pipeline.map(p => ({
        stage: p.stage,
        count: p._count,
        value: p._sum.value || 0,
    }));
    
    await cache.set(cacheKey, pipelineStats, CACHE_TTL.MEDIUM);
    
    return res.json(pipelineStats);
}));

// ==================== LEAD STATS ====================

/**
 * Get lead status distribution
 */
router.get('/lead-status', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cacheKey = `lead-status:${user.orgId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    
    const leadStats = await prisma.lead.groupBy({
        by: ['status'],
        where: { orgId: user.orgId },
        _count: true,
        _sum: { value: true },
    });
    
    const stats = leadStats.map(l => ({
        status: l.status,
        count: l._count,
        value: l._sum.value || 0,
    }));
    
    await cache.set(cacheKey, stats, CACHE_TTL.MEDIUM);
    
    return res.json(stats);
}));

/**
 * Get lead sources distribution
 */
router.get('/lead-sources', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cacheKey = `lead-sources:${user.orgId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    
    const sourceStats = await prisma.lead.groupBy({
        by: ['source'],
        where: { orgId: user.orgId },
        _count: true,
    });
    
    const stats = sourceStats.map(s => ({
        source: s.source,
        count: s._count,
    }));
    
    await cache.set(cacheKey, stats, CACHE_TTL.MEDIUM);
    
    return res.json(stats);
}));

// ==================== TASK STATS ====================

/**
 * Get task status distribution
 */
router.get('/task-status', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cacheKey = `task-status:${user.orgId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    
    const taskStats = await prisma.task.groupBy({
        by: ['status'],
        where: { orgId: user.orgId },
        _count: true,
    });
    
    const stats = taskStats.map(t => ({
        status: t.status,
        count: t._count,
    }));
    
    await cache.set(cacheKey, stats, CACHE_TTL.SHORT);
    
    return res.json(stats);
}));

/**
 * Get overdue tasks count
 */
router.get('/overdue-tasks', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cacheKey = `overdue-tasks:${user.orgId}:${user.id}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    
    const now = new Date();
    
    const where: any = {
        orgId: user.orgId,
        status: { not: 'DONE' },
        dueDate: { lt: now },
    };
    
    // Non-admins only see their own tasks
    if (user.role !== 'ADMIN') {
        where.assignedToId = user.id;
    }
    
    const overdueCount = await prisma.task.count({ where });
    
    const overdueTasks = await prisma.task.findMany({
        where,
        take: 5,
        orderBy: { dueDate: 'asc' },
        select: {
            id: true,
            title: true,
            dueDate: true,
            priority: true,
        },
    });
    
    const result = {
        count: overdueCount,
        tasks: overdueTasks,
    };
    
    await cache.set(cacheKey, result, CACHE_TTL.SHORT);
    
    return res.json(result);
}));

// ==================== TEAM PERFORMANCE ====================

/**
 * Get team performance metrics (admin only)
 */
router.get('/team-performance', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        return res.status(403).json({ error: 'Not authorized' });
    }
    
    const cacheKey = `team-perf:${user.orgId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const users = await prisma.user.findMany({
        where: { orgId: user.orgId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            _count: {
                select: {
                    assignedLeads: true,
                    assignedDeals: true,
                    assignedTasks: true,
                },
            },
        },
    });
    
    const performance = await Promise.all(
        users.map(async (u) => {
            const [dealsWon, tasksCompleted] = await Promise.all([
                prisma.deal.count({
                    where: {
                        assignedToId: u.id,
                        stage: 'WON',
                        closeDate: { gte: startOfMonth },
                    },
                }),
                prisma.task.count({
                    where: {
                        assignedToId: u.id,
                        status: 'DONE',
                        updatedAt: { gte: startOfMonth },
                    },
                }),
            ]);
            
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                totalLeads: u._count.assignedLeads,
                totalDeals: u._count.assignedDeals,
                totalTasks: u._count.assignedTasks,
                dealsWonThisMonth: dealsWon,
                tasksCompletedThisMonth: tasksCompleted,
            };
        })
    );
    
    await cache.set(cacheKey, performance, CACHE_TTL.MEDIUM);
    
    return res.json(performance);
}));

// ==================== RECENT ACTIVITY ====================

/**
 * Get recent activity feed
 */
router.get('/activity', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { limit = 20 } = req.query;
    
    const cacheKey = `activity:${user.orgId}:${limit}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    
    const events = await prisma.event.findMany({
        where: { orgId: user.orgId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 50),
        select: {
            id: true,
            type: true,
            payload: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    
    await cache.set(cacheKey, events, CACHE_TTL.SHORT);
    
    return res.json(events);
}));

// ==================== ADMIN: TOKEN CLEANUP ====================

/**
 * Manually trigger token cleanup (Admin only)
 * Revokes expired refresh tokens and clears user cache from Redis
 */
router.post('/admin/cleanup-tokens', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only OWNER and ADMIN can trigger cleanup
    if (!['OWNER', 'ADMIN'].includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const result = await triggerTokenCleanup();
    
    return res.json({
        success: true,
        ...result,
    });
}));

/**
 * Get token statistics (Admin only)
 */
router.get('/admin/token-stats', isAuth, TryCatch(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only OWNER and ADMIN can view stats
    if (!['OWNER', 'ADMIN'].includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [totalTokens, activeTokens, expiredTokens, revokedTokens] = await Promise.all([
        prisma.refreshToken.count(),
        prisma.refreshToken.count({
            where: {
                revoked: false,
                createdAt: { gte: sevenDaysAgo },
            },
        }),
        prisma.refreshToken.count({
            where: {
                revoked: false,
                createdAt: { lt: sevenDaysAgo },
            },
        }),
        prisma.refreshToken.count({
            where: { revoked: true },
        }),
    ]);
    
    return res.json({
        totalTokens,
        activeTokens,
        expiredTokens,
        revokedTokens,
        message: `${expiredTokens} tokens are older than 7 days and eligible for cleanup`,
    });
}));

export default router;
