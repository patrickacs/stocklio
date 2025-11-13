/**
 * lib/cache.ts
 * Caching system for API responses and expensive operations
 */

import prisma from '@/lib/db';
import { CACHE_DURATIONS } from './constants';
import { safeJsonParse } from './utils';

/**
 * Cache interface for different storage backends
 */
interface ICacheProvider {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory cache provider (for development)
 * Simple Map-based cache with TTL support
 */
class MemoryCacheProvider implements ICacheProvider {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  async set<T = any>(key: string, value: T, ttl: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}

/**
 * Database cache provider using Prisma
 * Persistent cache that survives server restarts
 */
class DatabaseCacheProvider implements ICacheProvider {
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const entry = await prisma.cache.findUnique({
        where: { key },
      });
      
      if (!entry) {
        return null;
      }
      
      if (new Date() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }
      
      return safeJsonParse<T>(entry.value);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set<T = any>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const serialized = JSON.stringify(value);
      
      await prisma.cache.upsert({
        where: { key },
        update: {
          value: serialized,
          expiresAt,
        },
        create: {
          key,
          value: serialized,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await prisma.cache.delete({
        where: { key },
      });
    } catch {
      // Key might not exist, ignore error
    }
  }
  
  async clear(): Promise<void> {
    try {
      await prisma.cache.deleteMany({});
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  async has(key: string): Promise<boolean> {
    try {
      const count = await prisma.cache.count({
        where: {
          key,
          expiresAt: {
            gt: new Date(),
          },
        },
      });
      return count > 0;
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }
  
  /**
   * Clean up expired cache entries
   */
  async cleanup(): Promise<void> {
    try {
      await prisma.cache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

/**
 * Main cache manager class
 * Provides a unified interface for caching with fallback support
 */
class CacheManager {
  private providers: {
    memory: MemoryCacheProvider;
    database: DatabaseCacheProvider;
  };
  
  private primaryProvider: ICacheProvider;
  
  constructor() {
    this.providers = {
      memory: new MemoryCacheProvider(),
      database: new DatabaseCacheProvider(),
    };
    
    // Use database cache in production, memory cache in development
    this.primaryProvider = 
      process.env.NODE_ENV === 'production'
        ? this.providers.database
        : this.providers.memory;
  }
  
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get<T = any>(key: string): Promise<T | null> {
    const normalizedKey = this.normalizeKey(key);
    return this.primaryProvider.get<T>(normalizedKey);
  }
  
  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    return this.primaryProvider.set(normalizedKey, value, ttl);
  }
  
  /**
   * Delete value from cache
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    return this.primaryProvider.delete(normalizedKey);
  }
  
  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    return this.primaryProvider.clear();
  }
  
  /**
   * Check if key exists in cache
   * @param key - Cache key
   */
  async has(key: string): Promise<boolean> {
    const normalizedKey = this.normalizeKey(key);
    return this.primaryProvider.has(normalizedKey);
  }
  
  /**
   * Get or set cache value
   * If key exists, return cached value
   * Otherwise, call factory function and cache result
   * @param key - Cache key
   * @param factory - Function to generate value if not cached
   * @param ttl - Time to live in seconds
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await factory();
    await this.set(key, value, ttl);
    
    return value;
  }
  
  /**
   * Wrap a function with caching
   * @param fn - Function to wrap
   * @param keyGenerator - Function to generate cache key from arguments
   * @param ttl - Time to live in seconds
   */
  wrap<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyGenerator: (...args: TArgs) => string,
    ttl?: number,
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), ttl);
    };
  }
  
  /**
   * Invalidate cache entries matching a pattern
   * @param pattern - Pattern to match (prefix)
   */
  async invalidatePattern(_pattern: string): Promise<void> {
    // For database cache, we'd need to implement pattern matching
    // For now, this is a simplified version that only works with exact keys
    if (this.primaryProvider instanceof DatabaseCacheProvider) {
      // In a real implementation, we'd query all keys matching the pattern
      console.warn('Pattern invalidation not fully implemented for database cache');
    }
    // For memory cache, we could iterate and delete matching keys
  }
  
  /**
   * Clean up expired entries (database cache only)
   */
  async cleanup(): Promise<void> {
    if (this.primaryProvider instanceof DatabaseCacheProvider) {
      await this.primaryProvider.cleanup();
    }
  }
  
  /**
   * Normalize cache key to ensure consistency
   */
  private normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9:_-]/g, '_');
  }
}

// Create singleton instance
const cache = new CacheManager();

// ============================================
// Cache Key Generators
// ============================================

/**
 * Generate cache key for stock quotes
 */
export function getQuoteCacheKey(ticker: string): string {
  return `quote:${ticker.toUpperCase()}`;
}

/**
 * Generate cache key for company info
 */
export function getCompanyCacheKey(ticker: string): string {
  return `company:${ticker.toUpperCase()}`;
}

/**
 * Generate cache key for dividend data
 */
export function getDividendCacheKey(ticker: string): string {
  return `dividend:${ticker.toUpperCase()}`;
}

/**
 * Generate cache key for historical data
 */
export function getHistoricalCacheKey(
  ticker: string,
  period: string,
): string {
  return `historical:${ticker.toUpperCase()}:${period}`;
}

/**
 * Generate cache key for screener results
 */
export function getScreenerCacheKey(filters: any): string {
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        acc[key] = filters[key];
      }
      return acc;
    }, {} as any);
  
  const filterString = JSON.stringify(sortedFilters);
  const hash = filterString.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return `screener:${Math.abs(hash)}`;
}

// ============================================
// Cached Functions
// ============================================

/**
 * Cache decorator for class methods
 * Usage: @cached(300)
 */
export function cached(ttl: number = CACHE_DURATIONS.QUOTES) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      return cache.getOrSet(
        key,
        () => originalMethod.apply(this, args),
        ttl,
      );
    };
    
    return descriptor;
  };
}

// ============================================
// Cleanup Job
// ============================================

/**
 * Start periodic cleanup of expired cache entries
 * Run every hour in production
 */
if (process.env.NODE_ENV === 'production') {
  setInterval(
    async () => {
      await cache.cleanup();
    },
    60 * 60 * 1000, // 1 hour
  );
}

// Export the cache instance and types
export default cache;
export type { ICacheProvider, CacheManager };