import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes, IRateLimiterStoreOptions } from 'rate-limiter-flexible';
import { getRedis, REDIS_ENABLED } from '../config/redis';

// ==================== RATE LIMITERS ====================

// Factory function to create rate limiters - uses Redis if available, memory otherwise
const createRateLimiter = (options: { keyPrefix: string; points: number; duration: number; blockDuration?: number }) => {
    const redisClient = getRedis();
    
    if (REDIS_ENABLED && redisClient) {
        return new RateLimiterRedis({
            storeClient: redisClient,
            ...options,
        });
    }
    
    // Fallback to memory-based rate limiter
    console.log(`⚠️ Using memory-based rate limiter for ${options.keyPrefix}`);
    return new RateLimiterMemory(options);
};

// Login rate limiter - 5 attempts per minute per IP
const loginLimiter = createRateLimiter({
    keyPrefix: 'ratelimit:login',
    points: 5, // Number of attempts
    duration: 60, // Per 60 seconds
    blockDuration: 300, // Block for 5 minutes after exceeding
});

// Password reset rate limiter - 3 attempts per hour per email
const passwordResetLimiter = createRateLimiter({
    keyPrefix: 'ratelimit:passwordreset',
    points: 3,
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour
});

// API rate limiter - 100 requests per minute per user
const apiLimiter = createRateLimiter({
    keyPrefix: 'ratelimit:api',
    points: 100,
    duration: 60,
});

// Strict API limiter for sensitive endpoints - 10 requests per minute
const strictApiLimiter = createRateLimiter({
    keyPrefix: 'ratelimit:strict',
    points: 10,
    duration: 60,
    blockDuration: 120,
});

// ==================== MIDDLEWARE FUNCTIONS ====================

// Get client IP address
const getClientIp = (req: Request): string => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           req.socket.remoteAddress || 
           'unknown';
};

// Rate limit response handler
const handleRateLimitError = (res: Response, rateLimiterRes: RateLimiterRes) => {
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
    res.set('Retry-After', String(retryAfter));
    res.set('X-RateLimit-Limit', String(rateLimiterRes.consumedPoints));
    res.set('X-RateLimit-Remaining', String(Math.max(0, rateLimiterRes.remainingPoints)));
    res.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + retryAfter));
    
    return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter,
    });
};

// Login rate limiter middleware
export const rateLimitLogin = async (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    
    try {
        await loginLimiter.consume(ip);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            console.warn(`Login rate limit exceeded for IP: ${ip}`);
            return handleRateLimitError(res, error);
        }
        // If Redis is down, allow the request but log the error
        console.error('Rate limiter error:', error);
        next();
    }
};

// Password reset rate limiter middleware
export const rateLimitPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email?.toLowerCase() || getClientIp(req);
    
    try {
        await passwordResetLimiter.consume(email);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            console.warn(`Password reset rate limit exceeded for: ${email}`);
            return handleRateLimitError(res, error);
        }
        console.error('Rate limiter error:', error);
        next();
    }
};

// General API rate limiter middleware
export const rateLimitApi = async (req: Request, res: Response, next: NextFunction) => {
    // Use user ID if authenticated, otherwise use IP
    const key = (req as any).user?.userId || getClientIp(req);
    
    try {
        const rateLimiterRes = await apiLimiter.consume(key);
        
        // Add rate limit headers
        res.set('X-RateLimit-Limit', '100');
        res.set('X-RateLimit-Remaining', String(rateLimiterRes.remainingPoints));
        res.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + Math.ceil(rateLimiterRes.msBeforeNext / 1000)));
        
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            console.warn(`API rate limit exceeded for: ${key}`);
            return handleRateLimitError(res, error);
        }
        console.error('Rate limiter error:', error);
        next();
    }
};

// Strict rate limiter for sensitive endpoints
export const rateLimitStrict = async (req: Request, res: Response, next: NextFunction) => {
    const key = (req as any).user?.userId || getClientIp(req);
    
    try {
        await strictApiLimiter.consume(key);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            console.warn(`Strict rate limit exceeded for: ${key}`);
            return handleRateLimitError(res, error);
        }
        console.error('Rate limiter error:', error);
        next();
    }
};

// Reset rate limit for a specific key (e.g., after successful login)
export const resetLoginRateLimit = async (ip: string): Promise<void> => {
    try {
        await loginLimiter.delete(ip);
    } catch (error) {
        console.error('Failed to reset rate limit:', error);
    }
};

// Get rate limit status for monitoring
export const getRateLimitStatus = async (key: string, type: 'login' | 'api' | 'strict' = 'api') => {
    const limiter = type === 'login' ? loginLimiter : type === 'strict' ? strictApiLimiter : apiLimiter;
    
    try {
        const res = await limiter.get(key);
        return res ? {
            consumed: res.consumedPoints,
            remaining: res.remainingPoints,
            resetTime: new Date(Date.now() + res.msBeforeNext),
        } : null;
    } catch (error) {
        console.error('Failed to get rate limit status:', error);
        return null;
    }
};
