import Redis, { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Check if Redis is enabled
export const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

// Redis connection configuration - supports both URL and individual settings
const getRedisConfig = (): RedisOptions => {
    // If REDIS_URL is provided, use it (common for cloud providers)
    if (process.env.REDIS_URL) {
        return {
            maxRetriesPerRequest: null, // Required for BullMQ
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 100, 30000);
                return delay;
            },
            enableReadyCheck: false,
            tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        };
    }

    // Otherwise use individual settings
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null, // Required for BullMQ
        retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 30000);
            return delay;
        },
        enableReadyCheck: false,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    };
};

// Create Redis client only if enabled - use null otherwise
let _redis: Redis | null = null;

export const getRedis = (): Redis | null => {
    if (!REDIS_ENABLED) return null;
    if (!_redis) {
        const config = getRedisConfig();
        _redis = process.env.REDIS_URL 
            ? new Redis(process.env.REDIS_URL, config)
            : new Redis(config);
        
        _redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });
        _redis.on('error', (err) => {
            console.error('❌ Redis connection error:', err.message);
        });
        _redis.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });
    }
    return _redis;
};

// Lazy getter for backward compatibility
export const redis = {
    get client() {
        return getRedis();
    }
};

// Create separate connection for BullMQ (it needs its own connection)
export const createBullMQConnection = (): Redis | null => {
    if (!REDIS_ENABLED) {
        return null;
    }
    const config = getRedisConfig();
    return process.env.REDIS_URL 
        ? new Redis(process.env.REDIS_URL, config)
        : new Redis(config);
};

// Cache utility functions - gracefully handle Redis being disabled
export const cache = {
    // Get cached data
    async get<T>(key: string): Promise<T | null> {
        const client = getRedis();
        if (!client) return null;
        try {
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    // Set cached data with TTL (in seconds)
    async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
        const client = getRedis();
        if (!client) return;
        try {
            await client.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    },

    // Delete cached data
    async del(key: string): Promise<void> {
        const client = getRedis();
        if (!client) return;
        try {
            await client.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    },

    // Delete multiple keys by pattern
    async delPattern(pattern: string): Promise<void> {
        const client = getRedis();
        if (!client) return;
        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
        } catch (error) {
            console.error('Cache delete pattern error:', error);
        }
    },

    // Increment a counter (useful for rate limiting)
    async incr(key: string, ttlSeconds?: number): Promise<number> {
        const client = getRedis();
        if (!client) return 0;
        try {
            const count = await client.incr(key);
            if (ttlSeconds && count === 1) {
                await client.expire(key, ttlSeconds);
            }
            return count;
        } catch (error) {
            console.error('Cache incr error:', error);
            return 0;
        }
    },
};

// Cache key generators
export const cacheKeys = {
    // Dashboard cache keys
    dashboard: (orgId: string, role: string) => `dashboard:${orgId}:${role}`,
    dashboardStats: (orgId: string) => `stats:${orgId}:dashboard`,
    weeklyStats: (orgId: string) => `stats:${orgId}:weekly`,
    
    // User cache keys
    user: (userId: string) => `user:${userId}`,
    userPermissions: (userId: string) => `permissions:${userId}`,
    
    // Organization cache keys
    org: (orgId: string) => `org:${orgId}`,
    orgUsers: (orgId: string) => `org:${orgId}:users`,
    
    // Rate limiting keys
    loginAttempts: (ip: string) => `ratelimit:login:${ip}`,
    passwordReset: (email: string) => `ratelimit:passwordreset:${email}`,
    apiRequest: (userId: string, endpoint: string) => `ratelimit:api:${userId}:${endpoint}`,
};

export default redis;
