import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import requireRole from '../middleware/isRole';
import { TryCatch } from '../utils/tryCatch';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.use(isAuth);

// Upload attachment to deal
router.post('/deal/:dealId', upload.single('file'), TryCatch(async (req: Request, res: Response) => {
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
router.post('/task/:taskId', upload.single('file'), TryCatch(async (req: Request, res: Response) => {
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

// Upload organization agreement (OWNER only)
router.post('/organization/:orgId', requireRole('OWNER'), upload.single('file'), TryCatch(async (req: Request, res: Response) => {
  const targetOrgId = req.params.orgId as string;
  const userId = req.user!.userId;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  // Verify organization exists
  const org = await prisma.organization.findUnique({ where: { id: targetOrgId } });
  if (!org) return res.status(404).json({ message: 'Organization not found' });

  const result = await uploadToCloudinary(req.file.buffer, `crm/organizations/${targetOrgId}/agreements`, req.file.originalname);

  const attachment = await prisma.attachment.create({
    data: {
      filename: req.file.originalname,
      url: result.url,
      publicId: result.publicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      orgId: targetOrgId,
      uploadedById: userId,
    },
  });

  res.status(201).json({ attachment });
}));

// Get attachments for an entity
router.get('/:entityType/:entityId', TryCatch(async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;
  const entityId = req.params.entityId as string;
  const orgId = req.user!.orgId;
  const userRole = req.user!.role;

  let attachments;
  switch (entityType) {
    case 'deal':
      attachments = await prisma.attachment.findMany({ 
        where: { dealId: entityId, deal: { orgId } }, 
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      break;
    case 'task':
      attachments = await prisma.attachment.findMany({ 
        where: { taskId: entityId, task: { orgId } }, 
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      break;
    case 'organization':
      // Only OWNER can view organization agreements
      if (userRole !== 'OWNER') {
        return res.status(403).json({ message: 'Only OWNER can view organization agreements' });
      }
      attachments = await prisma.attachment.findMany({ 
        where: { orgId: entityId }, 
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      break;
    default:
      return res.status(400).json({ message: 'Invalid entity type. Use: deal, task, or organization' });
  }

  res.json({ attachments });
}));

// Delete attachment
router.delete('/:attachmentId', TryCatch(async (req: Request, res: Response) => {
  const attachmentId = req.params.attachmentId as string;
  const orgId = req.user!.orgId;
  const userRole = req.user!.role;

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { deal: true, task: true, org: true },
  });
  
  if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

  // Check permission
  const attachmentOrgId = attachment.deal?.orgId || attachment.task?.orgId || attachment.orgId;
  
  // For organization attachments, only OWNER can delete
  if (attachment.orgId && userRole !== 'OWNER') {
    return res.status(403).json({ message: 'Only OWNER can delete organization agreements' });
  }
  
  // For deal/task attachments, user must belong to same org
  if (!attachment.orgId && attachmentOrgId !== orgId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await deleteFromCloudinary(attachment.publicId);
  await prisma.attachment.delete({ where: { id: attachmentId } });

  res.json({ message: 'Attachment deleted successfully' });
}));

export default router;
