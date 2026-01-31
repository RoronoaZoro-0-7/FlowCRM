import { Router, Request, Response } from 'express';
import { LeadStatus, TaskStatus, TaskPriority } from '@prisma/client';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

// Export Leads
router.get('/leads', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { status, startDate, endDate } = req.query;

  const leads = await prisma.lead.findMany({
    where: {
      orgId,
      ...(status && { status: status as LeadStatus }),
      ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate as string) } }),
    },
    include: {
      assignedTo: { select: { name: true, email: true } },
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const exportData = leads.map((lead) => ({
    Name: lead.name,
    Email: lead.email || '',
    Phone: lead.phone || '',
    Company: lead.company || '',
    Source: lead.source || '',
    Status: lead.status,
    Value: lead.value,
    Currency: lead.currency,
    Score: lead.score,
    'Assigned To': lead.assignedTo?.name || '',
    Owner: lead.owner.name,
    'Created At': lead.createdAt.toISOString().split('T')[0],
  }));

  res.json({ data: exportData, filename: `leads-export-${new Date().toISOString().split('T')[0]}.json` });
}));

// Export Deals
router.get('/deals', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { stage, startDate, endDate } = req.query;

  const deals = await prisma.deal.findMany({
    where: {
      orgId,
      ...(stage && { stage: stage as string }),
      ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate as string) } }),
    },
    include: {
      assignedTo: { select: { name: true, email: true } },
      lead: { select: { name: true, company: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const exportData = deals.map((deal) => ({
    Name: deal.name,
    Value: deal.value,
    Currency: deal.currency,
    Stage: deal.stage,
    Probability: deal.probability,
    'Expected Close': deal.expectedCloseDate?.toISOString().split('T')[0] || '',
    'Lead Name': deal.lead?.name || '',
    'Lead Company': deal.lead?.company || '',
    'Assigned To': deal.assignedTo?.name || '',
    'Created At': deal.createdAt.toISOString().split('T')[0],
  }));

  res.json({ data: exportData, filename: `deals-export-${new Date().toISOString().split('T')[0]}.json` });
}));

// Export Tasks
router.get('/tasks', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { status, priority } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      orgId,
      ...(status && { status: status as TaskStatus }),
      ...(priority && { priority: priority as TaskPriority }),
    },
    include: {
      assignedTo: { select: { name: true } },
      lead: { select: { name: true } },
      deal: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const exportData = tasks.map((task) => ({
    Title: task.title,
    Description: task.description || '',
    Status: task.status,
    Priority: task.priority,
    'Due Date': task.dueDate?.toISOString().split('T')[0] || '',
    'Assigned To': task.assignedTo?.name || '',
    'Related Lead': task.lead?.name || '',
    'Related Deal': task.deal?.name || '',
    'Created At': task.createdAt.toISOString().split('T')[0],
  }));

  res.json({ data: exportData, filename: `tasks-export-${new Date().toISOString().split('T')[0]}.json` });
}));

// Export Reports (comprehensive)
router.get('/report', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { startDate, endDate } = req.query;

  const dateFilter = {
    ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
    ...(endDate && { createdAt: { lte: new Date(endDate as string) } }),
  };

  const [leads, deals, tasks, activities] = await Promise.all([
    prisma.lead.count({ where: { orgId, ...dateFilter } }),
    prisma.deal.findMany({ where: { orgId, ...dateFilter }, select: { value: true, stage: true } }),
    prisma.task.groupBy({ by: ['status'], where: { orgId, ...dateFilter }, _count: true }),
    prisma.activity.count({ where: { lead: { orgId }, ...dateFilter } }),
  ]);

  const wonDeals = deals.filter((d) => d.stage === 'CLOSED_WON');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  const report = {
    summary: {
      totalLeads: leads,
      totalDeals: deals.length,
      wonDeals: wonDeals.length,
      lostDeals: deals.filter((d) => d.stage === 'CLOSED_LOST').length,
      totalRevenue,
      avgDealSize: Math.round(avgDealSize),
      totalActivities: activities,
    },
    tasksByStatus: tasks.map((t) => ({ status: t.status, count: t._count })),
    dealsByStage: Object.entries(
      deals.reduce((acc: Record<string, number>, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + 1;
        return acc;
      }, {})
    ).map(([stage, count]) => ({ stage, count })),
    dateRange: { start: startDate || 'All time', end: endDate || 'Present' },
  };

  res.json({ report, filename: `report-${new Date().toISOString().split('T')[0]}.json` });
}));

export default router;
