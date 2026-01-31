import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Upload attachment to lead
router.post('/lead/:leadId', isAuth, upload.single('file'), TryCatch(async (req: Request, res: Response) => {
  const leadId = req.params.leadId as string;
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId } });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  const result = await uploadToCloudinary(req.file.buffer, `crm/${orgId}/leads`, req.file.originalname);

  const attachment = await prisma.attachment.create({
    data: {
      filename: req.file.originalname,
      url: result.url,
      publicId: result.publicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      leadId,
      uploadedById: userId,
    },
  });

  res.status(201).json({ attachment });
}));

// Upload attachment to deal
router.post('/deal/:dealId', isAuth, upload.single('file'), TryCatch(async (req: Request, res: Response) => {
  const dealId = req.params.dealId as string;
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const deal = await prisma.deal.findFirst({ where: { id: dealId, orgId } });
  if (!deal) return res.status(404).json({ message: 'Deal not found' });

  const result = await uploadToCloudinary(req.file.buffer, `crm/${orgId}/deals`, req.file.originalname);

  const attachment = await prisma.attachment.create({
    data: {
      filename: req.file.originalname,
      url: result.url,
      publicId: result.publicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      dealId,
      uploadedById: userId,
    },
  });

  res.status(201).json({ attachment });
}));

// Upload attachment to task
router.post('/task/:taskId', isAuth, upload.single('file'), TryCatch(async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const task = await prisma.task.findFirst({ where: { id: taskId, orgId } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const result = await uploadToCloudinary(req.file.buffer, `crm/${orgId}/tasks`, req.file.originalname);

  const attachment = await prisma.attachment.create({
    data: {
      filename: req.file.originalname,
      url: result.url,
      publicId: result.publicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      taskId,
      uploadedById: userId,
    },
  });

  res.status(201).json({ attachment });
}));

// Get attachments for an entity
router.get('/:entityType/:entityId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;
  const entityId = req.params.entityId as string;
  const orgId = req.user!.orgId;

  let attachments;
  switch (entityType) {
    case 'lead':
      attachments = await prisma.attachment.findMany({ where: { leadId: entityId, lead: { orgId } }, include: { uploadedBy: { select: { name: true } } } });
      break;
    case 'deal':
      attachments = await prisma.attachment.findMany({ where: { dealId: entityId, deal: { orgId } }, include: { uploadedBy: { select: { name: true } } } });
      break;
    case 'task':
      attachments = await prisma.attachment.findMany({ where: { taskId: entityId, task: { orgId } }, include: { uploadedBy: { select: { name: true } } } });
      break;
    default:
      return res.status(400).json({ message: 'Invalid entity type' });
  }

  res.json({ attachments });
}));

// Delete attachment
router.delete('/:attachmentId', isAuth, TryCatch(async (req: Request, res: Response) => {
  const attachmentId = req.params.attachmentId as string;
  const orgId = req.user!.orgId;

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { lead: true, deal: true, task: true },
  });
  if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

  const attachmentOrgId = attachment.lead?.orgId || attachment.deal?.orgId || attachment.task?.orgId;
  if (attachmentOrgId !== orgId) return res.status(403).json({ message: 'Forbidden' });

  await deleteFromCloudinary(attachment.publicId);
  await prisma.attachment.delete({ where: { id: attachmentId } });

  res.json({ message: 'Deleted' });
}));

export default router;
