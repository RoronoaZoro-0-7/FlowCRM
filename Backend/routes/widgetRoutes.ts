import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

const DEFAULT_WIDGETS = [
  { widgetType: 'stats', title: 'Key Metrics', position: 0, size: 'large' },
  { widgetType: 'pipeline', title: 'Deal Pipeline', position: 1, size: 'large' },
  { widgetType: 'tasks', title: 'My Tasks', position: 2, size: 'medium' },
  { widgetType: 'activity', title: 'Recent Activity', position: 3, size: 'medium' },
  { widgetType: 'leaderboard', title: 'Team Leaderboard', position: 4, size: 'medium' },
];

// Get user's dashboard widgets
router.get('/', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;

  let widgets = await prisma.dashboardWidget.findMany({
    where: { userId, orgId },
    orderBy: { position: 'asc' },
  });

  // Initialize with defaults if none exist
  if (widgets.length === 0) {
    await prisma.dashboardWidget.createMany({
      data: DEFAULT_WIDGETS.map((w) => ({ ...w, userId, orgId })),
    });
    widgets = await prisma.dashboardWidget.findMany({
      where: { userId, orgId },
      orderBy: { position: 'asc' },
    });
  }

  res.json({ widgets });
}));

// Create widget
router.post('/', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { widgetType, title, size, config } = req.body;
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;

  const maxPosition = await prisma.dashboardWidget.aggregate({
    where: { userId, orgId },
    _max: { position: true },
  });

  const widget = await prisma.dashboardWidget.create({
    data: {
      widgetType,
      title,
      size: size || 'medium',
      config,
      position: (maxPosition._max.position || 0) + 1,
      userId,
      orgId,
    },
  });

  res.status(201).json({ widget });
}));

// Update widget
router.put('/:widgetId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const widgetId = req.params.widgetId as string;
  const { title, size, config, position } = req.body;
  const userId = req.user!.userId;

  const widget = await prisma.dashboardWidget.update({
    where: { id: widgetId, userId },
    data: {
      ...(title && { title }),
      ...(size && { size }),
      ...(config && { config }),
      ...(typeof position === 'number' && { position }),
    },
  });

  res.json({ widget });
}));

// Delete widget
router.delete('/:widgetId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const widgetId = req.params.widgetId as string;
  const userId = req.user!.userId;

  await prisma.dashboardWidget.delete({ where: { id: widgetId, userId } });
  res.json({ message: 'Deleted' });
}));

// Reorder widgets
router.post('/reorder', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { widgetIds } = req.body;
  const userId = req.user!.userId;

  if (!Array.isArray(widgetIds)) return res.status(400).json({ message: 'widgetIds must be an array' });

  await Promise.all(
    widgetIds.map((id: string, index: number) =>
      prisma.dashboardWidget.update({ where: { id, userId }, data: { position: index } })
    )
  );

  res.json({ success: true });
}));

// Reset to defaults
router.post('/reset', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;

  await prisma.dashboardWidget.deleteMany({ where: { userId, orgId } });
  await prisma.dashboardWidget.createMany({
    data: DEFAULT_WIDGETS.map((w) => ({ ...w, userId, orgId })),
  });

  const widgets = await prisma.dashboardWidget.findMany({
    where: { userId, orgId },
    orderBy: { position: 'asc' },
  });

  res.json({ widgets });
}));

export default router;
