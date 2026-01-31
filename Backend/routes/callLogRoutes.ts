import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

// Get call logs
router.get('/', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { leadId, limit = 50 } = req.query;

  const callLogs = await prisma.callLog.findMany({
    where: {
      userId,
      ...(leadId && { leadId: leadId as string }),
    },
    include: { lead: { select: { id: true, name: true, company: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
  });

  res.json({ callLogs });
}));

// Create call log
router.post('/', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { phoneNumber, direction, duration, outcome, notes, recordingUrl, leadId } = req.body;
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;

  if (!phoneNumber || !direction) {
    return res.status(400).json({ message: 'Phone number and direction are required' });
  }

  // Verify lead belongs to org if provided
  if (leadId) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId } });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
  }

  const callLog = await prisma.callLog.create({
    data: { phoneNumber, direction, duration, outcome, notes, recordingUrl, leadId, userId },
    include: { lead: { select: { id: true, name: true } } },
  });

  // Create activity for the call
  if (leadId) {
    await prisma.activity.create({
      data: {
        type: 'CALL',
        content: `${direction === 'outbound' ? 'Outgoing' : 'Incoming'} call - ${outcome || 'completed'}`,
        leadId,
        userId,
        metadata: { duration, outcome, callLogId: callLog.id },
      },
    });
  }

  res.status(201).json({ callLog });
}));

// Update call log
router.put('/:callId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const callId = req.params.callId as string;
  const { duration, outcome, notes, recordingUrl } = req.body;
  const userId = req.user!.userId;

  const callLog = await prisma.callLog.findUnique({ where: { id: callId } });
  if (!callLog || callLog.userId !== userId) return res.status(404).json({ message: 'Not found' });

  const updated = await prisma.callLog.update({
    where: { id: callId },
    data: {
      ...(typeof duration === 'number' && { duration }),
      ...(outcome && { outcome }),
      ...(notes !== undefined && { notes }),
      ...(recordingUrl && { recordingUrl }),
    },
    include: { lead: { select: { id: true, name: true } } },
  });

  res.json({ callLog: updated });
}));

// Delete call log
router.delete('/:callId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const callId = req.params.callId as string;
  const userId = req.user!.userId;

  const callLog = await prisma.callLog.findUnique({ where: { id: callId } });
  if (!callLog || callLog.userId !== userId) return res.status(404).json({ message: 'Not found' });

  await prisma.callLog.delete({ where: { id: callId } });
  res.json({ message: 'Deleted' });
}));

// Get call stats
router.get('/stats', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { period = 'month' } = req.query;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [totalCalls, outboundCalls, inboundCalls, totalDuration, outcomeStats] = await Promise.all([
    prisma.callLog.count({ where: { userId, createdAt: { gte: startDate } } }),
    prisma.callLog.count({ where: { userId, direction: 'outbound', createdAt: { gte: startDate } } }),
    prisma.callLog.count({ where: { userId, direction: 'inbound', createdAt: { gte: startDate } } }),
    prisma.callLog.aggregate({
      where: { userId, createdAt: { gte: startDate } },
      _sum: { duration: true },
    }),
    prisma.callLog.groupBy({
      by: ['outcome'],
      where: { userId, createdAt: { gte: startDate } },
      _count: true,
    }),
  ]);

  res.json({
    stats: {
      totalCalls,
      outboundCalls,
      inboundCalls,
      totalDuration: totalDuration._sum.duration || 0,
      avgDuration: totalCalls > 0 ? Math.round((totalDuration._sum.duration || 0) / totalCalls) : 0,
      byOutcome: outcomeStats.map((o) => ({ outcome: o.outcome || 'unknown', count: o._count })),
    },
    period,
  });
}));

export default router;
