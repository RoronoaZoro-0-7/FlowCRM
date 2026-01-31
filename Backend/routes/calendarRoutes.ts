import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

// Get calendar events
router.get('/', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { start, end } = req.query;

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      ...(start && { startTime: { gte: new Date(start as string) } }),
      ...(end && { endTime: { lte: new Date(end as string) } }),
    },
    orderBy: { startTime: 'asc' },
  });

  res.json({ events });
}));

// Create event
router.post('/', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { title, description, startTime, endTime, allDay, location } = req.body;
  const userId = req.user!.userId;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ message: 'Title, startTime, and endTime are required' });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      allDay: allDay || false,
      location,
      userId,
    },
  });

  res.status(201).json({ event });
}));

// Update event
router.put('/:eventId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const eventId = req.params.eventId as string;
  const { title, description, startTime, endTime, allDay, location } = req.body;
  const userId = req.user!.userId;

  const existing = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ message: 'Not found' });

  const event = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(startTime && { startTime: new Date(startTime) }),
      ...(endTime && { endTime: new Date(endTime) }),
      ...(typeof allDay === 'boolean' && { allDay }),
      ...(location !== undefined && { location }),
    },
  });

  res.json({ event });
}));

// Delete event
router.delete('/:eventId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const eventId = req.params.eventId as string;
  const userId = req.user!.userId;

  const existing = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ message: 'Not found' });

  await prisma.calendarEvent.delete({ where: { id: eventId } });
  res.json({ message: 'Deleted' });
}));

// Get upcoming events
router.get('/upcoming', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { limit = 10 } = req.query;

  const events = await prisma.calendarEvent.findMany({
    where: { userId, startTime: { gte: new Date() } },
    orderBy: { startTime: 'asc' },
    take: Number(limit),
  });

  res.json({ events });
}));

// Sync with external calendar (placeholder - would need OAuth)
router.post('/sync/:provider', isAuth, TryCatch(async (req: Request, res: Response) => {
  const provider = req.params.provider as string;

  if (!['google', 'outlook'].includes(provider)) {
    return res.status(400).json({ message: 'Invalid provider' });
  }

  res.json({ message: `Sync with ${provider} initiated. OAuth implementation required.` });
}));

export default router;
