import { Router, Request, Response } from 'express';
import prisma from '../config/client';
import isAuth from '../middleware/isAuth';
import { TryCatch } from '../utils/tryCatch';
import { emitToRoom, emitToUser } from '../config/socket';

const router = Router();

// Get user's chat rooms
router.get('/rooms', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;

  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });

  const rooms = memberships
    .filter((m) => m.room.orgId === orgId)
    .map((m) => ({
      ...m.room,
      unreadCount: 0,
      lastReadAt: m.lastReadAt,
    }));

  res.json({ rooms });
}));

// Create chat room
router.post('/rooms', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { name, type, memberIds, dealId, leadId } = req.body;
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;

  const allMemberIds = [...new Set([userId, ...(memberIds || [])])];

  const room = await prisma.chatRoom.create({
    data: {
      name: type === 'direct' ? null : name,
      type: type || 'direct',
      orgId,
      dealId,
      leadId,
      members: { create: allMemberIds.map((id: string) => ({ userId: id })) },
    },
    include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
  });

  res.status(201).json({ room });
}));

// Get messages in a room
router.get('/rooms/:roomId/messages', isAuth, TryCatch(async (req: Request, res: Response) => {
  const roomId = req.params.roomId as string;
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;
  const { cursor, limit = 50 } = req.query;

  const membership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
    include: { room: true },
  });

  if (!membership || membership.room.orgId !== orgId) {
    return res.status(403).json({ message: 'Not a member of this room' });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      mentions: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
  });

  await prisma.chatMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { lastReadAt: new Date() },
  });

  res.json({ messages: messages.reverse() });
}));

// Send message
router.post('/rooms/:roomId/messages', isAuth, TryCatch(async (req: Request, res: Response) => {
  const roomId = req.params.roomId as string;
  const { content, mentionedUserIds } = req.body;
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;

  const membership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
    include: { room: true },
  });

  if (!membership || membership.room.orgId !== orgId) {
    return res.status(403).json({ message: 'Not a member of this room' });
  }

  const message = await prisma.chatMessage.create({
    data: {
      content,
      roomId,
      senderId: userId,
      ...(mentionedUserIds?.length && {
        mentions: {
          create: mentionedUserIds.map((mentionedUserId: string) => ({
            userId: mentionedUserId,
            createdById: userId,
          })),
        },
      }),
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      mentions: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

  emitToRoom(roomId, 'chat:message', message);

  if (mentionedUserIds?.length) {
    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    for (const mentionedUserId of mentionedUserIds) {
      await prisma.notification.create({
        data: {
          title: 'You were mentioned',
          message: `${sender?.name || 'Someone'} mentioned you in a chat`,
          type: 'MENTION',
          link: `/chat/${roomId}`,
          userId: mentionedUserId,
          orgId,
        },
      });
      emitToUser(mentionedUserId, 'notification', { type: 'mention', roomId });
    }
  }

  res.status(201).json({ message });
}));

// Mark room as read
router.post('/rooms/:roomId/read', isAuth, TryCatch(async (req: Request, res: Response) => {
  const roomId = req.params.roomId as string;
  const userId = req.user!.userId;

  await prisma.chatMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { lastReadAt: new Date() },
  });

  res.json({ success: true });
}));

// Search users for @mention
router.get('/users/search', isAuth, TryCatch(async (req: Request, res: Response) => {
  const { q } = req.query;
  const orgId = req.user!.orgId;

  if (!q) return res.json({ users: [] });

  const users = await prisma.user.findMany({
    where: { orgId, name: { contains: q as string, mode: 'insensitive' } },
    select: { id: true, name: true, avatar: true },
    take: 10,
  });

  res.json({ users });
}));

// Get unread counts
router.get('/unread', isAuth, TryCatch(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      room: {
        include: { messages: { select: { id: true, createdAt: true } } },
      },
    },
  });

  let totalUnread = 0;
  const roomUnread: Record<string, number> = {};

  for (const membership of memberships) {
    const unread = membership.room.messages.filter(
      (m) => !membership.lastReadAt || m.createdAt > membership.lastReadAt
    ).length;
    roomUnread[membership.roomId] = unread;
    totalUnread += unread;
  }

  res.json({ totalUnread, roomUnread });
}));

export default router;
