import { Request, Response } from "express";
import prisma from "../config/client";
import { TryCatch } from "../utils/tryCatch";
import { Server } from "socket.io";
import { NotificationType } from "@prisma/client";

const getNotifications = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
});

const createNotification = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { userId, type, title, message } = req.body;

    if (!userId || !type || !title || !message) {
        return res.status(400).json({ message: "userId, type, title, and message are required" });
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
        return res.status(400).json({ message: "Invalid notification type" });
    }

    // Get target user's orgId
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { orgId: true },
    });

    if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
    }

    // Create notification in database
    const notification = await prisma.notification.create({
        data: {
            userId,
            orgId: targetUser.orgId,
            type,
            title,
            message,
            isRead: false,
        },
    });

    // Get Socket.IO instance and emit
    const io: Server = req.app.get('io');
    io.to(`user:${userId}`).emit('notification', notification);

    res.status(201).json(notification);
});

const markAsRead = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const id = req.params.id as string;

    const notification = await prisma.notification.findFirst({
        where: {
            id,
            userId: req.user.userId,
        },
    });

    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });

    // Emit read status update
    const io: Server = req.app.get('io');
    io.to(`user:${req.user.userId}`).emit('notification:read', updated);

    res.json(updated);
});

const markAllAsRead = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    await prisma.notification.updateMany({
        where: {
            userId: req.user.userId,
            isRead: false,
        },
        data: { isRead: true },
    });

    // Emit all read event
    const io: Server = req.app.get('io');
    io.to(`user:${req.user.userId}`).emit('notification:all-read');

    res.json({ message: "All notifications marked as read" });
});

export { getNotifications, createNotification, markAsRead, markAllAsRead };
