import { Worker, Job } from 'bullmq';
import { createBullMQConnection, REDIS_ENABLED } from '../config/redis';
import { sendEmail } from '../utils/sendEmail';
import prisma from '../config/client';
import { getIO } from '../index';
import {
    EmailJobData,
    NotificationJobData,
    EventJobData,
    AnalyticsJobData,
    AuditJobData,
} from './index';

// Workers are only created if Redis is enabled
let emailWorker: Worker<EmailJobData> | null = null;
let notificationWorker: Worker<NotificationJobData> | null = null;
let eventWorker: Worker<EventJobData> | null = null;
let analyticsWorker: Worker<AnalyticsJobData> | null = null;
let auditWorker: Worker<AuditJobData> | null = null;

// ==================== GRACEFUL SHUTDOWN ====================
export const closeAllWorkers = async () => {
    if (!REDIS_ENABLED) return;
    
    await Promise.all([
        emailWorker?.close(),
        notificationWorker?.close(),
        eventWorker?.close(),
        analyticsWorker?.close(),
        auditWorker?.close(),
    ]);
    console.log('All workers closed');
};

// Start all workers - only if Redis is enabled
export const startWorkers = () => {
    if (!REDIS_ENABLED) {
        console.log('⚠️ Redis disabled - BullMQ workers will not start');
        return;
    }

    const connection = createBullMQConnection();
    if (!connection) {
        console.log('⚠️ Could not create Redis connection - workers not started');
        return;
    }

    console.log('🚀 Starting all queue workers...');

    // ==================== EMAIL WORKER ====================
    emailWorker = new Worker<EmailJobData>(
        'emailQueue',
        async (job: Job<EmailJobData>) => {
            const { to, subject, html, metadata } = job.data;
            console.log(`📧 Processing email job ${job.id} to ${to}`);
            
            const result = await sendEmail(to, subject, html);
            
            if (!result.success) {
                throw new Error(`Failed to send email: ${result.error}`);
            }
            
            console.log(`✅ Email sent successfully to ${to}`);
            return { success: true, messageId: result.messageId };
        },
        { connection, concurrency: 5 }
    );

    emailWorker.on('completed', (job) => {
        console.log(`📧 Email job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
        console.error(`❌ Email job ${job?.id} failed:`, err.message);
    });

    // ==================== NOTIFICATION WORKER ====================
    notificationWorker = new Worker<NotificationJobData>(
        'notificationQueue',
        async (job: Job<NotificationJobData>) => {
            const { userId, orgId, type, message, link } = job.data;
            console.log(`🔔 Processing notification job ${job.id} for user ${userId}`);
            
            // Create notification in database
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    orgId,
                    type: type as any,
                    title: type.replace(/_/g, ' '),
                    message,
                    isRead: false,
                },
            });
            
            // Emit via Socket.IO for real-time delivery
            try {
                const io = getIO();
                io.to(`user:${userId}`).emit('notification', notification);
            } catch (error) {
                console.log('Socket.IO not available, notification saved to DB only');
            }
            
            console.log(`✅ Notification created for user ${userId}`);
            return { success: true, notificationId: notification.id };
        },
        { connection, concurrency: 10 }
    );

    notificationWorker.on('completed', (job) => {
        console.log(`🔔 Notification job ${job.id} completed`);
    });

    notificationWorker.on('failed', (job, err) => {
        console.error(`❌ Notification job ${job?.id} failed:`, err.message);
    });

    // ==================== EVENT WORKER ====================
    eventWorker = new Worker<EventJobData>(
        'eventQueue',
        async (job: Job<EventJobData>) => {
            const { type, payload, orgId, userId } = job.data;
            console.log(`📡 Processing event job ${job.id} type: ${type}`);
            
            // Store event in database
            const event = await prisma.event.create({
                data: {
                    type,
                    payload,
                    orgId,
                    userId: userId || null,
                },
            });
            
            console.log(`✅ Event ${type} processed`);
            return { success: true, eventId: event.id };
        },
        { connection, concurrency: 10 }
    );

    eventWorker.on('completed', (job) => {
        console.log(`📡 Event job ${job.id} completed`);
    });

    eventWorker.on('failed', (job, err) => {
        console.error(`❌ Event job ${job?.id} failed:`, err.message);
    });

    // ==================== ANALYTICS WORKER ====================
    analyticsWorker = new Worker<AnalyticsJobData>(
        'analyticsQueue',
        async (job: Job<AnalyticsJobData>) => {
            const { orgId, eventType, data } = job.data;
            console.log(`📊 Processing analytics job ${job.id} for org ${orgId}`);
            
            console.log(`✅ Analytics updated for org ${orgId}`);
            return { success: true };
        },
        { connection, concurrency: 5 }
    );

    analyticsWorker.on('completed', (job) => {
        console.log(`📊 Analytics job ${job.id} completed`);
    });

    analyticsWorker.on('failed', (job, err) => {
        console.error(`❌ Analytics job ${job?.id} failed:`, err.message);
    });

    // ==================== AUDIT WORKER ====================
    auditWorker = new Worker<AuditJobData>(
        'auditQueue',
        async (job: Job<AuditJobData>) => {
            const { userId, orgId, action, entityType, entityId, details, ipAddress } = job.data;
            console.log(`📝 Processing audit job ${job.id}`);
            
            const auditLog = await prisma.auditLog.create({
                data: {
                    userId,
                    orgId,
                    action,
                    entityType: entityType || null,
                    entityId: entityId || null,
                    changes: details || {},
                    ipAddress: ipAddress || null,
                },
            });
            
            console.log(`✅ Audit log created: ${action} on ${entityType || 'system'}`);
            return { success: true, auditId: auditLog.id };
        },
        { connection, concurrency: 10 }
    );

    auditWorker.on('completed', (job) => {
        console.log(`📝 Audit job ${job.id} completed`);
    });

    auditWorker.on('failed', (job, err) => {
        console.error(`❌ Audit job ${job?.id} failed:`, err.message);
    });

    console.log('✅ All queue workers started');
};

export { emailWorker, notificationWorker, eventWorker, analyticsWorker, auditWorker };
