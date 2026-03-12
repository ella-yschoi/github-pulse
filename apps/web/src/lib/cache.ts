/**
 * Simple memory cache implementation
 * Redis or other cache solutions will be used in production
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // TTL check
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Delete data from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired cache items
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Return cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Periodic cleanup of expired entries (every 10 minutes)
setInterval(() => cache.cleanup(), 10 * 60 * 1000);

/**
 * Cache key generation helper
 */
export function createCacheKey(
  prefix: string,
  ...parts: (string | number)[]
): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Generate GitHub API response cache key
 */
export function createGitHubCacheKey(
  userId: string,
  endpoint: string,
  params?: Record<string, unknown>
): string {
  const paramString = params ? `:${JSON.stringify(params)}` : '';
  return createCacheKey('github', userId, endpoint, paramString);
}

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 60000, // 1 minute
  MEDIUM: 300000, // 5 minutes
  LONG: 1800000, // 30 minutes
  VERY_LONG: 3600000, // 1 hour
  ULTRA_LONG: 7200000, // 2 hours
} as const;
