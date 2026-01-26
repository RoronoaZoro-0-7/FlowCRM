import { Queue } from 'bullmq';
import { createBullMQConnection, REDIS_ENABLED } from '../config/redis';

// Create connection for queues - null if Redis disabled
const connection = createBullMQConnection();

// ==================== QUEUE DEFINITIONS ====================
// Only create queues if Redis is enabled

export const emailQueue = REDIS_ENABLED && connection ? new Queue('emailQueue', { connection }) : null;
export const notificationQueue = REDIS_ENABLED && connection ? new Queue('notificationQueue', { connection }) : null;
export const eventQueue = REDIS_ENABLED && connection ? new Queue('eventQueue', { connection }) : null;
export const analyticsQueue = REDIS_ENABLED && connection ? new Queue('analyticsQueue', { connection }) : null;
export const auditQueue = REDIS_ENABLED && connection ? new Queue('auditQueue', { connection }) : null;

// ==================== JOB TYPES ====================

export interface EmailJobData {
    to: string;
    subject: string;
    html: string;
    metadata?: Record<string, any>;
}

export interface NotificationJobData {
    userId: string;
    orgId: string;
    type: string;
    message: string;
    link?: string;
}

export interface EventJobData {
    type: string;
    payload: Record<string, any>;
    orgId: string;
    userId?: string;
}

export interface AnalyticsJobData {
    orgId: string;
    eventType: string;
    data: Record<string, any>;
}

export interface AuditJobData {
    userId: string;
    orgId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
}

// ==================== HELPER FUNCTIONS ====================
// These functions gracefully do nothing if Redis is disabled

export const addEmailJob = async (data: EmailJobData) => {
    if (!emailQueue) {
        console.log('📧 Email queue disabled, skipping job');
        return null;
    }
    return emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
    });
};

export const addNotificationJob = async (data: NotificationJobData) => {
    if (!notificationQueue) {
        console.log('🔔 Notification queue disabled, skipping job');
        return null;
    }
    return notificationQueue.add('create-notification', data, {
        attempts: 2,
        backoff: { type: 'fixed', delay: 1000 },
    });
};

export const addEventJob = async (data: EventJobData) => {
    if (!eventQueue) {
        console.log('📡 Event queue disabled, skipping job');
        return null;
    }
    return eventQueue.add('process-event', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
    });
};

export const addAnalyticsJob = async (data: AnalyticsJobData) => {
    if (!analyticsQueue) {
        return null;
    }
    return analyticsQueue.add('update-analytics', data, {
        attempts: 2,
        removeOnComplete: true,
    });
};

export const addAuditJob = async (data: AuditJobData) => {
    if (!auditQueue) {
        return null;
    }
    return auditQueue.add('create-audit-log', data, {
        attempts: 2,
        removeOnComplete: true,
    });
};

// ==================== QUEUE MONITORING ====================

export const getQueueStats = async () => {
    if (!REDIS_ENABLED) {
        return {
            email: null,
            notification: null,
            event: null,
            analytics: null,
            audit: null,
            disabled: true,
        };
    }

    const [emailStats, notificationStats, eventStats, analyticsStats, auditStats] = await Promise.all([
        emailQueue?.getJobCounts(),
        notificationQueue?.getJobCounts(),
        eventQueue?.getJobCounts(),
        analyticsQueue?.getJobCounts(),
        auditQueue?.getJobCounts(),
    ]);

    return {
        email: emailStats,
        notification: notificationStats,
        event: eventStats,
        analytics: analyticsStats,
        audit: auditStats,
    };
};
