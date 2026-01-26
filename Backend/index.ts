/// <reference path="./global.d.ts" />
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import leadRoutes from './routes/leadRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dealRoutes from './routes/dealRoutes';
import twoFactorRoutes from './routes/twoFactorRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { rateLimitApi } from './middleware/rateLimiter';
import { REDIS_ENABLED, getRedis } from './config/redis';
import { startWorkers } from './queues/workers';
import { initTokenCleanupScheduler } from './services/tokenCleanupService';

dotenv.config();
const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true
    }
});

// Store user socket connections
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

// Make io accessible to routes
app.set('io', io);

// Middleware order is important
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting to API routes
app.use('/api', rateLimitApi);

app.get('/', (req, res) => {
    res.send('FlowCRM API Server');
});

// Health check endpoint
app.get('/health', async (req, res) => {
    const redisClient = getRedis();
    try {
        if (REDIS_ENABLED && redisClient) {
            await redisClient.ping();
            res.json({ 
                status: 'healthy', 
                redis: 'connected',
                timestamp: new Date().toISOString() 
            });
        } else {
            res.json({ 
                status: 'healthy', 
                redis: 'disabled',
                timestamp: new Date().toISOString() 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            redis: 'disconnected',
            timestamp: new Date().toISOString() 
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/2fa", twoFactorRoutes);
app.use("/api/dashboard", dashboardRoutes);

httpServer.listen(3000, async () => {
    console.log('🚀 Server is running on port 3000');
    console.log('📡 Socket.IO ready for connections');
    
    // Start BullMQ workers (only if Redis is enabled)
    startWorkers();
    
    // Initialize token cleanup scheduler (runs every 24 hours)
    await initTokenCleanupScheduler();
});

// Export io instance and getter function
export { io };
export const getIO = () => io;