import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

// Get filter presets for entity type
router.get('/:entityType', isAuth, TryCatch(async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;
  const userId = req.user!.userId;

  const presets = await prisma.filterPreset.findMany({
    where: { userId, entityType },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ presets });
}));

// Create filter preset
router.post('/', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { name, entityType, filters, isDefault } = req.body;
  const userId = req.user!.userId;

  if (!name || !entityType || !filters) {
    return res.status(400).json({ message: 'Name, entityType, and filters are required' });
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.filterPreset.updateMany({
      where: { userId, entityType, isDefault: true },
      data: { isDefault: false },
    });
  }

  const preset = await prisma.filterPreset.create({
    data: { name, entityType, filters, isDefault: isDefault || false, userId },
  });

  res.status(201).json({ preset });
}));

// Update filter preset
router.put('/:presetId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const presetId = req.params.presetId as string;
  const { name, filters, isDefault } = req.body;
  const userId = req.user!.userId;

  const existing = await prisma.filterPreset.findUnique({ where: { id: presetId } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ message: 'Not found' });

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.filterPreset.updateMany({
      where: { userId, entityType: existing.entityType, isDefault: true, id: { not: presetId } },
      data: { isDefault: false },
    });
  }

  const preset = await prisma.filterPreset.update({
    where: { id: presetId },
    data: { ...(name && { name }), ...(filters && { filters }), ...(typeof isDefault === 'boolean' && { isDefault }) },
  });

  res.json({ preset });
}));

// Delete filter preset
router.delete('/:presetId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const presetId = req.params.presetId as string;
  const userId = req.user!.userId;

  const existing = await prisma.filterPreset.findUnique({ where: { id: presetId } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ message: 'Not found' });

  await prisma.filterPreset.delete({ where: { id: presetId } });
  res.json({ message: 'Deleted' });
}));

// Get default preset for entity type
router.get('/:entityType/default', isAuth, TryCatch(async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;
  const userId = req.user!.userId;

  const preset = await prisma.filterPreset.findFirst({
    where: { userId, entityType, isDefault: true },
  });

  res.json({ preset });
}));

export default router;
