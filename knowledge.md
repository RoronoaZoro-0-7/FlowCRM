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

---

## ⭐ Complete Feature Overview

### 🔐 Authentication & Security Features

| Feature | Description | Location |
|---------|-------------|----------|
| **JWT Authentication** | Access tokens (15min) + Refresh tokens (7 days) in httpOnly cookies | `Backend/utils/generateToken.ts` |
| **Two-Factor Auth (2FA)** | TOTP-based 2FA using Google Authenticator/Authy | `Backend/controllers/twoFactorController.ts` |
| **Rate Limiting** | Redis-backed rate limiting (5 login attempts/min, 100 API/min) | `Backend/middleware/rateLimiter.ts` |
| **Role-Based Access** | OWNER > ADMIN > MANAGER > SALES hierarchy | `Backend/middleware/isRole.ts` |
| **Secure Cookies** | httpOnly, secure, sameSite cookies for tokens | `Backend/controllers/authController.ts` |
| **Password Hashing** | bcrypt with salt rounds | `Backend/controllers/authController.ts` |
| **Token Rotation** | Refresh tokens are rotated on each use | `Backend/controllers/authController.ts` |
| **Auto Token Cleanup** | Daily cleanup of expired tokens via BullMQ | `Backend/services/tokenCleanupService.ts` |

### 👥 User Management Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **User Registration** | OWNER creates org, ADMIN adds employees | `frontend/app/users/page.tsx` | `POST /api/users` |
| **User Profiles** | View/edit name, email, role, avatar | `frontend/app/settings/page.tsx` | `PUT /api/users/:id` |
| **Role Management** | Change user roles (ADMIN+ only) | Users page actions | `PUT /api/users/:id` |
| **User Deletion** | Soft/hard delete users | Users page actions | `DELETE /api/users/:id` |
| **Team Directory** | View all org members | `frontend/app/users/page.tsx` | `GET /api/users` |
| **Password Change** | Secure password updates | Settings page | `PUT /api/auth/change-password` |
| **2FA Setup** | Enable/disable with QR code | Settings page | `/api/2fa/setup`, `/verify`, `/disable` |

### 📊 Lead Management Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Lead Creation** | Add leads with contact info, value, source | Create Lead Modal | `POST /api/leads` |
| **Lead List** | Paginated, searchable, filterable list | `frontend/app/leads/page.tsx` | `GET /api/leads` |
| **Lead Details** | Full lead info with activity timeline | `frontend/app/leads/[id]/page.tsx` | `GET /api/leads/:id` |
| **Lead Status Pipeline** | NEW → CONTACTED → QUALIFIED → PROPOSAL → WON/LOST | Status badges/dropdowns | `PUT /api/leads/:id` |
| **Lead Assignment** | Assign leads to team members | Assignee dropdown | `PUT /api/leads/:id` |
| **Lead Conversion** | Convert qualified leads to deals | Convert button | `POST /api/leads/:id/convert` |
| **Lead Sources** | Track where leads come from | Source field | Stored in DB |
| **Lead Value** | Estimated deal value | Value field | `value` column |
| **Activity Tracking** | Notes, calls, emails, meetings on leads | Activity feed | `POST /api/leads/:id/activities` |
| **Lead Search** | Search by name, email, company | Search input | Query params |
| **Lead Filtering** | Filter by status, source, owner | Filter dropdowns | Query params |

### 💼 Deal Management Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Deal Creation** | Create deals (manual or from lead) | Create Deal Modal | `POST /api/deals` |
| **Deal Pipeline** | QUALIFICATION → PROPOSAL → NEGOTIATION → WON/LOST | Pipeline board/list | `PUT /api/deals/:id` |
| **Deal Value** | Track deal monetary value | Value field | `value` column |
| **Probability** | Win probability based on stage | Auto/manual | `probability` column |
| **Expected Close** | Target close date | Date picker | `expectedClose` column |
| **Deal Assignment** | Assign deals to sales reps | Assignee dropdown | `assignedToId` |
| **Lead Association** | Link deals to source leads | Lead dropdown | `leadId` |
| **Stage Tracking** | Automatic stage change notifications | Real-time updates | Event emitter |

### ✅ Task Management Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Task Creation** | Create tasks with title, description, due date | Create Task Modal | `POST /api/tasks` |
| **Task Assignment** | Assign tasks to team members | Assignee dropdown | `assignedToId` |
| **Task Priorities** | LOW, MEDIUM, HIGH priority levels | Priority badges | `priority` enum |
| **Task Status** | TODO → IN_PROGRESS → DONE | Status dropdown | `status` enum |
| **Due Dates** | Set task deadlines | Date picker | `dueDate` column |
| **Task Filtering** | Filter by status, priority, assignee | Filter buttons | Query params |
| **Overdue Alerts** | Highlight overdue tasks | Red styling | Dashboard query |
| **Task Notifications** | Notify on assignment/completion | Real-time + toast | Event emitter |
| **Lead/Deal Tasks** | Link tasks to leads or deals | Association fields | `leadId`, `dealId` |

### 🔔 Notification System Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Real-time Notifications** | Instant push via Socket.IO | Toast + bell icon | `newNotification` event |
| **Notification Types** | TASK_ASSIGNED, LEAD_ASSIGNED, DEAL_UPDATED, USER_ADDED, SYSTEM | Type icons | `NotificationType` enum |
| **Unread Count** | Badge showing unread count | Bell badge | `GET /api/notifications/unread-count` |
| **Mark as Read** | Mark individual as read | Click notification | `PUT /api/notifications/:id/read` |
| **Mark All Read** | Bulk mark all as read | "Mark all" button | `PUT /api/notifications/read-all` |
| **Notification Links** | Deep links to related entity | Click to navigate | `link` field |
| **Notification History** | View past notifications | Notifications page | `GET /api/notifications` |

### 📈 Dashboard & Analytics Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Stats Cards** | Total leads, deals, tasks, revenue | `StatsCard` components | `GET /api/dashboard/stats` |
| **Weekly Charts** | Leads/deals/tasks by week | Bar/Line charts | `GET /api/dashboard/weekly` |
| **Pipeline Chart** | Deal distribution by stage | Pie chart | `GET /api/dashboard/pipeline` |
| **Lead Sources Chart** | Lead distribution by source | Bar chart | `GET /api/dashboard/lead-sources` |
| **Team Performance** | Sales by team member (Admin+) | Horizontal bar | `GET /api/dashboard/team-performance` |
| **Activity Feed** | Recent org-wide activities | Activity list | `GET /api/dashboard/activity` |
| **Overdue Tasks** | List of overdue tasks | Task list | `GET /api/dashboard/overdue-tasks` |
| **Conversion Rate** | Lead-to-deal conversion % | Stats card | Calculated metric |

### 🏢 Organization Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Org Creation** | Create org on registration | Registration flow | `POST /api/auth/register` |
| **Org Settings** | Update org name, settings | Org settings page | `PUT /api/organizations/:id` |
| **Multi-tenancy** | Complete data isolation between orgs | All queries filtered | `orgId` on all models |
| **Team Management** | View/manage org members | Users page | `GET /api/users` |

### 📝 Activity Tracking Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Activity Types** | NOTE, CALL, EMAIL, MEETING | Type dropdown | `ActivityType` enum |
| **Activity Timeline** | Chronological activity feed | Activity feed component | `GET /api/leads/:id/activities` |
| **Activity Creation** | Log activities on leads | Activity form | `POST /api/leads/:id/activities` |
| **Activity Icons** | Visual icons per type | Icon components | Frontend only |

### 📞 Call Logging Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Call Logs** | Record call details | Call log form | `POST /api/call-logs` |
| **Call Duration** | Track call length | Duration field | `duration` column |
| **Call Outcome** | Track call results | Outcome dropdown | `outcome` field |
| **Call Notes** | Add notes to calls | Notes textarea | `notes` field |

### 📅 Calendar Events Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Event Creation** | Create meetings, reminders | Calendar modal | `POST /api/calendar-events` |
| **Event Types** | MEETING, CALL, TASK, REMINDER | Type dropdown | `eventType` enum |
| **Date/Time** | Start and end times | DateTime pickers | `startTime`, `endTime` |
| **Attendees** | Link to users | User selection | Relation |

### 🔄 Follow-up Sequences Features

| Feature | Description | Frontend | Backend |
|---------|-------------|----------|---------|
| **Sequence Creation** | Create automated follow-up sequences | Sequence builder | `POST /api/follow-up-sequences` |
| **Sequence Steps** | Define multiple steps | Step editor | `SequenceStep` model |
| **Delay Settings** | Days between steps | Delay input | `delayDays` field |
| **Activation** | Active/inactive toggle | Toggle switch | `active` field |

### 🎨 UI/UX Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Dark/Light Theme** | System-aware theming | `next-themes` provider |
| **Responsive Design** | Mobile-first responsive | Tailwind breakpoints |
| **Sidebar Navigation** | Collapsible sidebar | Custom component |
| **Data Tables** | Sortable, searchable tables | TanStack Table + shadcn |
| **Modals** | Create/edit dialogs | shadcn Dialog |
| **Toast Notifications** | Success/error toasts | Sonner library |
| **Loading States** | Skeleton loaders | shadcn Skeleton |
| **Form Validation** | Client-side validation | React Hook Form + Zod |
| **Dropdowns** | Select/combobox components | shadcn Select/Combobox |
| **Date Pickers** | Calendar date selection | shadcn Calendar |

### 🔍 Search & Filter Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Global Search** | Search across entities | Command palette |
| **Lead Filters** | Status, source, owner | Filter dropdowns |
| **Deal Filters** | Stage, owner, value range | Filter dropdowns |
| **Task Filters** | Status, priority, assignee | Filter buttons |
| **Saved Filters** | Save filter presets | `FilterPreset` model |
| **Custom Fields** | Org-specific custom fields | `CustomField` model |

### 📊 Reporting Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Dashboard Metrics** | Real-time KPIs | Dashboard page |
| **Weekly Trends** | Week-over-week charts | Chart components |
| **Pipeline Analysis** | Deal stage distribution | Pipeline chart |
| **Source Analysis** | Lead source effectiveness | Sources chart |
| **Team Metrics** | Individual performance | Team chart (Admin+) |

### 🔐 Audit & Compliance Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Audit Logs** | Track all user actions | `AuditLog` model |
| **Login Tracking** | Log all login attempts | Auth controller |
| **Change History** | Track entity changes | Event emitter |
| **IP Logging** | Record IP addresses | Middleware |

### 📧 Email Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Welcome Emails** | Sent on user creation | BullMQ email worker |
| **Password Reset** | Secure reset links | Email template |
| **Task Assignment** | Notify on assignment | Email template |
| **HTML Templates** | Styled email templates | `utils/emailTemplate.ts` |

### 🔗 Integration Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Webhook Logs** | Track webhook deliveries | `WebhookLog` model |
| **External Integrations** | Integration configs | `Integration` model |
| **API Keys** | Manage API access | Future feature |

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

---

## 📦 NPM Modules & Libraries Used

### Backend Dependencies

| Module | Version | Purpose | Usage |
|--------|---------|---------|-------|
| **express** | ^4.18 | Web framework | HTTP server, routing, middleware |
| **prisma** | ^5.x | ORM | Database schema, migrations, queries |
| **@prisma/client** | ^5.x | DB Client | Type-safe database operations |
| **socket.io** | ^4.x | WebSocket | Real-time bidirectional communication |
| **ioredis** | ^5.x | Redis client | Caching, rate limiting, BullMQ |
| **bullmq** | ^4.x | Job queue | Background tasks, scheduled jobs |
| **jsonwebtoken** | ^9.x | JWT | Access/refresh token generation |
| **bcrypt** | ^5.x | Hashing | Password hashing |
| **speakeasy** | ^2.x | TOTP | 2FA code generation/verification |
| **qrcode** | ^1.x | QR codes | 2FA setup QR generation |
| **nodemailer** | ^6.x | Email | SMTP email sending |
| **cookie-parser** | ^1.x | Cookies | Parse request cookies |
| **cors** | ^2.x | CORS | Cross-origin requests |
| **rate-limiter-flexible** | ^2.x | Rate limit | Request throttling |
| **dotenv** | ^16.x | Config | Environment variables |

### Frontend Dependencies

| Module | Version | Purpose | Usage |
|--------|---------|---------|-------|
| **next** | ^16.x | Framework | React framework, routing, SSR |
| **react** | ^19.x | UI Library | Component rendering |
| **typescript** | ^5.x | Type safety | Static typing |
| **tailwindcss** | ^4.x | Styling | Utility-first CSS |
| **@radix-ui/react-*** | Various | Primitives | Accessible UI primitives |
| **socket.io-client** | ^4.x | WebSocket | Socket.IO client |
| **sonner** | ^1.x | Toasts | Toast notifications |
| **lucide-react** | ^0.x | Icons | SVG icon components |
| **next-themes** | ^0.x | Theming | Dark/light mode |
| **recharts** | ^2.x | Charts | Dashboard visualizations |
| **@tanstack/react-table** | ^8.x | Tables | Data table handling |
| **react-hook-form** | ^7.x | Forms | Form state management |
| **zod** | ^3.x | Validation | Schema validation |
| **date-fns** | ^3.x | Dates | Date formatting/manipulation |
| **class-variance-authority** | ^0.x | Styling | Component variants |
| **clsx** | ^2.x | Classes | Conditional className |
| **tailwind-merge** | ^2.x | Styling | Merge Tailwind classes |

---

## 🔧 Backend Code Architecture

### Express Server Setup (index.ts)

```typescript
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3001",
        credentials: true,
    },
});

// Make io accessible in controllers
app.set("io", io);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/2fa", twoFactorRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
    socket.on("joinRoom", (userId) => socket.join(`user:${userId}`));
    socket.on("joinOrg", (orgId) => socket.join(`org:${orgId}`));
    socket.on("disconnect", () => console.log("Client disconnected"));
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startAllWorkers(); // Start BullMQ workers
    scheduleTokenCleanup(); // Schedule daily cleanup
});
```

### Controller Pattern Example (leadController.ts)

```typescript
import { Request, Response } from "express";
import prisma from "../config/client";
import { tryCatch } from "../utils/tryCatch";
import { emitEvent } from "../services/eventEmitter";
import { invalidateDashboardCache } from "../services/cacheService";

// Get all leads with filtering, pagination, and search
export const getLeads = tryCatch(async (req: Request, res: Response) => {
    const { userId, orgId, role } = req.user!;
    const { status, search, page = 1, limit = 20 } = req.query;

    // SALES users see only their leads
    const whereClause: any = {
        orgId,
        ...(role === "SALES" && { ownerId: userId }),
        ...(status && { status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [leads, total] = await Promise.all([
        prisma.lead.findMany({
            where: whereClause,
            include: {
                owner: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        }),
        prisma.lead.count({ where: whereClause }),
    ]);

    return res.json({
        leads,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

// Create a new lead
export const createLead = tryCatch(async (req: Request, res: Response) => {
    const { userId, orgId } = req.user!;
    const { name, email, company, phone, value, source, assignedToId } = req.body;

    const lead = await prisma.lead.create({
        data: {
            name,
            email,
            company,
            phone,
            value: value || 0,
            source,
            ownerId: userId,
            assignedToId: assignedToId || userId,
            orgId,
        },
        include: {
            owner: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
        },
    });

    // Emit event for notifications, audit logging, and real-time updates
    await emitEvent(req.app, "lead:created", lead, orgId, userId);
    await invalidateDashboardCache(orgId);

    return res.status(201).json(lead);
});
```

### TryCatch Utility (utils/tryCatch.ts)

```typescript
import { Request, Response, NextFunction } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const tryCatch = (fn: AsyncHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error("Error:", error);
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
    };
};
```

### Authentication Middleware (middleware/isAuth.ts)

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string;
    role: string;
    orgId: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

const isAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.user = decoded;
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

---

## 🎨 Frontend Code Architecture

### Auth Context (contexts/auth-context.tsx)

```typescript
"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { setTokenHandlers } from "@/lib/api-service";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    orgId: string;
    twoFactorEnabled: boolean;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (email: string, password: string, twoFactorToken?: string) => Promise<LoginResult>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const accessTokenRef = useRef<string | null>(null);

    // Sync ref with state
    useEffect(() => {
        accessTokenRef.current = accessToken;
    }, [accessToken]);

    // Token refresh function
    const refreshAccessToken = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/auth/refresh-token`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                setAccessToken(null);
                setUser(null);
                return null;
            }

            const data = await response.json();
            setAccessToken(data.accessToken);
            accessTokenRef.current = data.accessToken;
            return data.accessToken;
        } catch {
            return null;
        }
    }, []);

    // Set up token handlers for API service
    useEffect(() => {
        setTokenHandlers(
            () => accessTokenRef.current,
            refreshAccessToken
        );
    }, [refreshAccessToken]);

    // Auto-refresh tokens every 14 minutes
    useEffect(() => {
        if (user) {
            const interval = setInterval(refreshAccessToken, 14 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user, refreshAccessToken]);

    // Login function
    const login = async (email: string, password: string, twoFactorToken?: string) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password, twoFactorToken }),
        });

        const data = await response.json();

        if (data.requires2FA) {
            return { requires2FA: true };
        }

        if (response.ok) {
            setAccessToken(data.accessToken);
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
            return { success: true };
        }

        throw new Error(data.message);
    };

    // Logout function
    const logout = async () => {
        await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
```

### API Service (lib/api-service.ts)

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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

    // Handle 401 - try to refresh token and retry
    if (response.status === 401 && retry) {
        const newToken = await refreshToken();
        if (newToken) {
            return makeRequest(endpoint, options, false);
        }
        throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
}

// Convenience methods
export const api = {
    get: <T>(endpoint: string) => makeRequest<T>(endpoint),
    post: <T>(endpoint: string, data: any) => makeRequest<T>(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    put: <T>(endpoint: string, data: any) => makeRequest<T>(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    delete: <T>(endpoint: string) => makeRequest<T>(endpoint, { method: "DELETE" }),
};
```

### Socket Context (contexts/socket-context.tsx)

```typescript
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
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

        const socketInstance = io(
            process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
            { withCredentials: true }
        );

        socketInstance.on("connect", () => {
            setIsConnected(true);
            socketInstance.emit("joinRoom", user.id);
            socketInstance.emit("joinOrg", user.orgId);
        });

        // Handle real-time notifications
        socketInstance.on("newNotification", (notification) => {
            setUnreadCount((prev) => prev + 1);
            toast.info(notification.message, {
                action: notification.link ? {
                    label: "View",
                    onClick: () => window.location.href = notification.link,
                } : undefined,
            });
        });

        // Handle entity updates
        socketInstance.on("lead:created", (data) => {
            toast.success(`New lead: ${data.lead.name}`);
        });

        socketInstance.on("deal:won", (data) => {
            toast.success(`🎉 Deal won: ${data.deal.title}`);
        });

        socketInstance.on("task:assigned", (data) => {
            toast.info(`New task assigned: ${data.task.title}`);
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

### Protected Route Component

```typescript
"use client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }

        if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
            router.push("/dashboard");
        }
    }, [user, isLoading, router, allowedRoles]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
```

### Dashboard Page Example (app/dashboard/page.tsx)

```typescript
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-service";
import { StatsCard } from "@/components/stats-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { ActivityFeed } from "@/components/activity-feed";
import { ProtectedRoute } from "@/components/protected-route";

interface DashboardStats {
    totalLeads: number;
    totalDeals: number;
    totalTasks: number;
    openTasks: number;
    dealValueThisMonth: number;
    conversionRate: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const data = await api.get<DashboardStats>("/dashboard/stats");
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Leads"
                        value={stats?.totalLeads || 0}
                        icon={<UsersIcon />}
                    />
                    <StatsCard
                        title="Total Deals"
                        value={stats?.totalDeals || 0}
                        icon={<BriefcaseIcon />}
                    />
                    <StatsCard
                        title="Open Tasks"
                        value={stats?.openTasks || 0}
                        icon={<CheckCircleIcon />}
                    />
                    <StatsCard
                        title="Revenue This Month"
                        value={`$${(stats?.dealValueThisMonth || 0).toLocaleString()}`}
                        icon={<DollarSignIcon />}
                    />
                </div>

                <DashboardCharts />
                <ActivityFeed />
            </div>
        </ProtectedRoute>
    );
}
```

---

## 🗄️ Database Seed Data Summary

### Organizations (4)
- **FlowCRM** - Main demo company (15 users)
- **Acme Corporation** - Enterprise client (5 users)
- **TechStart Inc** - Startup client (4 users)
- **Global Solutions** - International client (3 users)

### Users (27 total)
| Organization | Roles | Count |
|--------------|-------|-------|
| FlowCRM | 1 OWNER, 2 ADMIN, 3 MANAGER, 9 SALES | 15 |
| Acme Corp | 1 OWNER, 1 ADMIN, 1 MANAGER, 2 SALES | 5 |
| TechStart | 1 OWNER, 1 ADMIN, 2 SALES | 4 |
| Global Solutions | 1 OWNER, 1 ADMIN, 1 SALES | 3 |

### Data Volume
| Entity | Count |
|--------|-------|
| Leads | 38 |
| Deals | 30 |
| Tasks | 63 |
| Activities | 80 |
| Notifications | 79 |
| Call Logs | 25 |
| Calendar Events | 20 |
| Custom Fields | 3 |
| Follow-up Sequences | 3 |
| Filter Presets | 3 |
| Audit Logs | 27 |

### Login Credentials (All passwords: `password`)

**FlowCRM Users:**
- admin@flowcrm.com (OWNER)
- sarah.johnson@flowcrm.com (ADMIN)
- mike.chen@flowcrm.com (MANAGER)
- emma.wilson@flowcrm.com (SALES)

**Other Organizations:**
- owner@acme.com (OWNER)
- ceo@techstart.io (OWNER)
- admin@globalsolutions.co.uk (OWNER)

---

## 🚀 Quick Start Commands

```bash
# Clone and install
git clone <repo>
cd FlowCRM

# Backend setup
cd Backend
npm install
cp .env.example .env  # Configure your env vars
npx prisma generate
npx prisma db push
npx prisma db seed    # Load demo data
npm run dev           # Starts on :3000

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env  # Set NEXT_PUBLIC_API_URL
npm run dev           # Starts on :3001
```

---

## 📚 API Endpoints Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create org + owner |
| POST | `/api/auth/login` | No | Login (returns tokens) |
| POST | `/api/auth/refresh-token` | Cookie | Get new access token |
| POST | `/api/auth/logout` | Yes | Logout (revoke tokens) |
| POST | `/api/auth/forgot-password` | No | Send reset email |
| POST | `/api/auth/reset-password` | No | Reset with token |
| PUT | `/api/auth/change-password` | Yes | Change password |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin+ | List org users |
| GET | `/api/users/:id` | All | Get user profile |
| POST | `/api/users` | Admin+ | Add employee |
| PUT | `/api/users/:id` | Admin+ | Update user |
| DELETE | `/api/users/:id` | Admin+ | Delete user |

### Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | All | List leads (filtered by role) |
| GET | `/api/leads/:id` | All | Get lead details |
| POST | `/api/leads` | All | Create lead |
| PUT | `/api/leads/:id` | All | Update lead |
| DELETE | `/api/leads/:id` | Admin+ | Delete lead |
| POST | `/api/leads/:id/activities` | All | Add activity |
| POST | `/api/leads/:id/convert` | All | Convert to deal |

### Deals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/deals` | All | List deals |
| GET | `/api/deals/:id` | All | Get deal details |
| POST | `/api/deals` | All | Create deal |
| PUT | `/api/deals/:id` | All | Update deal |
| DELETE | `/api/deals/:id` | Admin+ | Delete deal |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks` | All | List tasks |
| POST | `/api/tasks` | Manager+ | Create task |
| PUT | `/api/tasks/:id` | All | Update task |
| DELETE | `/api/tasks/:id` | Manager+ | Delete task |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | All | Get notifications |
| PUT | `/api/notifications/:id/read` | All | Mark as read |
| PUT | `/api/notifications/read-all` | All | Mark all read |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | All | Main statistics |
| GET | `/api/dashboard/weekly` | All | Weekly charts |
| GET | `/api/dashboard/pipeline` | All | Deal pipeline |
| GET | `/api/dashboard/team-performance` | Admin+ | Team metrics |

### 2FA
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/2fa/setup` | Yes | Generate secret + QR |
| POST | `/api/2fa/verify` | Yes | Enable 2FA |
| POST | `/api/2fa/disable` | Yes | Disable 2FA |

---

*Last updated: January 2026*
