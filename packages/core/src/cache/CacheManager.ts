/**
 * Generic Cache Manager for CarmaClouds
 * Reduces database egress costs with configurable TTL caching
 */

import type { CacheStats } from '../types/character';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheManagerOptions {
  /** Cache expiry time in milliseconds */
  expiryMs?: number;
  /** Cleanup interval in milliseconds */
  cleanupIntervalMs?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private expiryMs: number;
  private cleanupInterval?: NodeJS.Timeout;
  private stats: {
    hits: number;
    misses: number;
    stores: number;
    invalidations: number;
  };
  private debug: boolean;

  constructor(options: CacheManagerOptions = {}) {
    this.cache = new Map();
    this.expiryMs = options.expiryMs || 15 * 60 * 1000; // Default 15 minutes
    this.debug = options.debug || false;
    this.stats = {
      hits: 0,
      misses: 0,
      stores: 0,
      invalidations: 0
    };

    // Auto-cleanup expired entries
    const cleanupInterval = options.cleanupIntervalMs || 5 * 60 * 1000;
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), cleanupInterval);
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp >= this.expiryMs) {
      this.cache.delete(key);
      this.stats.misses++;
      if (this.debug) {
        console.log(`⏰ [Cache] Expired: ${key}`);
      }
      return null;
    }

    this.stats.hits++;
    if (this.debug) {
      const age = Math.floor((now - entry.timestamp) / 1000);
      console.log(`✅ [Cache] Hit: ${key} (age: ${age}s)`);
    }
    return entry.data;
  }

  /**
   * Store value in cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    this.stats.stores++;

    if (this.debug) {
      console.log(`📦 [Cache] Stored: ${key}`);
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.invalidations++;
      if (this.debug) {
        console.log(`🗑️ [Cache] Invalidated: ${key}`);
      }
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    if (this.debug) {
      console.log(`🗑️ [Cache] Cleared ${size} entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : '0';

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      stores: this.stats.stores,
      invalidations: this.stats.invalidations,
      hitRate: `${hitRate}%`,
      expiryMinutes: this.expiryMs / 60000
    };
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.expiryMs) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0 && this.debug) {
      console.log(`🧹 [Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Destroy cache manager (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}
