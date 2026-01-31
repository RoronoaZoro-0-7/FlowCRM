import { Server } from 'socket.io';

let io: Server;

export const setIO = (socketIO: Server) => {
  io = socketIO;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const initializeSocketHandlers = (io: Server) => {
  // User socket connections
  const userSockets = new Map<string, string>();

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId: string) => {
      userSockets.set(userId, socket.id);
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined with socket ${socket.id}`);
    });

    // Join organization room for broadcast events
    socket.on('joinOrg', (orgId: string) => {
      socket.join(`org:${orgId}`);
      console.log(`🏢 Socket ${socket.id} joined org room ${orgId}`);
    });

    // Join chat room
    socket.on('chat:join', (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`💬 Socket ${socket.id} joined chat room ${roomId}`);
    });

    // Leave chat room
    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      console.log(`💬 Socket ${socket.id} left chat room ${roomId}`);
    });

    // Typing indicator
    socket.on('chat:typing', ({ roomId, userId, userName }) => {
      socket.to(`room:${roomId}`).emit('chat:user_typing', { userId, userName });
    });

    socket.on('chat:stop_typing', ({ roomId, userId }) => {
      socket.to(`room:${roomId}`).emit('chat:user_stopped_typing', { userId });
    });

    socket.on('disconnect', () => {
      // Remove user from map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
};

// Emit to specific user
export const emitToUser = (userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Emit to organization
export const emitToOrg = (orgId: string, event: string, data: any) => {
  io.to(`org:${orgId}`).emit(event, data);
};

// Emit to chat room
export const emitToRoom = (roomId: string, event: string, data: any) => {
  io.to(`room:${roomId}`).emit(event, data);
};
