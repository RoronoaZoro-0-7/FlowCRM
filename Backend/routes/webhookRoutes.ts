import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import requireRole from '../middleware/isRole';
import { TryCatch } from '../utils/tryCatch';
import crypto from 'crypto';

const router = Router();

// Get webhook config
router.get('/config', isAuth, requireRole('ADMIN', 'OWNER'), TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { webhookUrl: true, webhookEvents: true, webhookSecret: true },
  });

  res.json({
    webhookUrl: org?.webhookUrl || null,
    webhookEvents: org?.webhookEvents || [],
    hasSecret: !!org?.webhookSecret,
  });
}));

// Update webhook config
router.put('/config', isAuth, requireRole('ADMIN', 'OWNER'), TryCatch(async (req: Request, res: Response) => {
  const { webhookUrl, webhookEvents, regenerateSecret } = req.body;
  const orgId = req.user!.orgId;

  const updateData: Prisma.OrganizationUpdateInput = {};

  if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
  if (webhookEvents) updateData.webhookEvents = webhookEvents;
  if (regenerateSecret) updateData.webhookSecret = crypto.randomBytes(32).toString('hex');

  await prisma.organization.update({ where: { id: orgId }, data: updateData });

  res.json({ message: 'Webhook config updated', secretRegenerated: !!regenerateSecret });
}));

// Get webhook logs
router.get('/logs', isAuth, requireRole('ADMIN', 'OWNER'), TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { limit = 50, status } = req.query;

  const logs = await prisma.webhookLog.findMany({
    where: {
      orgId,
      ...(status && { status: status as string }),
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
  });

  res.json({ logs });
}));

// Test webhook
router.post('/test', isAuth, requireRole('ADMIN', 'OWNER'), TryCatch(async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { webhookUrl: true, webhookSecret: true },
  });

  if (!org?.webhookUrl) return res.status(400).json({ message: 'No webhook URL configured' });

  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: { message: 'Test webhook from FlowCRM' },
  };

  const signature = org.webhookSecret
    ? crypto.createHmac('sha256', org.webhookSecret).update(JSON.stringify(testPayload)).digest('hex')
    : undefined;

  try {
    const response = await fetch(org.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature && { 'X-Webhook-Signature': signature }),
      },
      body: JSON.stringify(testPayload),
    });

    await prisma.webhookLog.create({
      data: {
        eventType: 'test',
        payload: testPayload as Prisma.InputJsonValue,
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        orgId,
      },
    });

    res.json({ success: response.ok, statusCode: response.status });
  } catch (err) {
    const error = err as Error;
    await prisma.webhookLog.create({
      data: {
        eventType: 'test',
        payload: testPayload as Prisma.InputJsonValue,
        status: 'failed',
        response: error.message,
        orgId,
      },
    });
    res.status(500).json({ success: false, error: error.message });
  }
}));

// Utility function to send webhooks (exported for use in other routes)
export async function sendWebhook(orgId: string, eventType: string, data: Record<string, unknown>) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { webhookUrl: true, webhookSecret: true, webhookEvents: true },
  });

  if (!org?.webhookUrl || !org.webhookEvents.includes(eventType)) return;

  const payload = { event: eventType, timestamp: new Date().toISOString(), data };
  const signature = org.webhookSecret
    ? crypto.createHmac('sha256', org.webhookSecret).update(JSON.stringify(payload)).digest('hex')
    : undefined;

  try {
    const response = await fetch(org.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature && { 'X-Webhook-Signature': signature }),
      },
      body: JSON.stringify(payload),
    });

    await prisma.webhookLog.create({
      data: {
        eventType,
        payload: payload as Prisma.InputJsonValue,
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        orgId,
      },
    });
  } catch (err) {
    const error = err as Error;
    await prisma.webhookLog.create({
      data: {
        eventType,
        payload: payload as Prisma.InputJsonValue,
        status: 'failed',
        response: error.message,
        orgId,
      },
    });
  }
}

export default router;
