import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import requireRole from '../middleware/isRole';
import { TryCatch } from '../utils/tryCatch';

const router = Router();

const VALID_ENTITY_TYPES = ['lead', 'deal', 'task'];

// Get custom fields for entity type
router.get('/:entityType', isAuth, TryCatch(async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;
  const orgId = req.user!.orgId;

  if (!VALID_ENTITY_TYPES.includes(entityType)) {
    return res.status(400).json({ message: 'Invalid entity type' });
  }

  const fields = await prisma.customField.findMany({
    where: { orgId, entityType },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ fields });
}));

// Create custom field
router.post('/', isAuth, requireRole('ADMIN', 'OWNER'), TryCatch(async (req: Request, res: Response) => {
  const { name, fieldType, options, required, entityType } = req.body;
  const orgId = req.user!.orgId;

  if (!name || !fieldType || !entityType) {
    return res.status(400).json({ message: 'Name, fieldType, and entityType are required' });
  }

  if (!VALID_ENTITY_TYPES.includes(entityType)) {
    return res.status(400).json({ message: 'Invalid entity type' });
  }

  const field = await prisma.customField.create({
    data: { name, fieldType, options: options || [], required: required || false, entityType, orgId },
  });

  res.status(201).json({ field });
}));

// Update custom field
router.put('/:fieldId', isAuth, requireRole('ADMIN', 'OWNER'), TryCatch(async (req: Request, res: Response) => {
  const fieldId = req.params.fieldId as string;
  const { name, options, required } = req.body;
  const orgId = req.user!.orgId;

  const existing = await prisma.customField.findUnique({ where: { id: fieldId } });
  if (!existing || existing.orgId !== orgId) return res.status(404).json({ message: 'Not found' });

  const field = await prisma.customField.update({
    where: { id: fieldId },
    data: { ...(name && { name }), ...(options && { options }), ...(typeof required === 'boolean' && { required }) },
  });

  res.json({ field });
}));

// Delete custom field
router.delete('/:fieldId', isAuth, requireRole('ADMIN', 'OWNER'), TryCatch(async (req: Request, res: Response) => {
  const fieldId = req.params.fieldId as string;
  const orgId = req.user!.orgId;

  const existing = await prisma.customField.findUnique({ where: { id: fieldId } });
  if (!existing || existing.orgId !== orgId) return res.status(404).json({ message: 'Not found' });

  await prisma.customField.delete({ where: { id: fieldId } });
  res.json({ message: 'Deleted' });
}));

export default router;
