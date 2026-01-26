import { Queue, Worker, Job } from 'bullmq';
import { createBullMQConnection, REDIS_ENABLED, cache, cacheKeys } from '../config/redis';
import prisma from '../config/client';

// Job data interface
interface TokenCleanupJobData {
    type: 'cleanup';
    timestamp: string;
}

// Create queue and worker only if Redis is enabled
let tokenCleanupQueue: Queue<TokenCleanupJobData> | null = null;
let tokenCleanupWorker: Worker<TokenCleanupJobData> | null = null;

// Token expiry duration (7 days in milliseconds)
const TOKEN_EXPIRY_DAYS = 7;
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// ==================== CLEANUP LOGIC ====================

/**
 * Cleanup expired refresh tokens and remove user cache from Redis
 * - Finds all refresh tokens where createdAt is older than 7 days
 * - Marks them as revoked
 * - Deletes associated user data from Redis cache
 */
export const cleanupExpiredTokens = async (): Promise<{
    revokedCount: number;
    deletedCacheCount: number;
    errors: string[];
}> => {
    const errors: string[] = [];
    let revokedCount = 0;
    let deletedCacheCount = 0;

    try {
        const expiryDate = new Date(Date.now() - TOKEN_EXPIRY_MS);
        
        console.log(`🧹 Starting token cleanup...`);
        console.log(`📅 Looking for tokens created before: ${expiryDate.toISOString()}`);

        // Find all expired tokens that are not yet revoked
        const expiredTokens = await prisma.refreshToken.findMany({
            where: {
                createdAt: {
                    lt: expiryDate,
                },
                revoked: false,
            },
            select: {
                id: true,
                userId: true,
                createdAt: true,
            },
        });

        console.log(`📊 Found ${expiredTokens.length} expired tokens to revoke`);

        if (expiredTokens.length === 0) {
            console.log('✅ No expired tokens found');
            return { revokedCount: 0, deletedCacheCount: 0, errors: [] };
        }

        // Get unique user IDs to clean up from Redis
        const uniqueUserIds = [...new Set(expiredTokens.map(token => token.userId))];

        // Revoke all expired tokens in a single transaction
        const result = await prisma.refreshToken.updateMany({
            where: {
                id: {
                    in: expiredTokens.map(token => token.id),
                },
            },
            data: {
                revoked: true,
            },
        });

        revokedCount = result.count;
        console.log(`🔒 Revoked ${revokedCount} expired tokens`);

        // Delete user cache from Redis for affected users
        if (REDIS_ENABLED) {
            for (const userId of uniqueUserIds) {
                try {
                    await cache.del(cacheKeys.user(userId));
                    await cache.del(cacheKeys.userPermissions(userId));
                    deletedCacheCount++;
                    console.log(`🗑️ Deleted Redis cache for user: ${userId}`);
                } catch (cacheError) {
                    const errorMsg = `Failed to delete cache for user ${userId}: ${cacheError}`;
                    errors.push(errorMsg);
                    console.error(`❌ ${errorMsg}`);
                }
            }
        }

        // Also delete tokens that have passed their expiresAt date (hard expired)
        const hardExpiredResult = await prisma.refreshToken.updateMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
                revoked: false,
            },
            data: {
                revoked: true,
            },
        });

        if (hardExpiredResult.count > 0) {
            console.log(`🔒 Also revoked ${hardExpiredResult.count} hard-expired tokens`);
            revokedCount += hardExpiredResult.count;
        }

        // Optionally: Delete very old revoked tokens (older than 30 days) to free up database space
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deletedOldTokens = await prisma.refreshToken.deleteMany({
            where: {
                revoked: true,
                createdAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        if (deletedOldTokens.count > 0) {
            console.log(`🗑️ Permanently deleted ${deletedOldTokens.count} old revoked tokens`);
        }

        console.log(`✅ Token cleanup completed successfully`);
        console.log(`   - Tokens revoked: ${revokedCount}`);
        console.log(`   - User caches cleared: ${deletedCacheCount}`);
        console.log(`   - Old tokens deleted: ${deletedOldTokens.count}`);

        return { revokedCount, deletedCacheCount, errors };

    } catch (error) {
        const errorMsg = `Token cleanup failed: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        return { revokedCount, deletedCacheCount, errors };
    }
};

// ==================== SCHEDULED JOB ====================

/**
 * Initialize the token cleanup scheduler
 * Runs every 24 hours
 */
export const initTokenCleanupScheduler = async () => {
    if (!REDIS_ENABLED) {
        console.log('⚠️ Redis disabled - Token cleanup scheduler will not start');
        console.log('   Running immediate cleanup without scheduling...');
        // Run once immediately without scheduling
        await cleanupExpiredTokens();
        return;
    }

    const connection = createBullMQConnection();
    if (!connection) {
        console.log('⚠️ Could not create Redis connection - Token cleanup scheduler not started');
        return;
    }

    // Create the queue
    tokenCleanupQueue = new Queue<TokenCleanupJobData>('tokenCleanup', { connection });

    // Create the worker
    tokenCleanupWorker = new Worker<TokenCleanupJobData>(
        'tokenCleanup',
        async (job: Job<TokenCleanupJobData>) => {
            console.log(`\n🔄 [${new Date().toISOString()}] Token cleanup job started (Job ID: ${job.id})`);
            
            const result = await cleanupExpiredTokens();
            
            return {
                success: true,
                ...result,
                completedAt: new Date().toISOString(),
            };
        },
        { connection, concurrency: 1 }
    );

    tokenCleanupWorker.on('completed', (job, result) => {
        console.log(`✅ Token cleanup job ${job.id} completed:`, result);
    });

    tokenCleanupWorker.on('failed', (job, err) => {
        console.error(`❌ Token cleanup job ${job?.id} failed:`, err.message);
    });

    // Remove any existing repeatable jobs to avoid duplicates
    const existingJobs = await tokenCleanupQueue.getRepeatableJobs();
    for (const job of existingJobs) {
        await tokenCleanupQueue.removeRepeatableByKey(job.key);
    }

    // Schedule the job to run every 24 hours
    await tokenCleanupQueue.add(
        'daily-cleanup',
        { type: 'cleanup', timestamp: new Date().toISOString() },
        {
            repeat: {
                pattern: '0 0 * * *', // Cron: Every day at midnight
            },
            removeOnComplete: { count: 10 }, // Keep last 10 completed jobs
            removeOnFail: { count: 5 }, // Keep last 5 failed jobs
        }
    );

    console.log('⏰ Token cleanup scheduler initialized - runs daily at midnight');

    // Run once immediately on startup
    await tokenCleanupQueue.add(
        'startup-cleanup',
        { type: 'cleanup', timestamp: new Date().toISOString() },
        {
            removeOnComplete: true,
        }
    );
    console.log('🚀 Initial token cleanup job queued');
};

// ==================== MANUAL TRIGGER ====================

/**
 * Manually trigger a token cleanup (useful for admin endpoints)
 */
export const triggerTokenCleanup = async () => {
    if (tokenCleanupQueue) {
        const job = await tokenCleanupQueue.add(
            'manual-cleanup',
            { type: 'cleanup', timestamp: new Date().toISOString() },
            { removeOnComplete: true }
        );
        return { jobId: job.id, message: 'Token cleanup job queued' };
    }
    
    // If queue not available, run directly
    const result = await cleanupExpiredTokens();
    return { jobId: null, message: 'Token cleanup executed directly', result };
};

// ==================== SHUTDOWN ====================

export const closeTokenCleanupService = async () => {
    if (tokenCleanupWorker) {
        await tokenCleanupWorker.close();
    }
    if (tokenCleanupQueue) {
        await tokenCleanupQueue.close();
    }
    console.log('Token cleanup service closed');
};

export { tokenCleanupQueue, tokenCleanupWorker };
