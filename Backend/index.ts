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
import organizationRoutes from './routes/organizationRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import chatRoutes from './routes/chatRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import exportRoutes from './routes/exportRoutes';
import widgetRoutes from './routes/widgetRoutes';
import filterRoutes from './routes/filterRoutes';
import callLogRoutes from './routes/callLogRoutes';
import calendarRoutes from './routes/calendarRoutes';
import webhookRoutes from './routes/webhookRoutes';
import customFieldRoutes from './routes/customFieldRoutes';
import followUpRoutes from './routes/followUpRoutes';
import aiRoutes from './routes/aiRoutes';
import { rateLimitApi } from './middleware/rateLimiter';
import { REDIS_ENABLED, getRedis } from './config/redis';
import { startWorkers } from './queues/workers';
import { initTokenCleanupScheduler } from './services/tokenCleanupService';
import { setIO, initializeSocketHandlers } from './config/socket';

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

// Initialize socket handlers and make io available globally
setIO(io);
initializeSocketHandlers(io);

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
app.use("/api/organizations", organizationRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/widgets", widgetRoutes);
app.use("/api/filters", filterRoutes);
app.use("/api/calls", callLogRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/custom-fields", customFieldRoutes);
app.use("/api/follow-up", followUpRoutes);
app.use("/api/ai", aiRoutes);

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