import { Router, Request, Response } from 'express';
import isAuth from '../middleware/isAuth';
import requireRole from '../middleware/isRole';
import { TryCatch } from '../utils/tryCatch';
import prisma from '../config/client';

const router = Router();

router.use(isAuth);

// Only OWNER can access organizations
router.use(requireRole('OWNER'));

/**
 * Get all organizations (OWNER only)
 */
router.get('/', TryCatch(async (req: Request, res: Response) => {
    const organizations = await prisma.organization.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    leads: true,
                    deals: true,
                    tasks: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Calculate additional stats for each org
    const orgsWithStats = await Promise.all(
        organizations.map(async (org) => {
            // Get total revenue from won deals
            const wonDeals = await prisma.deal.aggregate({
                where: { orgId: org.id, stage: 'WON' },
                _sum: { value: true },
            });

            // Get active deals count
            const activeDeals = await prisma.deal.count({
                where: { 
                    orgId: org.id, 
                    stage: { notIn: ['WON', 'LOST'] } 
                },
            });

            // Get lead conversion rate
            const totalLeads = await prisma.lead.count({ where: { orgId: org.id } });
            const wonLeads = await prisma.lead.count({ 
                where: { orgId: org.id, status: 'WON' } 
            });
            const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

            return {
                ...org,
                stats: {
                    totalRevenue: wonDeals._sum.value || 0,
                    activeDeals,
                    conversionRate,
                },
            };
        })
    );

    // Calculate global stats
    const stats = {
        totalOrganizations: organizations.length,
        totalUsers: organizations.reduce((sum, org) => sum + org._count.users, 0),
        totalLeads: organizations.reduce((sum, org) => sum + org._count.leads, 0),
        totalDeals: organizations.reduce((sum, org) => sum + org._count.deals, 0),
        totalRevenue: orgsWithStats.reduce((sum, org) => sum + org.stats.totalRevenue, 0),
    };

    return res.json({ organizations: orgsWithStats, stats });
}));

/**
 * Get single organization by ID
 */
router.get('/:id', TryCatch(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    users: true,
                    leads: true,
                    deals: true,
                    tasks: true,
                },
            },
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
    }

    return res.json(organization);
}));

export default router;
