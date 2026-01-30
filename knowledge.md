# FlowCRM - Complete Knowledge Base

## 📋 Project Overview

**FlowCRM** is a modern, enterprise-grade Customer Relationship Management (CRM) platform designed for sales teams to manage leads, deals, tasks, and customer relationships efficiently.

### 🎯 Project Goals

1. **Streamline Sales Pipeline** - Track leads from initial contact to closed deals
2. **Real-time Collaboration** - Instant updates across the team via WebSockets
3. **Multi-tenant Architecture** - Support multiple organizations with data isolation
4. **Role-based Access Control** - Granular permissions (OWNER, ADMIN, MANAGER, SALES)
5. **Performance at Scale** - Redis caching, background jobs, optimized queries
6. **Security First** - JWT tokens, 2FA support, audit logging, secure cookies

### 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL (Aiven Cloud) |
| **ORM** | Prisma |
| **Cache** | Redis (Upstash/Redis Cloud) |
| **Job Queue** | BullMQ |
| **Real-time** | Socket.IO |
| **Auth** | JWT + httpOnly Cookies |
| **Email** | Nodemailer (SMTP) |

---

## 🔌 Socket.IO - Real-time Communication

### Overview

Socket.IO enables real-time bidirectional communication between clients and server. It's used for instant notifications, live data updates, and collaborative features.

### Backend Setup (index.ts)

```typescript
import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3001",
        credentials: true,
    },
});

// Store io instance globally for use in other modules
app.set("io", io);

// Connection handling
io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // User joins their personal notification room
    socket.on("joinRoom", (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined room`);
    });

    // User joins organization-wide room
    socket.on("joinOrg", (orgId: string) => {
        socket.join(`org:${orgId}`);
        console.log(`🏢 Joined org room: ${orgId}`);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});
```

### Room Structure

| Room Pattern | Purpose | Who Joins |
|--------------|---------|-----------|
| `user:{userId}` | Personal notifications | Individual user |
| `org:{orgId}` | Organization broadcasts | All org members |

### Socket Events

#### Server → Client (Emitted)

| Event | Description | Payload |
|-------|-------------|---------|
| `newNotification` | New notification for user | `{ id, type, message, link, createdAt }` |
| `notificationRead` | Single notification marked read | `{ notificationId }` |
| `allNotificationsRead` | All marked as read | - |
| `orgEvent` | Generic org-wide event | `{ type, payload }` |
| `lead:created` | New lead created | `{ lead }` |
| `lead:updated` | Lead modified | `{ lead }` |
| `deal:won` | Deal marked as won | `{ deal }` |
| `task:assigned` | Task assigned to user | `{ task }` |

#### Client → Server (Listened)

| Event | Description | Payload |
|-------|-------------|---------|
| `joinRoom` | Join personal room | `userId` |
| `joinOrg` | Join organization room | `orgId` |

### Socket Notification Utility (socketNotification.ts)

```typescript
import { Application } from "express";

export const emitToUser = (app: Application, userId: string, event: string, data: any) => {
    const io = app.get("io");
    io.to(`user:${userId}`).emit(event, data);
};

export const emitToOrg = (app: Application, orgId: string, event: string, data: any) => {
    const io = app.get("io");
    io.to(`org:${orgId}`).emit(event, data);
};

export const emitNotification = (app: Application, userId: string, notification: any) => {
    emitToUser(app, userId, "newNotification", notification);
};
```

### Frontend Socket Context (socket-context.tsx)

```typescript
"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
import { makeRequest } from "@/lib/api-service";
import { toast } from "sonner";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    setUnreadCount: (count: number) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    setUnreadCount: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
            withCredentials: true,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
            // Join personal and org rooms
            socketInstance.emit("joinRoom", user.id);
            socketInstance.emit("joinOrg", user.orgId);
        });

        // Handle new notifications
        socketInstance.on("newNotification", (notification) => {
            setUnreadCount((prev) => prev + 1);
            toast.info(notification.message);
        });

        // Handle real-time data updates
        socketInstance.on("lead:created", (data) => {
            toast.success(`New lead: ${data.lead.name}`);
        });

        socketInstance.on("disconnect", () => setIsConnected(false));

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, unreadCount, setUnreadCount }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
```

### Real-time Update Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Action    │────▶│   Event     │────▶│  Socket.IO  │────▶│  Frontend   │
│  (API Call) │     │  Emitter    │     │  Broadcast  │     │  Context    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                                       │
                           ▼                                       ▼
                    ┌─────────────┐                         ┌─────────────┐
                    │   Queue     │                         │   Toast     │
                    │   (BullMQ)  │                         │   + State   │
                    └─────────────┘                         └─────────────┘
```

---

## 🔴 Redis - Caching & Performance

### Overview

Redis provides high-performance caching to reduce database load and improve response times. It's also used by BullMQ for job queue management and rate limiting.

### Configuration (config/redis.ts)

```typescript
import Redis from "ioredis";

// Environment-based configuration
const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
};

// If using cloud Redis URL (Upstash, Redis Cloud)
const redis = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL) 
    : new Redis(redisConfig);

export default redis;
```

### Cache Utility Functions

```typescript
// Generic cache object with typed methods
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        if (!redisEnabled) return null;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
        if (!redisEnabled) return;
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
    },

    async del(key: string): Promise<void> {
        if (!redisEnabled) return;
        await redis.del(key);
    },

    async delPattern(pattern: string): Promise<void> {
        if (!redisEnabled) return;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    },

    async incr(key: string, ttlSeconds?: number): Promise<number> {
        const count = await redis.incr(key);
        if (ttlSeconds && count === 1) {
            await redis.expire(key, ttlSeconds);
        }
        return count;
    },
};
```

### Cache Key Patterns

```typescript
export const cacheKeys = {
    // Dashboard
    dashboard: (orgId: string, role: string) => `dashboard:${orgId}:${role}`,
    dashboardStats: (orgId: string) => `stats:${orgId}:dashboard`,
    weeklyStats: (orgId: string) => `stats:${orgId}:weekly`,

    // Users
    user: (userId: string) => `user:${userId}`,
    userPermissions: (userId: string) => `permissions:${userId}`,
    userSession: (userId: string) => `session:${userId}`,

    // Organization
    org: (orgId: string) => `org:${orgId}`,
    orgUsers: (orgId: string) => `org:${orgId}:users`,

    // Rate Limiting
    loginAttempts: (ip: string) => `ratelimit:login:${ip}`,
    passwordReset: (email: string) => `ratelimit:passwordreset:${email}`,
    apiRequest: (userId: string, endpoint: string) => `ratelimit:api:${userId}:${endpoint}`,
};
```

### Cache TTL Strategy

| Constant | Duration | Use Case |
|----------|----------|----------|
| `CACHE_TTL.SHORT` | 30 seconds | Frequently changing data |
| `CACHE_TTL.MEDIUM` | 2 minutes | Dashboard stats |
| `CACHE_TTL.LONG` | 5 minutes | User profiles |
| `CACHE_TTL.EXTENDED` | 1 hour | Organization data |

### What Gets Cached

| Data Type | Key Pattern | TTL | Invalidation Trigger |
|-----------|-------------|-----|----------------------|
| Dashboard Stats | `dashboard:{orgId}:{role}` | 2 min | Lead/Deal/Task CRUD |
| Weekly Charts | `stats:{orgId}:weekly` | 2 min | Daily activity |
| User Profile | `user:{userId}` | 5 min | Profile update |
| User Permissions | `permissions:{userId}` | 5 min | Role change |
| Organization | `org:{orgId}` | 1 hour | Org settings change |
| Team Members | `org:{orgId}:users` | 2 min | User CRUD |

### Cache Invalidation (cacheService.ts)

```typescript
// Invalidate dashboard when data changes
export const invalidateDashboardCache = async (orgId: string): Promise<void> => {
    await cache.delPattern(`dashboard:${orgId}:*`);
    await cache.delPattern(`stats:${orgId}:*`);
    console.log(`🗑️ Dashboard cache invalidated for org ${orgId}`);
};

// Invalidate user cache on profile/role changes
export const invalidateUserCache = async (userId: string): Promise<void> => {
    await cache.del(cacheKeys.user(userId));
    await cache.del(cacheKeys.userPermissions(userId));
};

// Invalidate org cache
export const invalidateOrgCache = async (orgId: string): Promise<void> => {
    await cache.del(cacheKeys.org(orgId));
    await cache.del(cacheKeys.orgUsers(orgId));
};
```

---

## 📦 Queue System (BullMQ)

### Overview

BullMQ provides robust background job processing for tasks that shouldn't block API responses - emails, notifications, analytics, and audit logging.

### Queue Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API       │────▶│   Queue     │────▶│   Worker    │
│   Request   │     │   (Redis)   │     │   Process   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
            ┌───────┴───┐   ┌─────┴─────┐
            │  Retry    │   │  Failed   │
            │  Logic    │   │  Handler  │
            └───────────┘   └───────────┘
```

### Queue Definitions (queues/index.ts)

```typescript
import { Queue } from "bullmq";
import redis from "../config/redis";

const connection = { connection: redis };

// Email Queue - For sending emails
export const emailQueue = new Queue("email", {
    ...connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// Notification Queue - For creating in-app notifications
export const notificationQueue = new Queue("notification", {
    ...connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "fixed", delay: 1000 },
        removeOnComplete: 100,
    },
});

// Event Queue - For processing system events
export const eventQueue = new Queue("event", {
    ...connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
    },
});

// Analytics Queue - For updating metrics
export const analyticsQueue = new Queue("analytics", {
    ...connection,
    defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Audit Queue - For creating audit logs
export const auditQueue = new Queue("audit", {
    ...connection,
    defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
    },
});

// Token Cleanup Queue - For scheduled token maintenance
export const tokenCleanupQueue = new Queue("tokenCleanup", {
    ...connection,
    defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 10,
        removeOnFail: 5,
    },
});
```

### Job Data Interfaces

```typescript
interface EmailJobData {
    to: string;
    subject: string;
    html: string;
    metadata?: Record<string, any>;
}

interface NotificationJobData {
    userId: string;
    orgId: string;
    type: "TASK_ASSIGNED" | "USER_ADDED" | "LEAD_ASSIGNED" | "DEAL_UPDATED" | "SYSTEM";
    message: string;
    link?: string;
}

interface EventJobData {
    type: string;
    payload: Record<string, any>;
    orgId: string;
    userId?: string;
}

interface AuditJobData {
    userId: string;
    orgId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
}
```

### Helper Functions

```typescript
// Add jobs to queues with consistent interface
export const addEmailJob = async (data: EmailJobData) => {
    return emailQueue.add("sendEmail", data);
};

export const addNotificationJob = async (data: NotificationJobData) => {
    return notificationQueue.add("createNotification", data);
};

export const addEventJob = async (data: EventJobData) => {
    return eventQueue.add("processEvent", data);
};

export const addAuditJob = async (data: AuditJobData) => {
    return auditQueue.add("createAuditLog", data);
};

// Get queue statistics
export const getQueueStats = async () => {
    const queues = [emailQueue, notificationQueue, eventQueue, analyticsQueue, auditQueue];
    const stats = await Promise.all(
        queues.map(async (queue) => ({
            name: queue.name,
            waiting: await queue.getWaitingCount(),
            active: await queue.getActiveCount(),
            completed: await queue.getCompletedCount(),
            failed: await queue.getFailedCount(),
        }))
    );
    return stats;
};
```

### Workers (queues/workers.ts)

```typescript
import { Worker, Job } from "bullmq";
import redis from "../config/redis";
import prisma from "../config/client";
import { sendEmail } from "../utils/sendEmail";
import { emitNotification } from "../utils/socketNotification";

const connection = { connection: redis };

// Email Worker
const emailWorker = new Worker(
    "email",
    async (job: Job<EmailJobData>) => {
        const { to, subject, html } = job.data;
        console.log(`📧 Sending email to ${to}`);
        
        const result = await sendEmail(to, subject, html);
        
        if (!result.success) {
            throw new Error(`Email failed: ${result.error}`);
        }
        
        console.log(`✅ Email sent: ${result.messageId}`);
        return result;
    },
    { ...connection, concurrency: 5 }
);

// Notification Worker
const notificationWorker = new Worker(
    "notification",
    async (job: Job<NotificationJobData>) => {
        const { userId, orgId, type, message, link } = job.data;
        
        // Create notification in database
        const notification = await prisma.notification.create({
            data: {
                userId,
                orgId,
                type,
                message,
                link,
                read: false,
            },
        });
        
        // Emit real-time notification via Socket.IO
        const app = global.expressApp; // Set during server startup
        if (app) {
            emitNotification(app, userId, notification);
        }
        
        return notification;
    },
    { ...connection, concurrency: 10 }
);

// Event Worker
const eventWorker = new Worker(
    "event",
    async (job: Job<EventJobData>) => {
        const { type, payload, orgId, userId } = job.data;
        
        // Store event in database
        const event = await prisma.event.create({
            data: {
                type,
                payload,
                orgId,
                userId,
            },
        });
        
        return event;
    },
    { ...connection, concurrency: 10 }
);

// Audit Worker
const auditWorker = new Worker(
    "audit",
    async (job: Job<AuditJobData>) => {
        const { userId, orgId, action, entityType, entityId, details, ipAddress } = job.data;
        
        const auditLog = await prisma.auditLog.create({
            data: {
                userId,
                orgId,
                action,
                entityType,
                entityId,
                details,
                ipAddress,
            },
        });
        
        return auditLog;
    },
    { ...connection, concurrency: 10 }
);

// Error handlers for all workers
[emailWorker, notificationWorker, eventWorker, auditWorker].forEach((worker) => {
    worker.on("failed", (job, err) => {
        console.error(`❌ Job ${job?.id} in ${worker.name} failed:`, err.message);
    });
    
    worker.on("completed", (job) => {
        console.log(`✅ Job ${job.id} in ${worker.name} completed`);
    });
});

export const startAllWorkers = () => {
    console.log("🚀 Starting all queue workers...");
    // Workers auto-start when instantiated
    console.log("✅ All queue workers started");
};
```

---

## 🧹 Token Cleanup Service

### Overview

The token cleanup service automatically revokes and removes expired refresh tokens to maintain database hygiene and security.

### Configuration

```typescript
// services/tokenCleanupService.ts

const TOKEN_EXPIRY_DAYS = 7;  // Tokens older than 7 days without activity
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const HARD_DELETE_DAYS = 30; // Permanently delete revoked tokens after 30 days
```

### Cleanup Logic

```typescript
export const cleanupExpiredTokens = async (): Promise<CleanupResult> => {
    const expiryDate = new Date(Date.now() - TOKEN_EXPIRY_MS);
    const hardDeleteDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    console.log("🧹 Starting token cleanup...");
    console.log(`📅 Looking for tokens created before: ${expiryDate.toISOString()}`);
    
    // Find tokens to revoke (not used in 7 days)
    const expiredTokens = await prisma.refreshToken.findMany({
        where: {
            createdAt: { lt: expiryDate },
            revoked: false,
        },
        select: { id: true, userId: true },
    });
    
    if (expiredTokens.length === 0) {
        console.log("✅ No expired tokens found");
        return { success: true, revokedCount: 0, deletedCacheCount: 0 };
    }
    
    console.log(`📊 Found ${expiredTokens.length} expired tokens to revoke`);
    
    // Batch revoke in transaction
    await prisma.$transaction(
        expiredTokens.map((token) =>
            prisma.refreshToken.update({
                where: { id: token.id },
                data: { revoked: true },
            })
        )
    );
    
    // Clear Redis cache for affected users
    const uniqueUserIds = [...new Set(expiredTokens.map((t) => t.userId))];
    for (const userId of uniqueUserIds) {
        await cache.del(cacheKeys.userSession(userId));
        await cache.del(cacheKeys.user(userId));
    }
    
    // Hard delete very old revoked tokens
    const deleted = await prisma.refreshToken.deleteMany({
        where: {
            revoked: true,
            createdAt: { lt: hardDeleteDate },
        },
    });
    
    console.log(`🗑️ Permanently deleted ${deleted.count} old revoked tokens`);
    
    return {
        success: true,
        revokedCount: expiredTokens.length,
        deletedCacheCount: uniqueUserIds.length,
        permanentlyDeleted: deleted.count,
    };
};
```

### Scheduling

```typescript
// Worker for scheduled cleanup
const tokenCleanupWorker = new Worker(
    "tokenCleanup",
    async (job: Job) => {
        console.log(`🔄 Token cleanup job started (Job ID: ${job.id})`);
        const result = await cleanupExpiredTokens();
        console.log(`✅ Token cleanup job ${job.id} completed:`, result);
        return result;
    },
    { ...connection, concurrency: 1 }
);

// Schedule daily cleanup at midnight
export const scheduleTokenCleanup = async () => {
    // Remove existing scheduled jobs
    await tokenCleanupQueue.obliterate({ force: true });
    
    // Add recurring job (cron: midnight daily)
    await tokenCleanupQueue.add(
        "scheduledCleanup",
        {},
        {
            repeat: { pattern: "0 0 * * *" }, // Every day at midnight
            jobId: "daily-token-cleanup",
        }
    );
    
    console.log("⏰ Token cleanup scheduler initialized - runs daily at midnight");
};

// Manual trigger for admin use
export const triggerTokenCleanup = async () => {
    return tokenCleanupQueue.add("manualCleanup", {}, { priority: 1 });
};
```

### Startup Integration (index.ts)

```typescript
// In server startup
import { scheduleTokenCleanup, triggerTokenCleanup } from "./services/tokenCleanupService";

// After server starts
scheduleTokenCleanup();
triggerTokenCleanup(); // Run once on startup
```

---

## 🔐 Two-Factor Authentication (2FA)

### Overview

FlowCRM supports Time-based One-Time Password (TOTP) authentication using authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator.

### Libraries Used

```typescript
import speakeasy from "speakeasy";  // TOTP generation/verification
import qrcode from "qrcode";        // QR code generation
```

### Database Schema

```prisma
model User {
    // ... other fields
    twoFactorEnabled Boolean @default(false)
    twoFactorSecret  String? // Base32 encoded secret
}
```

### Setup Flow

#### Step 1: Generate Secret (POST /api/2fa/setup)

```typescript
export const setup2FA = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user?.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
    }
    
    // Generate a new secret
    const secret = speakeasy.generateSecret({
        name: `FlowCRM (${user.email})`, // Shows in authenticator app
        length: 20,
    });
    
    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret.base32 },
    });
    
    // Generate QR code for easy scanning
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
    
    return res.json({
        secret: secret.base32,    // For manual entry
        qrCode: qrCodeUrl,        // Data URL for <img src="">
        message: "Scan the QR code with your authenticator app",
    });
};
```

#### Step 2: Verify & Enable (POST /api/2fa/verify)

```typescript
export const verify2FA = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { token } = req.body; // 6-digit code from authenticator
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user?.twoFactorSecret) {
        return res.status(400).json({ message: "2FA setup not initiated" });
    }
    
    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
        window: 1, // Allow 1 step before/after for clock drift (±30 seconds)
    });
    
    if (!verified) {
        return res.status(400).json({ message: "Invalid verification code" });
    }
    
    // Enable 2FA
    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
    });
    
    return res.json({ message: "2FA enabled successfully" });
};
```

### Login with 2FA

```typescript
export const login = async (req: Request, res: Response) => {
    const { email, password, twoFactorToken } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Verify password...
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check if 2FA is required
    if (user.twoFactorEnabled) {
        if (!twoFactorToken) {
            // First step: password correct, need 2FA
            return res.json({
                requires2FA: true,
                userId: user.id,
                message: "Please enter your 2FA code",
            });
        }
        
        // Verify 2FA token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret!,
            encoding: "base32",
            token: twoFactorToken,
            window: 1,
        });
        
        if (!verified) {
            return res.status(401).json({ message: "Invalid 2FA code" });
        }
    }
    
    // Issue tokens...
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set cookie and return
    res.cookie("refreshToken", refreshToken, { httpOnly: true, ... });
    return res.json({ accessToken, user: sanitizeUser(user) });
};
```

### Disable 2FA (POST /api/2fa/disable)

```typescript
export const disable2FA = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { password, token } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Require both password and current 2FA token to disable
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
    }
    
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: "base32",
        token,
        window: 1,
    });
    
    if (!verified) {
        return res.status(401).json({ message: "Invalid 2FA code" });
    }
    
    // Disable 2FA
    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
        },
    });
    
    return res.json({ message: "2FA disabled successfully" });
};
```

### Frontend Flow

```typescript
// Login component
const [requires2FA, setRequires2FA] = useState(false);
const [twoFactorToken, setTwoFactorToken] = useState("");

const handleLogin = async () => {
    const result = await login(email, password, requires2FA ? twoFactorToken : undefined);
    
    if (result.requires2FA) {
        setRequires2FA(true);
        // Show 2FA input field
        return;
    }
    
    // Login successful
    router.push("/dashboard");
};
```

---

## 🔑 Authentication System

### Overview

FlowCRM uses a dual-token authentication system with short-lived access tokens and long-lived refresh tokens stored in httpOnly cookies.

### Token Types

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| **Access Token** | Memory (frontend) | 15 minutes | API authorization |
| **Refresh Token** | httpOnly cookie + DB | 7 days | Get new access tokens |

### Token Generation (utils/generateToken.ts)

```typescript
import jwt from "jsonwebtoken";

export const generateAccessToken = (user: User): string => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            orgId: user.orgId,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (user: User): string => {
    return jwt.sign(
        {
            userId: user.id,
            orgId: user.orgId,
        },
        process.env.REFRESH_TOKEN!,
        { expiresIn: "7d" }
    );
};
```

### Refresh Token Storage

```typescript
import crypto from "crypto";

// Store only the hash in database (security best practice)
const storeRefreshToken = async (userId: string, token: string) => {
    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    
    await prisma.refreshToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
};

// Verify refresh token
const verifyRefreshToken = async (token: string): Promise<boolean> => {
    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    
    const storedToken = await prisma.refreshToken.findFirst({
        where: {
            tokenHash,
            revoked: false,
            expiresAt: { gt: new Date() },
        },
    });
    
    return !!storedToken;
};
```

### Cookie Configuration

```typescript
// Set refresh token cookie
res.cookie("refreshToken", refreshToken, {
    httpOnly: true,       // Not accessible via JavaScript (XSS protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
});

// Clear cookie on logout
res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
});
```

### Auth Middleware (middleware/isAuth.ts)

```typescript
import jwt from "jsonwebtoken";

const isAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        
        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            orgId: decoded.orgId,
        };
        
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default isAuth;
```

### Role-based Authorization (middleware/isRole.ts)

```typescript
type Role = "OWNER" | "ADMIN" | "MANAGER" | "SALES";

const roleHierarchy: Record<Role, number> = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    SALES: 1,
};

const requireRole = (...allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role as Role;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        }
        
        next();
    };
};

export default requireRole;
```

### Frontend Token Handling (contexts/auth-context.tsx)

```typescript
// Access token stored in memory only (not localStorage)
const [accessToken, setAccessToken] = useState<string | null>(null);
const accessTokenRef = useRef<string | null>(null);

// Sync ref with state for stable closure access
useEffect(() => {
    accessTokenRef.current = accessToken;
}, [accessToken]);

// Token refresh function
const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshing.current) return accessTokenRef.current;
    
    isRefreshing.current = true;
    try {
        const response = await fetch(`${API_BASE}/auth/refresh-token`, {
            method: "POST",
            credentials: "include", // Sends httpOnly cookie
        });
        
        if (!response.ok) {
            setAccessToken(null);
            setUser(null);
            localStorage.removeItem("user");
            return null;
        }
        
        const data = await response.json();
        setAccessToken(data.accessToken);
        accessTokenRef.current = data.accessToken;
        return data.accessToken;
    } finally {
        isRefreshing.current = false;
    }
}, []);

// Auto-refresh every 14 minutes (before 15min expiry)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

const setupTokenRefresh = useCallback(() => {
    refreshIntervalRef.current = setInterval(async () => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            await refreshAccessToken();
        }
    }, TOKEN_REFRESH_INTERVAL);
}, [refreshAccessToken]);
```

### API Service with Auto-refresh (lib/api-service.ts)

```typescript
// Token handlers set by auth context
let getAccessToken: () => string | null = () => null;
let refreshToken: () => Promise<string | null> = async () => null;

export function setTokenHandlers(
    getter: () => string | null,
    refresher: () => Promise<string | null>
) {
    getAccessToken = getter;
    refreshToken = refresher;
}

export async function makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
): Promise<T> {
    const token = getAccessToken();
    
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
    });
    
    // Handle 401 - try to refresh and retry once
    if (response.status === 401 && retry) {
        const newToken = await refreshToken();
        if (newToken) {
            return makeRequest(endpoint, options, false); // Retry with new token
        }
        throw new Error("Session expired. Please login again.");
    }
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `API error: ${response.status}`);
    }
    
    return response.json();
}
```

---

## 📧 Email System

### Overview

FlowCRM uses Nodemailer with SMTP to send transactional emails like welcome messages, password resets, and notifications.

### Configuration

```typescript
// Environment variables
SMTP_HOST=smtp.example.com
SMTP_PORT=465           // 465 for SSL, 587 for STARTTLS
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM="FlowCRM <noreply@flowcrm.com>"
```

### Email Utility (utils/sendEmail.ts)

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: any;
}

export const sendEmail = async (
    to: string,
    subject: string,
    html: string
): Promise<EmailResult> => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html,
        });
        
        console.log(`📧 Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Email send failed:", error);
        return { success: false, error };
    }
};
```

### Email Templates (utils/emailTemplate.ts)

```typescript
export const welcomeEmailTemplate = (name: string, orgName: string): string => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ${orgName}! 🎉</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been created successfully. You can now login and start managing your sales pipeline.</p>
            <p>Here's what you can do:</p>
            <ul>
                <li>📊 Track leads and deals</li>
                <li>✅ Manage tasks and activities</li>
                <li>📈 View real-time analytics</li>
                <li>👥 Collaborate with your team</li>
            </ul>
            <a href="${process.env.CLIENT_URL}/login" class="button">Login to FlowCRM</a>
            <p style="margin-top: 30px;">– The FlowCRM Team</p>
        </div>
    </div>
</body>
</html>
`;

export const passwordResetTemplate = (name: string, resetLink: string): string => `
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Similar styling */
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
`;

export const taskAssignedTemplate = (assigneeName: string, taskTitle: string, assignerName: string): string => `
<!DOCTYPE html>
<html>
<head>
    <style>/* ... */</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Task Assigned</h1>
        </div>
        <div class="content">
            <p>Hi ${assigneeName},</p>
            <p><strong>${assignerName}</strong> has assigned you a new task:</p>
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #6366f1;">
                <strong>${taskTitle}</strong>
            </div>
            <a href="${process.env.CLIENT_URL}/tasks" class="button">View Task</a>
        </div>
    </div>
</body>
</html>
`;
```

### Queue Integration

```typescript
// Emails are sent via BullMQ queue for reliability
import { addEmailJob } from "../queues";
import { welcomeEmailTemplate } from "../utils/emailTemplate";

// In user registration
await addEmailJob({
    to: user.email,
    subject: `Welcome to ${org.name}!`,
    html: welcomeEmailTemplate(user.name, org.name),
});
```

---

## 🔒 Rate Limiting

### Overview

Rate limiting protects against brute force attacks and API abuse using Redis-backed counters.

### Implementation (middleware/rateLimiter.ts)

```typescript
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import redis from "../config/redis";

// Login rate limiter - stricter
const loginLimiter = redis.status === "ready"
    ? new RateLimiterRedis({
          storeClient: redis,
          keyPrefix: "ratelimit:login",
          points: 5,         // 5 attempts
          duration: 60,      // per 60 seconds
          blockDuration: 300, // block for 5 minutes if exceeded
      })
    : new RateLimiterMemory({
          points: 5,
          duration: 60,
          blockDuration: 300,
      });

// General API rate limiter
const apiLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "ratelimit:api",
    points: 100,        // 100 requests
    duration: 60,       // per minute
});

// Password reset limiter
const passwordResetLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "ratelimit:passwordreset",
    points: 3,          // 3 attempts
    duration: 3600,     // per hour
    blockDuration: 3600, // block for 1 hour
});

// Middleware functions
export const rateLimitLogin = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    
    try {
        await loginLimiter.consume(ip);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            return res.status(429).json({
                message: "Too many login attempts. Please try again later.",
                retryAfter: Math.ceil(error.msBeforeNext / 1000),
            });
        }
        next();
    }
};

export const rateLimitApi = async (req: Request, res: Response, next: NextFunction) => {
    const key = (req as any).user?.userId || req.ip;
    
    try {
        const result = await apiLimiter.consume(key);
        
        // Add rate limit headers
        res.set("X-RateLimit-Limit", "100");
        res.set("X-RateLimit-Remaining", String(result.remainingPoints));
        res.set("X-RateLimit-Reset", String(Math.ceil(Date.now() / 1000) + 60));
        
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            return res.status(429).json({ message: "Too many requests" });
        }
        next();
    }
};
```

### Rate Limits Summary

| Endpoint | Limit | Window | Block Duration |
|----------|-------|--------|----------------|
| Login | 5 attempts | 1 minute | 5 minutes |
| Password Reset | 3 attempts | 1 hour | 1 hour |
| General API | 100 requests | 1 minute | - |
| Strict API (sensitive) | 10 requests | 1 minute | 2 minutes |

---

## 📊 Database Schema

### Entity Relationship

```
┌─────────────────┐
│  Organization   │
│─────────────────│
│  id             │
│  name           │
│  createdAt      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐      ┌─────────────────┐
│     User        │      │  RefreshToken   │
│─────────────────│      │─────────────────│
│  id             │◄────▶│  id             │
│  email          │ 1:N  │  userId         │
│  password       │      │  tokenHash      │
│  role           │      │  expiresAt      │
│  twoFactorSecret│      │  revoked        │
│  orgId          │      └─────────────────┘
└────────┬────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    │         │         │         │
    ▼         ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌────────────┐
│ Lead  │ │ Deal  │ │ Task  │ │Notification│
└───────┘ └───────┘ └───────┘ └────────────┘
```

### Prisma Models

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users         User[]
  leads         Lead[]
  deals         Deal[]
  tasks         Task[]
  notifications Notification[]
  events        Event[]
  auditLogs     AuditLog[]
}

model User {
  id               String   @id @default(uuid())
  email            String   @unique
  password         String
  name             String
  role             Role     @default(SALES)
  twoFactorEnabled Boolean  @default(false)
  twoFactorSecret  String?
  orgId            String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  organization  Organization   @relation(fields: [orgId], references: [id])
  leads         Lead[]         @relation("LeadOwner")
  assignedLeads Lead[]         @relation("LeadAssignee")
  deals         Deal[]         @relation("DealOwner")
  assignedDeals Deal[]         @relation("DealAssignee")
  tasks         Task[]         @relation("TaskCreator")
  assignedTasks Task[]         @relation("TaskAssignee")
  notifications Notification[]
  refreshTokens RefreshToken[]
  auditLogs     AuditLog[]
}

enum Role {
  OWNER
  ADMIN
  MANAGER
  SALES
}

model Lead {
  id           String     @id @default(uuid())
  name         String
  email        String
  company      String?
  phone        String?
  status       LeadStatus @default(NEW)
  value        Float      @default(0)
  source       String?
  notes        String?
  ownerId      String
  assignedToId String?
  orgId        String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  owner        User          @relation("LeadOwner", fields: [ownerId], references: [id])
  assignedTo   User?         @relation("LeadAssignee", fields: [assignedToId], references: [id])
  organization Organization  @relation(fields: [orgId], references: [id])
  activities   Activity[]
  deals        Deal[]
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL
  WON
  LOST
}

model Deal {
  id           String    @id @default(uuid())
  title        String
  value        Float     @default(0)
  stage        DealStage @default(QUALIFICATION)
  probability  Int       @default(0)
  expectedClose DateTime?
  ownerId      String
  assignedToId String?
  leadId       String?
  orgId        String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  owner        User         @relation("DealOwner", fields: [ownerId], references: [id])
  assignedTo   User?        @relation("DealAssignee", fields: [assignedToId], references: [id])
  lead         Lead?        @relation(fields: [leadId], references: [id])
  organization Organization @relation(fields: [orgId], references: [id])
}

enum DealStage {
  QUALIFICATION
  PROPOSAL
  NEGOTIATION
  CLOSED_WON
  CLOSED_LOST
}

model Task {
  id           String       @id @default(uuid())
  title        String
  description  String?
  status       TaskStatus   @default(TODO)
  priority     TaskPriority @default(MEDIUM)
  dueDate      DateTime?
  createdById  String
  assignedToId String
  leadId       String?
  dealId       String?
  orgId        String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  createdBy    User         @relation("TaskCreator", fields: [createdById], references: [id])
  assignedTo   User         @relation("TaskAssignee", fields: [assignedToId], references: [id])
  organization Organization @relation(fields: [orgId], references: [id])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  orgId     String
  type      NotificationType
  message   String
  link      String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [orgId], references: [id])
}

enum NotificationType {
  TASK_ASSIGNED
  USER_ADDED
  LEAD_ASSIGNED
  DEAL_UPDATED
  SYSTEM
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Activity {
  id        String       @id @default(uuid())
  leadId    String
  type      ActivityType
  content   String
  createdAt DateTime     @default(now())

  lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
}

enum ActivityType {
  NOTE
  CALL
  EMAIL
  MEETING
}

model Event {
  id        String   @id @default(uuid())
  type      String
  payload   Json
  orgId     String
  userId    String?
  createdAt DateTime @default(now())

  organization Organization @relation(fields: [orgId], references: [id])
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  orgId      String
  action     String
  entityType String?
  entityId   String?
  details    Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [orgId], references: [id])
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance (optional but recommended)

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@host:5432/flowcrm"
JWT_SECRET="your-jwt-secret-key"
REFRESH_TOKEN="your-refresh-token-secret"
CLIENT_URL="http://localhost:3001"

# Redis (optional)
REDIS_ENABLED=true
REDIS_URL="redis://user:password@host:port"

# SMTP (optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_USER="user@example.com"
SMTP_PASS="password"
SMTP_FROM="FlowCRM <noreply@flowcrm.com>"
```

```bash
# Frontend (.env)
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### Running the Project

```bash
# Backend
cd Backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed  # Optional: seed demo data
npm run dev         # Starts on port 3000

# Frontend
cd frontend
npm install
npm run dev         # Starts on port 3001
```

### Demo Credentials (after seeding)

| Email | Password | Role | Organization |
|-------|----------|------|--------------|
| owner@techcorp.com | password | OWNER | TechCorp Solutions |
| admin@techcorp.com | password | ADMIN | TechCorp Solutions |
| manager@techcorp.com | password | MANAGER | TechCorp Solutions |
| owner@startuphub.com | password | OWNER | StartupHub Inc |
| admin@example.com | password | ADMIN | Demo Company |

---

## 📁 Project Structure

```
FlowCRM/
├── Backend/
│   ├── index.ts              # Express + Socket.IO server
│   ├── package.json
│   ├── tsconfig.json
│   ├── config/
│   │   ├── client.ts         # Prisma client
│   │   └── redis.ts          # Redis connection
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── dealController.ts
│   │   ├── leadController.ts
│   │   ├── notificationController.ts
│   │   ├── taskController.ts
│   │   ├── twoFactorController.ts
│   │   └── userController.ts
│   ├── middleware/
│   │   ├── isAuth.ts         # JWT verification
│   │   ├── isRole.ts         # Role-based access
│   │   └── rateLimiter.ts    # Rate limiting
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Demo data seeder
│   │   └── migrations/       # Migration history
│   ├── queues/
│   │   ├── index.ts          # Queue definitions
│   │   └── workers.ts        # Job processors
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── dealRoutes.ts
│   │   ├── leadRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── organizationRoutes.ts
│   │   ├── taskRoutes.ts
│   │   ├── twoFactorRoutes.ts
│   │   └── userRoutes.ts
│   ├── services/
│   │   ├── cacheService.ts   # Cache layer
│   │   ├── eventEmitter.ts   # Event-driven updates
│   │   └── tokenCleanupService.ts
│   └── utils/
│       ├── emailTemplate.ts
│       ├── generateToken.ts
│       ├── sendEmail.ts
│       ├── socketNotification.ts
│       └── tryCatch.ts
│
└── frontend/
    ├── app/                  # Next.js App Router
    │   ├── layout.tsx
    │   ├── layout-app.tsx
    │   ├── globals.css
    │   ├── dashboard/
    │   ├── deals/
    │   ├── leads/
    │   ├── login/
    │   ├── notifications/
    │   ├── organizations/
    │   ├── settings/
    │   ├── tasks/
    │   └── users/
    ├── components/
    │   ├── ui/               # shadcn/ui components
    │   ├── activity-feed.tsx
    │   ├── create-lead-modal.tsx
    │   ├── create-task-modal.tsx
    │   ├── dashboard-charts.tsx
    │   ├── leads-table.tsx
    │   ├── protected-route.tsx
    │   ├── sidebar-nav.tsx
    │   ├── tasks-table.tsx
    │   └── theme-toggle.tsx
    ├── contexts/
    │   ├── auth-context.tsx  # Auth state management
    │   └── socket-context.tsx # Real-time connection
    ├── hooks/
    │   └── use-mobile.tsx
    └── lib/
        ├── api-service.ts    # API client
        └── utils.ts
```

---

## 🎯 Event-Driven Architecture (EventEmitter)

### Overview

FlowCRM uses an event-driven architecture that decouples actions from their side effects. When something happens (lead created, task assigned, deal won), an event is emitted that triggers notifications, cache invalidation, audit logging, and real-time broadcasts.

### Event Types (46 Total)

#### Lead Events
| Event | Trigger | Creates Notification | Audit Logged |
|-------|---------|---------------------|--------------|
| `lead:created` | New lead added | ✅ (to assignee) | ✅ |
| `lead:updated` | Lead modified | ❌ | ✅ |
| `lead:deleted` | Lead removed | ❌ | ✅ |
| `lead:assigned` | Lead reassigned | ✅ (to new assignee) | ✅ |
| `lead:status_changed` | Status update | ❌ | ✅ |
| `lead:converted` | Lead → Deal | ✅ | ✅ |

#### Deal Events
| Event | Trigger | Creates Notification | Audit Logged |
|-------|---------|---------------------|--------------|
| `deal:created` | New deal added | ✅ (to assignee) | ✅ |
| `deal:updated` | Deal modified | ✅ | ✅ |
| `deal:deleted` | Deal removed | ❌ | ✅ |
| `deal:stage_changed` | Pipeline movement | ✅ | ✅ |
| `deal:assigned` | Deal reassigned | ✅ (to new assignee) | ✅ |
| `deal:won` | Deal closed won | ✅ (org broadcast) | ✅ |
| `deal:lost` | Deal closed lost | ❌ | ✅ |

#### Task Events
| Event | Trigger | Creates Notification | Audit Logged |
|-------|---------|---------------------|--------------|
| `task:created` | New task added | ✅ (to assignee) | ✅ |
| `task:updated` | Task modified | ❌ | ✅ |
| `task:deleted` | Task removed | ❌ | ✅ |
| `task:assigned` | Task reassigned | ✅ (to new assignee) | ✅ |
| `task:completed` | Task done | ✅ (to creator) | ✅ |
| `task:overdue` | Past due date | ✅ (to assignee) | ❌ |
| `task:due_soon` | Due within 24h | ✅ (to assignee) | ❌ |

#### User Events
| Event | Trigger | Creates Notification | Audit Logged |
|-------|---------|---------------------|--------------|
| `user:created` | New user added | ✅ (welcome) | ✅ |
| `user:updated` | Profile changed | ❌ | ✅ |
| `user:deleted` | User removed | ❌ | ✅ |
| `user:role_changed` | Role updated | ✅ | ✅ |
| `user:password_changed` | Password updated | ❌ | ✅ |
| `user:2fa_enabled` | 2FA activated | ❌ | ✅ |
| `user:2fa_disabled` | 2FA deactivated | ❌ | ✅ |
| `user:login` | User logged in | ❌ | ✅ |

### Event Emission Flow

```typescript
// services/eventEmitter.ts

export const emitEvent = async (
    app: Application,
    eventType: string,
    payload: Record<string, any>,
    orgId: string,
    userId?: string
) => {
    // 1. Store event in database via queue
    await addEventJob({ type: eventType, payload, orgId, userId });
    
    // 2. Create audit log for important events
    if (shouldAudit(eventType) && userId) {
        await addAuditJob({
            userId,
            orgId,
            action: eventType,
            entityType: getEntityType(eventType),
            entityId: payload.id,
            details: payload,
        });
    }
    
    // 3. Create notification if applicable
    const notificationType = getNotificationType(eventType);
    if (notificationType && payload.assignedToId) {
        await addNotificationJob({
            userId: payload.assignedToId,
            orgId,
            type: notificationType,
            message: generateNotificationMessage(eventType, payload),
            link: generateLink(eventType, payload),
        });
    }
    
    // 4. Broadcast via Socket.IO
    emitToOrg(app, orgId, eventType, payload);
    
    // 5. Invalidate caches
    await handleCacheInvalidation(eventType, orgId);
};
```

### Cache Invalidation Rules

```typescript
const handleCacheInvalidation = async (eventType: string, orgId: string) => {
    // Dashboard stats invalidation
    const dashboardInvalidatingEvents = [
        'lead:created', 'lead:deleted', 'lead:converted',
        'deal:created', 'deal:deleted', 'deal:won', 'deal:lost',
        'task:created', 'task:deleted', 'task:completed',
    ];
    
    if (dashboardInvalidatingEvents.includes(eventType)) {
        await invalidateDashboardCache(orgId);
    }
};
```

---

## 📊 Dashboard API Endpoints

### Overview

The dashboard provides comprehensive analytics and metrics for sales performance tracking.

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/dashboard/stats` | GET | All | Main dashboard statistics |
| `/api/dashboard/weekly` | GET | All | Weekly performance charts |
| `/api/dashboard/pipeline` | GET | All | Deal pipeline by stage |
| `/api/dashboard/lead-status` | GET | All | Lead distribution by status |
| `/api/dashboard/lead-sources` | GET | All | Lead distribution by source |
| `/api/dashboard/task-status` | GET | All | Task distribution by status |
| `/api/dashboard/overdue-tasks` | GET | All | List of overdue tasks |
| `/api/dashboard/team-performance` | GET | Admin+ | Team metrics (sales by user) |
| `/api/dashboard/activity` | GET | All | Recent activity feed |
| `/api/dashboard/admin/cleanup-tokens` | POST | Admin | Trigger token cleanup |
| `/api/dashboard/admin/token-stats` | GET | Admin | Token statistics |

### Dashboard Stats Response

```typescript
// GET /api/dashboard/stats
{
    totalLeads: 156,
    totalDeals: 42,
    totalTasks: 89,
    openTasks: 34,
    leadsThisWeek: 23,
    dealsWonThisMonth: 8,
    dealValueThisMonth: 125000,
    conversionRate: 27,  // percentage
    pipelineValue: 542000,
}
```

### Pipeline Stats Response

```typescript
// GET /api/dashboard/pipeline
[
    { stage: "QUALIFICATION", count: 15, value: 120000 },
    { stage: "DISCOVERY", count: 8, value: 95000 },
    { stage: "PROPOSAL", count: 6, value: 180000 },
    { stage: "NEGOTIATION", count: 4, value: 147000 },
    { stage: "CLOSED_WON", count: 8, value: 0 },
    { stage: "CLOSED_LOST", count: 3, value: 0 },
]
```

---

## 👥 Lead Management

### Lead Statuses

| Status | Description | Color |
|--------|-------------|-------|
| `NEW` | Fresh lead, not contacted | Blue |
| `CONTACTED` | Initial contact made | Yellow |
| `QUALIFIED` | Meets criteria, has budget | Purple |
| `PROPOSAL` | Proposal sent | Orange |
| `WON` | Converted to deal | Green |
| `LOST` | Disqualified or lost | Red |

### Lead Sources

- Website
- Referral
- LinkedIn
- Cold Call
- Trade Show
- Email Campaign
- Partner

### Lead API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/leads` | GET | All | List leads (SALES sees only owned) |
| `/api/leads` | POST | All | Create new lead |
| `/api/leads/:id` | GET | All | Get lead details with activities |
| `/api/leads/:id` | PUT | All | Update lead |
| `/api/leads/:id` | DELETE | Admin+ | Delete lead |

---

## 💼 Deal Management

### Deal Stages (Pipeline)

| Stage | Description | Probability |
|-------|-------------|-------------|
| `QUALIFICATION` | Initial assessment | 10% |
| `DISCOVERY` | Understanding needs | 25% |
| `PROPOSAL` | Proposal submitted | 50% |
| `NEGOTIATION` | Terms discussion | 75% |
| `CLOSED_WON` | Deal won! | 100% |
| `CLOSED_LOST` | Deal lost | 0% |

### Deal API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/deals` | GET | All | List all deals |
| `/api/deals` | POST | All | Create new deal |
| `/api/deals/:id` | GET | All | Get deal with lead & tasks |
| `/api/deals/:id` | PUT | All | Update deal (stage changes tracked) |
| `/api/deals/:id` | DELETE | Admin+ | Delete deal |

---

## ✅ Task Management

### Task Statuses

| Status | Description |
|--------|-------------|
| `TODO` | Not started |
| `IN_PROGRESS` | Currently working |
| `DONE` | Completed |

### Task Priorities

| Priority | Description | Color |
|----------|-------------|-------|
| `LOW` | Can wait | Gray |
| `MEDIUM` | Normal priority | Yellow |
| `HIGH` | Urgent | Red |

### Task API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/tasks` | GET | All | List tasks (SALES sees only assigned) |
| `/api/tasks` | POST | Admin/Manager | Create task |
| `/api/tasks/:id` | PUT | All | Update task |
| `/api/tasks/:id` | DELETE | Admin/Manager | Delete task |

---

## 📝 Activity Tracking

### Activity Types

| Type | Description | Icon |
|------|-------------|------|
| `NOTE` | General note/comment | 📝 |
| `CALL` | Phone call logged | 📞 |
| `EMAIL` | Email sent/received | 📧 |
| `MEETING` | Meeting scheduled/completed | 📅 |

---

## 🔔 Notification System

### Notification Types

| Type | Trigger | Message Template |
|------|---------|------------------|
| `TASK_ASSIGNED` | Task assigned to user | "You've been assigned a new task: {title}" |
| `USER_ADDED` | New user added to org | "Welcome to {orgName}!" |
| `LEAD_ASSIGNED` | Lead assigned to user | "You've been assigned lead: {name}" |
| `DEAL_UPDATED` | Deal stage changed | "Deal {title} moved to {stage}" |
| `SYSTEM` | System announcements | Various |

### Notification API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/notifications` | GET | All | Get user's notifications |
| `/api/notifications/:id/read` | PUT | All | Mark as read |
| `/api/notifications/read-all` | PUT | All | Mark all as read |

---

## 👤 User Management

### User Roles & Hierarchy

```
OWNER (4) ─────┬───▶ Full system access, can manage all orgs
ADMIN (3) ────┼───▶ Organization admin, can add MANAGER/SALES
MANAGER (2) ──┼───▶ Team lead, can assign tasks to SALES
SALES (1) ────┴───▶ Individual contributor, own leads only
```

### User API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users` | GET | Admin+ | List org users |
| `/api/users` | POST | Admin+ | Add new employee |
| `/api/users/:id` | GET | All | Get user profile |
| `/api/users/:id` | PUT | Admin+ | Update user |
| `/api/users/:id` | DELETE | Admin+ | Remove user |

---

## 📈 Audit Logging

### Audited Actions

| Action | Entity | Details Logged |
|--------|--------|----------------|
| `user:login` | User | IP, User Agent |
| `user:logout` | User | Session duration |
| `user:created` | User | New user details |
| `user:role_changed` | User | Old role → New role |
| `user:password_changed` | User | (no details) |
| `user:2fa_enabled` | User | - |
| `user:2fa_disabled` | User | - |
| `lead:created` | Lead | Lead details |
| `lead:deleted` | Lead | Lead details |
| `deal:won` | Deal | Deal value |
| `deal:lost` | Deal | Deal value, reason |

---

## 🌱 Seed Data

### Default Credentials

| Organization | Email | Password | Role |
|--------------|-------|----------|------|
| TechCorp Solutions | owner@techcorp.com | password | OWNER |
| TechCorp Solutions | admin@techcorp.com | password | ADMIN |
| TechCorp Solutions | manager@techcorp.com | password | MANAGER |
| TechCorp Solutions | sales1@techcorp.com | password | SALES |
| StartupHub Inc | owner@startuphub.com | password | OWNER |
| Demo Company | admin@example.com | password | ADMIN |

### Running the Seed

```bash
cd Backend
npx prisma db seed
```

---

## 🖥️ Frontend Components

### Dashboard Charts

| Component | Type | Data Source |
|-----------|------|-------------|
| `LeadsChart` | Bar Chart | `/dashboard/weekly` |
| `RevenueChart` | Area Chart | `/dashboard/weekly` |
| `DealsPipelineChart` | Pie Chart | `/dashboard/pipeline` |
| `TasksChart` | Line Chart | `/dashboard/weekly` |
| `TeamPerformanceChart` | Horizontal Bar | `/dashboard/team-performance` |
| `StatsCard` | KPI Card | `/dashboard/stats` |

### StatsCard Variants

```typescript
interface StatsCardProps {
    title: string;
    value: string | number;
    description: string;
    trend?: number;        // +/- percentage
    icon?: ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning';
}
```

### Table Components

- **LeadsTable** - Search, filter by status, real-time updates, RBAC actions
- **TasksTable** - Search, filter by status/priority, inline status change

### Modal Components

- `CreateLeadModal` - New lead form
- `CreateTaskModal` - New task form with user selection
- `CreateDealModal` - New deal form with lead association

---

## 🔄 API Service (Frontend)

### Token Handling

```typescript
// Auto-retry on 401
if (response.status === 401 && retry) {
    const newToken = await refreshToken();
    if (newToken) {
        return makeRequest(endpoint, options, false);
    }
    throw new Error('Session expired');
}
```

---

## 🎨 UI/UX Features

### Theme System
- Light mode with soft blue accents
- Dark mode with purple accents
- System preference detection
- Persistent theme storage

### Responsive Design
- Desktop sidebar navigation
- Mobile hamburger menu
- Responsive tables (horizontal scroll on mobile)
- Touch-friendly controls

---

## 📝 License

This project is for educational and demonstration purposes.

---

*Last updated: January 2026*
