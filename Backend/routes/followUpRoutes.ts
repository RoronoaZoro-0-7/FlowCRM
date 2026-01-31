import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import requireRole from '../middleware/isRole';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

// Get all sequences
router.get('/sequences', isAuth, TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const sequences = await prisma.followUpSequence.findMany({
    where: { orgId },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  const sequencesWithCounts = await Promise.all(
    sequences.map(async (seq) => {
      const activeEnrollments = await prisma.followUpEnrollment.count({
        where: { sequenceId: seq.id, status: 'active' },
      });
      return { ...seq, activeEnrollments, stepCount: seq.steps.length };
    })
  );

  res.json({ sequences: sequencesWithCounts });
}));

// Create sequence
router.post('/sequences', isAuth, requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
  const { name, steps } = req.body;
  const orgId = req.user!.orgId;

  if (!name || !steps || steps.length === 0) {
    return res.status(400).json({ message: 'Name and steps are required' });
  }

  interface StepInput { delayDays?: number; actionType: string; subject?: string; content: string }

  const sequence = await prisma.followUpSequence.create({
    data: {
      name,
      orgId,
      steps: {
        create: steps.map((step: StepInput, index: number) => ({
          stepOrder: index,
          delayDays: step.delayDays || 0,
          actionType: step.actionType,
          subject: step.subject,
          content: step.content,
        })),
      },
    },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  res.status(201).json({ sequence });
}));

// Update sequence
router.put('/sequences/:sequenceId', isAuth, requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
  const sequenceId = req.params.sequenceId as string;
  const { name, active, steps } = req.body;
  const orgId = req.user!.orgId;

  const existing = await prisma.followUpSequence.findFirst({ where: { id: sequenceId, orgId } });
  if (!existing) return res.status(404).json({ message: 'Not found' });

  await prisma.followUpSequence.update({
    where: { id: sequenceId },
    data: { ...(name && { name }), ...(typeof active === 'boolean' && { active }) },
  });

  if (steps) {
    await prisma.followUpStep.deleteMany({ where: { sequenceId } });

    interface StepInput { delayDays?: number; actionType: string; subject?: string; content: string }

    await prisma.followUpStep.createMany({
      data: steps.map((step: StepInput, index: number) => ({
        sequenceId,
        stepOrder: index,
        delayDays: step.delayDays || 0,
        actionType: step.actionType,
        subject: step.subject,
        content: step.content,
      })),
    });
  }

  const updated = await prisma.followUpSequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  res.json({ sequence: updated });
}));

// Delete sequence
router.delete('/sequences/:sequenceId', isAuth, requireRole('ADMIN', 'OWNER', 'MANAGER'), TryCatch(async (req: Request, res: Response) => {
  const sequenceId = req.params.sequenceId as string;
  const orgId = req.user!.orgId;

  const existing = await prisma.followUpSequence.findFirst({ where: { id: sequenceId, orgId } });
  if (!existing) return res.status(404).json({ message: 'Not found' });

  await prisma.followUpSequence.delete({ where: { id: sequenceId } });
  res.json({ message: 'Deleted' });
}));

// Enroll lead in sequence
router.post('/enroll', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { leadId, sequenceId } = req.body;
  const orgId = req.user!.orgId;

  const [lead, sequence] = await Promise.all([
    prisma.lead.findFirst({ where: { id: leadId, orgId } }),
    prisma.followUpSequence.findFirst({
      where: { id: sequenceId, orgId, active: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    }),
  ]);

  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  if (!sequence) return res.status(404).json({ message: 'Sequence not found or inactive' });

  const existing = await prisma.followUpEnrollment.findUnique({
    where: { sequenceId_leadId: { sequenceId, leadId } },
  });

  if (existing && existing.status === 'active') {
    return res.status(400).json({ message: 'Already enrolled' });
  }

  const firstStep = sequence.steps[0];
  const nextRunAt = new Date();
  nextRunAt.setDate(nextRunAt.getDate() + (firstStep?.delayDays || 0));

  const enrollment = await prisma.followUpEnrollment.upsert({
    where: { sequenceId_leadId: { sequenceId, leadId } },
    create: { sequenceId, leadId, currentStep: 0, status: 'active', nextRunAt },
    update: { currentStep: 0, status: 'active', nextRunAt },
  });

  res.status(201).json({ enrollment });
}));

// Unenroll lead from sequence
router.post('/unenroll', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { leadId, sequenceId } = req.body;
  const orgId = req.user!.orgId;

  const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId } });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  await prisma.followUpEnrollment.update({
    where: { sequenceId_leadId: { sequenceId, leadId } },
    data: { status: 'cancelled' },
  });

  res.json({ message: 'Unenrolled' });
}));

// Get enrollments for a lead
router.get('/enrollments/lead/:leadId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const leadId = req.params.leadId as string;
  const orgId = req.user!.orgId;

  const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId } });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  const enrollments = await prisma.followUpEnrollment.findMany({ where: { leadId } });
  const sequenceIds = enrollments.map((e) => e.sequenceId);

  const sequences = await prisma.followUpSequence.findMany({
    where: { id: { in: sequenceIds } },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  const enrichedEnrollments = enrollments.map((enrollment) => ({
    ...enrollment,
    sequence: sequences.find((s) => s.id === enrollment.sequenceId),
  }));

  res.json({ enrollments: enrichedEnrollments });
}));

export default router;
