/**
 * In-memory cache service implementation
 */

import { CacheService } from '../../types/types';

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl?: number;
}

export class MemoryCacheService implements CacheService {
    private cache = new Map<string, CacheItem<any>>();
    private readonly defaultTTL = 300000; // 5 minutes
    private lastCleanup = 0;
    private readonly CLEANUP_INTERVAL = 60000; // 1 minute

    /**
     * Get item from cache (optimized with lazy cleanup)
     */
    get<T>(key: string): T | null {
        // Lazy cleanup trigger to avoid frequent iterations
        if (this.cache.size > 50) {
            this.cleanup();
        }
        
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if item has expired
        const ttl = item.ttl ?? this.defaultTTL;
        if (Date.now() - item.timestamp > ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    /**
     * Set item in cache
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * Clear all cache items
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Delete specific cache item
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Check if key exists in cache
     */
    has(key: string): boolean {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }

        // Check if expired
        const ttl = item.ttl ?? this.defaultTTL;
        if (Date.now() - item.timestamp > ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Clean up expired items (optimized with batched operations)
     */
    cleanup(): void {
        const now = Date.now();
        
        // Throttle cleanup to avoid frequent iterations
        if (now - this.lastCleanup < this.CLEANUP_INTERVAL) return;
        this.lastCleanup = now;

        // Batch delete operations (more efficient than individual deletes)
        const expiredKeys: string[] = [];
        
        for (const [key, item] of this.cache.entries()) {
            const ttl = item.ttl ?? this.defaultTTL;
            if (now - item.timestamp > ttl) {
                expiredKeys.push(key);
            }
        }
        
        // Single batch operation
        expiredKeys.forEach(key => this.cache.delete(key));
    }
}
