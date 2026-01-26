import { getIO } from '../index';
import prisma from '../config/client';
import { addEventJob, addNotificationJob, addAuditJob } from '../queues';
import { invalidateDashboardCache } from './cacheService';

// ==================== EVENT TYPES ====================

export enum EventType {
    // Lead Events
    LEAD_CREATED = 'LEAD_CREATED',
    LEAD_UPDATED = 'LEAD_UPDATED',
    LEAD_DELETED = 'LEAD_DELETED',
    LEAD_CONVERTED = 'LEAD_CONVERTED',
    LEAD_STATUS_CHANGED = 'LEAD_STATUS_CHANGED',
    LEAD_ASSIGNED = 'LEAD_ASSIGNED',
    
    // Deal Events
    DEAL_CREATED = 'DEAL_CREATED',
    DEAL_UPDATED = 'DEAL_UPDATED',
    DEAL_DELETED = 'DEAL_DELETED',
    DEAL_STAGE_CHANGED = 'DEAL_STAGE_CHANGED',
    DEAL_WON = 'DEAL_WON',
    DEAL_LOST = 'DEAL_LOST',
    DEAL_ASSIGNED = 'DEAL_ASSIGNED',
    
    // Task Events
    TASK_CREATED = 'TASK_CREATED',
    TASK_UPDATED = 'TASK_UPDATED',
    TASK_DELETED = 'TASK_DELETED',
    TASK_COMPLETED = 'TASK_COMPLETED',
    TASK_ASSIGNED = 'TASK_ASSIGNED',
    TASK_DUE_SOON = 'TASK_DUE_SOON',
    TASK_OVERDUE = 'TASK_OVERDUE',
    
    // User Events
    USER_CREATED = 'USER_CREATED',
    USER_UPDATED = 'USER_UPDATED',
    USER_DELETED = 'USER_DELETED',
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
    USER_2FA_ENABLED = 'USER_2FA_ENABLED',
    USER_2FA_DISABLED = 'USER_2FA_DISABLED',
    
    // Organization Events
    ORG_SETTINGS_UPDATED = 'ORG_SETTINGS_UPDATED',
    
    // Notification Events
    NOTIFICATION_SENT = 'NOTIFICATION_SENT',
}

// ==================== EVENT PAYLOAD TYPES ====================

interface BaseEventPayload {
    userId: string;
    orgId: string;
    metadata?: Record<string, any>;
}

interface LeadEventPayload extends BaseEventPayload {
    leadId: string;
    leadName?: string;
    previousStatus?: string;
    newStatus?: string;
    assignedTo?: string;
}

interface DealEventPayload extends BaseEventPayload {
    dealId: string;
    dealName?: string;
    dealValue?: number;
    previousStage?: string;
    newStage?: string;
    assignedTo?: string;
}

interface TaskEventPayload extends BaseEventPayload {
    taskId: string;
    taskTitle?: string;
    assignedTo?: string;
    dueDate?: Date;
}

interface UserEventPayload extends BaseEventPayload {
    targetUserId?: string;
    targetUserEmail?: string;
}

type EventPayload = LeadEventPayload | DealEventPayload | TaskEventPayload | UserEventPayload | BaseEventPayload;

// ==================== EVENT EMITTER ====================

/**
 * Emit an event to the event-driven system
 * This will:
 * 1. Log to Event table
 * 2. Send real-time notification via Socket.IO
 * 3. Invalidate relevant caches
 */
export const emitEvent = async (
    eventType: EventType,
    payload: EventPayload,
    options: {
        createNotification?: boolean;
        notificationMessage?: string;
        notificationLink?: string;
        targetUserIds?: string[];
        broadcastToOrg?: boolean;
    } = {}
): Promise<void> => {
    try {
        const { userId, orgId, ...eventData } = payload;
        
        // 1. Store event in database via queue
        await addEventJob({
            type: eventType,
            userId,
            orgId,
            payload: eventData,
        });
        
        // 2. Log audit trail for important events
        if (isAuditableEvent(eventType)) {
            await addAuditJob({
                action: eventType,
                userId,
                orgId,
                details: eventData,
            });
        }
        
        // 3. Create in-app notification if requested
        if (options.createNotification && options.notificationMessage) {
            const targetUsers = options.targetUserIds || [];
            
            if (options.broadcastToOrg) {
                // Get all users in org for broadcast
                const orgUsers = await prisma.user.findMany({
                    where: { orgId },
                    select: { id: true },
                });
                targetUsers.push(...orgUsers.map(u => u.id));
            }
            
            // Remove duplicates and the triggering user
            const uniqueTargets = [...new Set(targetUsers)].filter(id => id !== userId);
            
            for (const targetUserId of uniqueTargets) {
                await addNotificationJob({
                    userId: targetUserId,
                    orgId,
                    type: mapEventToNotificationType(eventType),
                    message: options.notificationMessage,
                    link: options.notificationLink,
                });
            }
        }
        
        // 4. Real-time Socket.IO broadcast
        try {
            const io = getIO();
            
            // Emit to organization room
            io.to(`org:${orgId}`).emit('event', {
                type: eventType,
                payload: eventData,
                timestamp: new Date().toISOString(),
            });
            
            // Emit specific event type for targeted listeners
            io.to(`org:${orgId}`).emit(eventType, {
                payload: eventData,
                timestamp: new Date().toISOString(),
            });
            
        } catch (socketError) {
            console.log('Socket.IO not initialized, skipping real-time emit');
        }
        
        // 5. Invalidate relevant caches
        await invalidateCacheForEvent(eventType, payload);
        
        console.log(`📡 Event emitted: ${eventType} for org ${orgId}`);
        
    } catch (error) {
        console.error(`❌ Error emitting event ${eventType}:`, error);
        // Don't throw - event emission should not break main flow
    }
};

// ==================== HELPER FUNCTIONS ====================

const isAuditableEvent = (eventType: EventType): boolean => {
    const auditableEvents = [
        EventType.LEAD_DELETED,
        EventType.DEAL_DELETED,
        EventType.DEAL_WON,
        EventType.DEAL_LOST,
        EventType.TASK_DELETED,
        EventType.USER_CREATED,
        EventType.USER_DELETED,
        EventType.USER_PASSWORD_CHANGED,
        EventType.USER_2FA_ENABLED,
        EventType.USER_2FA_DISABLED,
        EventType.USER_LOGIN,
        EventType.ORG_SETTINGS_UPDATED,
    ];
    return auditableEvents.includes(eventType);
};

const mapEventToNotificationType = (eventType: EventType): string => {
    const mapping: Record<string, string> = {
        [EventType.LEAD_CREATED]: 'LEAD',
        [EventType.LEAD_ASSIGNED]: 'LEAD',
        [EventType.LEAD_CONVERTED]: 'LEAD',
        [EventType.DEAL_CREATED]: 'DEAL',
        [EventType.DEAL_WON]: 'DEAL',
        [EventType.DEAL_LOST]: 'DEAL',
        [EventType.DEAL_ASSIGNED]: 'DEAL',
        [EventType.TASK_CREATED]: 'TASK',
        [EventType.TASK_ASSIGNED]: 'TASK',
        [EventType.TASK_DUE_SOON]: 'TASK',
        [EventType.TASK_OVERDUE]: 'TASK',
    };
    return mapping[eventType] || 'SYSTEM';
};

const invalidateCacheForEvent = async (eventType: EventType, payload: EventPayload): Promise<void> => {
    const { orgId } = payload;
    
    // Dashboard cache should be invalidated for most data changes
    const dashboardInvalidatingEvents = [
        EventType.LEAD_CREATED,
        EventType.LEAD_DELETED,
        EventType.DEAL_CREATED,
        EventType.DEAL_DELETED,
        EventType.DEAL_WON,
        EventType.DEAL_LOST,
        EventType.DEAL_STAGE_CHANGED,
        EventType.TASK_CREATED,
        EventType.TASK_DELETED,
        EventType.TASK_COMPLETED,
    ];
    
    if (dashboardInvalidatingEvents.includes(eventType)) {
        await invalidateDashboardCache(orgId);
    }
};

// ==================== CONVENIENCE METHODS ====================

export const emitLeadEvent = async (
    eventType: EventType,
    userId: string,
    orgId: string,
    leadId: string,
    leadName: string,
    options: {
        previousStatus?: string;
        newStatus?: string;
        assignedTo?: string;
        notifyAssignee?: boolean;
    } = {}
): Promise<void> => {
    const payload: LeadEventPayload = {
        userId,
        orgId,
        leadId,
        leadName,
        previousStatus: options.previousStatus,
        newStatus: options.newStatus,
        assignedTo: options.assignedTo,
    };
    
    let notificationMessage: string | undefined;
    let targetUserIds: string[] | undefined;
    
    if (eventType === EventType.LEAD_ASSIGNED && options.assignedTo && options.notifyAssignee) {
        notificationMessage = `You have been assigned to lead: ${leadName}`;
        targetUserIds = [options.assignedTo];
    } else if (eventType === EventType.LEAD_CREATED) {
        notificationMessage = `New lead created: ${leadName}`;
    }
    
    await emitEvent(eventType, payload, {
        createNotification: !!notificationMessage,
        notificationMessage,
        notificationLink: `/leads/${leadId}`,
        targetUserIds,
    });
};

export const emitDealEvent = async (
    eventType: EventType,
    userId: string,
    orgId: string,
    dealId: string,
    dealName: string,
    options: {
        dealValue?: number;
        previousStage?: string;
        newStage?: string;
        assignedTo?: string;
        notifyAssignee?: boolean;
        broadcastWon?: boolean;
    } = {}
): Promise<void> => {
    const payload: DealEventPayload = {
        userId,
        orgId,
        dealId,
        dealName,
        dealValue: options.dealValue,
        previousStage: options.previousStage,
        newStage: options.newStage,
        assignedTo: options.assignedTo,
    };
    
    let notificationMessage: string | undefined;
    let targetUserIds: string[] | undefined;
    let broadcastToOrg = false;
    
    if (eventType === EventType.DEAL_WON && options.broadcastWon) {
        notificationMessage = `🎉 Deal won: ${dealName} ($${options.dealValue?.toLocaleString() || 0})`;
        broadcastToOrg = true;
    } else if (eventType === EventType.DEAL_ASSIGNED && options.assignedTo && options.notifyAssignee) {
        notificationMessage = `You have been assigned to deal: ${dealName}`;
        targetUserIds = [options.assignedTo];
    }
    
    await emitEvent(eventType, payload, {
        createNotification: !!notificationMessage,
        notificationMessage,
        notificationLink: `/deals/${dealId}`,
        targetUserIds,
        broadcastToOrg,
    });
};

export const emitTaskEvent = async (
    eventType: EventType,
    userId: string,
    orgId: string,
    taskId: string,
    taskTitle: string,
    options: {
        assignedTo?: string;
        dueDate?: Date;
        notifyAssignee?: boolean;
    } = {}
): Promise<void> => {
    const payload: TaskEventPayload = {
        userId,
        orgId,
        taskId,
        taskTitle,
        assignedTo: options.assignedTo,
        dueDate: options.dueDate,
    };
    
    let notificationMessage: string | undefined;
    let targetUserIds: string[] | undefined;
    
    if (eventType === EventType.TASK_ASSIGNED && options.assignedTo && options.notifyAssignee) {
        notificationMessage = `New task assigned: ${taskTitle}`;
        targetUserIds = [options.assignedTo];
    } else if (eventType === EventType.TASK_DUE_SOON && options.assignedTo) {
        notificationMessage = `Task due soon: ${taskTitle}`;
        targetUserIds = [options.assignedTo];
    } else if (eventType === EventType.TASK_OVERDUE && options.assignedTo) {
        notificationMessage = `⚠️ Task overdue: ${taskTitle}`;
        targetUserIds = [options.assignedTo];
    }
    
    await emitEvent(eventType, payload, {
        createNotification: !!notificationMessage,
        notificationMessage,
        notificationLink: `/tasks/${taskId}`,
        targetUserIds,
    });
};

export const emitUserEvent = async (
    eventType: EventType,
    userId: string,
    orgId: string,
    options: {
        targetUserId?: string;
        targetUserEmail?: string;
    } = {}
): Promise<void> => {
    const payload: UserEventPayload = {
        userId,
        orgId,
        targetUserId: options.targetUserId,
        targetUserEmail: options.targetUserEmail,
    };
    
    await emitEvent(eventType, payload);
};
