import { Server } from 'socket.io';
import prisma from '../config/client';
import { NotificationType } from '@prisma/client';

interface NotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
}

export const sendNotification = async (
    io: Server,
    payload: NotificationPayload
) => {
    const { userId, type, title, message } = payload;

    // Get user's orgId
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { orgId: true },
    });

    if (!user) {
        console.error(`User ${userId} not found for notification`);
        return null;
    }

    // Create notification in database
    const notification = await prisma.notification.create({
        data: {
            userId,
            orgId: user.orgId,
            type,
            title,
            message,
            isRead: false,
        },
    });

    // Emit to specific user
    io.to(`user:${userId}`).emit('notification', notification);

    return notification;
};

export const sendNotificationToOrg = async (
    io: Server,
    orgId: string,
    type: NotificationType,
    title: string,
    message: string,
    excludeUserId?: string
) => {
    // Get all users in the organization
    const users = await prisma.user.findMany({
        where: { orgId },
        select: { id: true },
    });

    // Send notification to each user except excluded one
    for (const user of users) {
        if (user.id !== excludeUserId) {
            await sendNotification(io, {
                userId: user.id,
                type,
                title,
                message,
            });
        }
    }
};
