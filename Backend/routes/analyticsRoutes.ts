import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

// Sales Forecast
router.get('/forecast', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { months = 6 } = req.query;

  const deals = await prisma.deal.findMany({
    where: { orgId, stage: { not: 'CLOSED_LOST' } },
    select: { value: true, probability: true, expectedCloseDate: true, stage: true },
  });

  const forecast: { month: string; expected: number; weighted: number; count: number }[] = [];
  const now = new Date();

  for (let i = 0; i < Number(months); i++) {
    const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
    const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthDeals = deals.filter((d) => {
      if (!d.expectedCloseDate) return false;
      return d.expectedCloseDate >= month && d.expectedCloseDate <= monthEnd;
    });

    const expected = monthDeals.reduce((sum, d) => sum + d.value, 0);
    const weighted = monthDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

    forecast.push({ month: monthStr, expected, weighted, count: monthDeals.length });
  }

  res.json({ forecast });
}));

// Conversion Funnel
router.get('/funnel', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { startDate, endDate } = req.query;

  const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (startDate) dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(startDate as string) };
  if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(endDate as string) };

  const [leads, deals] = await Promise.all([
    prisma.lead.groupBy({
      by: ['status'],
      where: { orgId, ...dateFilter },
      _count: true,
    }),
    prisma.deal.groupBy({
      by: ['stage'],
      where: { orgId, ...dateFilter },
      _count: true,
    }),
  ]);

  const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];
  const funnel = stages.map((stage) => ({
    stage,
    count: leads.find((l) => l.status === stage)?._count || 0,
  }));

  const dealStages = ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const dealFunnel = dealStages.map((stage) => ({
    stage,
    count: deals.find((d) => d.stage === stage)?._count || 0,
  }));

  res.json({ leadFunnel: funnel, dealFunnel });
}));

// Team Leaderboard
router.get('/leaderboard', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { period = 'month' } = req.query;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const users = await prisma.user.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      avatar: true,
      ownedDeals: {
        where: { createdAt: { gte: startDate } },
        select: { value: true, stage: true },
      },
      assignedLeads: {
        where: { createdAt: { gte: startDate } },
        select: { status: true },
      },
    },
  });

  const leaderboard = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      dealsWon: user.ownedDeals.filter((d) => d.stage === 'CLOSED_WON').length,
      dealValue: user.ownedDeals.filter((d) => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + d.value, 0),
      leadsConverted: user.assignedLeads.filter((l) => l.status === 'WON').length,
      totalLeads: user.assignedLeads.length,
    }))
    .sort((a, b) => b.dealValue - a.dealValue);

  res.json({ leaderboard, period });
}));

// Dashboard Stats
router.get('/dashboard', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalLeads, newLeadsThisMonth, totalDeals, wonDealsThisMonth, totalValue, recentActivities] = await Promise.all([
    prisma.lead.count({ where: { orgId } }),
    prisma.lead.count({ where: { orgId, createdAt: { gte: startOfMonth } } }),
    prisma.deal.count({ where: { orgId } }),
    prisma.deal.count({ where: { orgId, stage: 'CLOSED_WON', updatedAt: { gte: startOfMonth } } }),
    prisma.deal.aggregate({ where: { orgId, stage: 'CLOSED_WON' }, _sum: { value: true } }),
    prisma.activity.findMany({
      where: { lead: { orgId } },
      include: { user: { select: { name: true } }, lead: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  res.json({
    stats: {
      totalLeads,
      newLeadsThisMonth,
      totalDeals,
      wonDealsThisMonth,
      totalValue: totalValue._sum.value || 0,
    },
    recentActivities,
  });
}));

// Activity Timeline
router.get('/timeline', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { entityType, entityId, limit = 50 } = req.query;

  interface ActivityFilter {
    lead?: { orgId: string };
    deal?: { orgId: string };
    leadId?: string;
    dealId?: string;
  }

  const where: ActivityFilter = {};
  
  if (entityType === 'lead' && entityId) {
    where.leadId = entityId as string;
  } else if (entityType === 'deal' && entityId) {
    where.dealId = entityId as string;
  } else {
    where.lead = { orgId };
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
  });

  res.json({ activities });
}));

export default router;
