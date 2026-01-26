import { cache, cacheKeys, redis } from '../config/redis';
import prisma from '../config/client';

// ==================== CACHE TTL CONSTANTS ====================
export const CACHE_TTL = {
    SHORT: 30,          // 30 seconds - for frequently changing data
    MEDIUM: 120,        // 2 minutes - for dashboard stats
    LONG: 300,          // 5 minutes - for less frequently changing data
    VERY_LONG: 3600,    // 1 hour - for rarely changing data
};

// ==================== DASHBOARD CACHE ====================

interface DashboardStats {
    totalLeads: number;
    totalDeals: number;
    totalTasks: number;
    openTasks: number;
    leadsThisWeek: number;
    dealsWonThisMonth: number;
    dealValueThisMonth: number;
    conversionRate: number;
}

export const getDashboardStats = async (orgId: string, role: string): Promise<DashboardStats> => {
    const cacheKey = cacheKeys.dashboard(orgId, role);
    
    // Try cache first
    const cached = await cache.get<DashboardStats>(cacheKey);
    if (cached) {
        console.log(`📦 Dashboard stats cache HIT for ${orgId}`);
        return cached;
    }
    
    console.log(`🔍 Dashboard stats cache MISS for ${orgId}, fetching from DB...`);
    
    // Calculate stats from database
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
        totalLeads,
        totalDeals,
        totalTasks,
        openTasks,
        leadsThisWeek,
        dealsWonThisMonth,
        dealValueAgg,
    ] = await Promise.all([
        prisma.lead.count({ where: { orgId } }),
        prisma.deal.count({ where: { orgId } }),
        prisma.task.count({ where: { orgId } }),
        prisma.task.count({ where: { orgId, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
        prisma.lead.count({ where: { orgId, createdAt: { gte: startOfWeek } } }),
        prisma.deal.count({ 
            where: { 
                orgId, 
                stage: 'WON',
                closeDate: { gte: startOfMonth }
            } 
        }),
        prisma.deal.aggregate({
            where: { 
                orgId, 
                stage: 'WON',
                closeDate: { gte: startOfMonth }
            },
            _sum: { value: true },
        }),
    ]);
    
    // Calculate conversion rate (won deals / total deals * 100)
    const wonDeals = await prisma.deal.count({ where: { orgId, stage: 'WON' } });
    const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    
    const stats: DashboardStats = {
        totalLeads,
        totalDeals,
        totalTasks,
        openTasks,
        leadsThisWeek,
        dealsWonThisMonth,
        dealValueThisMonth: dealValueAgg._sum.value || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
    };
    
    // Cache the result
    await cache.set(cacheKey, stats, CACHE_TTL.MEDIUM);
    
    return stats;
};

// Invalidate dashboard cache when data changes
export const invalidateDashboardCache = async (orgId: string): Promise<void> => {
    await cache.delPattern(`dashboard:${orgId}:*`);
    await cache.delPattern(`stats:${orgId}:*`);
    console.log(`🗑️ Dashboard cache invalidated for org ${orgId}`);
};

// ==================== USER CACHE ====================

export const getCachedUser = async (userId: string) => {
    const cacheKey = cacheKeys.user(userId);
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            orgId: true,
            createdAt: true,
        },
    });
    
    if (user) {
        await cache.set(cacheKey, user, CACHE_TTL.LONG);
    }
    
    return user;
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
    await cache.del(cacheKeys.user(userId));
    await cache.del(cacheKeys.userPermissions(userId));
};

// ==================== ORGANIZATION CACHE ====================

export const getCachedOrg = async (orgId: string) => {
    const cacheKey = cacheKeys.org(orgId);
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
            id: true,
            name: true,
            createdAt: true,
        },
    });
    
    if (org) {
        await cache.set(cacheKey, org, CACHE_TTL.VERY_LONG);
    }
    
    return org;
};

export const getCachedOrgUsers = async (orgId: string) => {
    const cacheKey = cacheKeys.orgUsers(orgId);
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    const users = await prisma.user.findMany({
        where: { orgId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
    
    await cache.set(cacheKey, users, CACHE_TTL.MEDIUM);
    
    return users;
};

export const invalidateOrgCache = async (orgId: string): Promise<void> => {
    await cache.del(cacheKeys.org(orgId));
    await cache.del(cacheKeys.orgUsers(orgId));
};

// ==================== WEEKLY STATS CACHE ====================

interface WeeklyStats {
    leadsCreated: number[];
    dealsWon: number[];
    tasksCompleted: number[];
    labels: string[];
}

export const getWeeklyStats = async (orgId: string): Promise<WeeklyStats> => {
    const cacheKey = cacheKeys.weeklyStats(orgId);
    
    const cached = await cache.get<WeeklyStats>(cacheKey);
    if (cached) return cached;
    
    // Get data for last 7 days
    const labels: string[] = [];
    const leadsCreated: number[] = [];
    const dealsWon: number[] = [];
    const tasksCompleted: number[] = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const [leads, deals, tasks] = await Promise.all([
            prisma.lead.count({
                where: {
                    orgId,
                    createdAt: { gte: date, lt: nextDate },
                },
            }),
            prisma.deal.count({
                where: {
                    orgId,
                    stage: 'WON',
                    closeDate: { gte: date, lt: nextDate },
                },
            }),
            prisma.task.count({
                where: {
                    orgId,
                    status: 'DONE',
                    updatedAt: { gte: date, lt: nextDate },
                },
            }),
        ]);
        
        leadsCreated.push(leads);
        dealsWon.push(deals);
        tasksCompleted.push(tasks);
    }
    
    const stats: WeeklyStats = {
        leadsCreated,
        dealsWon,
        tasksCompleted,
        labels,
    };
    
    await cache.set(cacheKey, stats, CACHE_TTL.MEDIUM);
    
    return stats;
};
