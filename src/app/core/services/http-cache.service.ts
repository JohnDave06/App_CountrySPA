import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface CacheEntry {
  url: string;
  response: HttpResponse<any>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags: string[]; // For cache invalidation by tags
  size: number; // Response size in bytes
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTtl: number;
  maxSize: number; // Maximum cache size in MB
  maxEntries: number;
  cleanupInterval: number; // Cleanup interval in milliseconds
  strategy: 'LRU' | 'FIFO' | 'LFU'; // Eviction strategy
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // in bytes
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  lastCleanup: number;
  strategies: {
    [key: string]: {
      entries: number;
      hits: number;
      misses: number;
    };
  };
}

export type CacheStrategy = 
  | 'cache-first' 
  | 'network-first' 
  | 'cache-only' 
  | 'network-only' 
  | 'stale-while-revalidate';

@Injectable({
  providedIn: 'root'
})
export class HttpCacheService {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastCleanup: Date.now(),
    strategies: {}
  };

  private config: CacheConfig = {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 1000,
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
    strategy: 'LRU'
  };

  private statsSubject = new BehaviorSubject<CacheStats>(this.stats);
  public readonly stats$ = this.statsSubject.asObservable();

  constructor() {
    this.initializePeriodicCleanup();
    this.loadCacheFromStorage();
  }

  /**
   * Main cache retrieval method
   */
  get(request: HttpRequest<any>): CacheEntry | null {
    const key = this.generateCacheKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordCacheMiss(request);
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.recordCacheMiss(request);
      this.updateStats();
      return null;
    }

    // Update access information for LRU/LFU strategies
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.recordCacheHit(request);
    return entry;
  }

  /**
   * Cache a response
   */
  put(request: HttpRequest<any>, response: HttpResponse<any>, options?: {
    ttl?: number;
    tags?: string[];
    strategy?: CacheStrategy;
  }): void {
    const key = this.generateCacheKey(request);
    const ttl = options?.ttl || this.config.defaultTtl;
    const tags = options?.tags || [];
    
    // Don't cache if response is not successful
    if (response.status < 200 || response.status >= 300) {
      return;
    }

    // Don't cache large responses
    const responseSize = this.calculateResponseSize(response);
    if (responseSize > 10 * 1024 * 1024) { // 10MB limit per response
      console.warn('Response too large to cache:', key, responseSize);
      return;
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check if we need to make space
    this.ensureCacheSpace(responseSize);

    const entry: CacheEntry = {
      url: key,
      response: response.clone(),
      timestamp: Date.now(),
      ttl,
      tags,
      size: responseSize,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    this.updateStats();
    this.saveCacheToStorage();
  }

  /**
   * Invalidate cache entries by URL pattern
   */
  invalidateByPattern(pattern: string | RegExp): number {
    let removedCount = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.updateStats();
      this.saveCacheToStorage();
    }

    return removedCount;
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let removedCount = 0;
    const tagsSet = new Set(tags);

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tagsSet.has(tag))) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.updateStats();
      this.saveCacheToStorage();
    }

    return removedCount;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
    this.saveCacheToStorage();
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If max size or entries reduced, cleanup immediately
    if (newConfig.maxSize || newConfig.maxEntries) {
      this.cleanup();
    }
  }

  /**
   * Check if a request should be cached
   */
  shouldCache(request: HttpRequest<any>): boolean {
    // Don't cache POST, PUT, DELETE, PATCH requests
    if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
      return false;
    }

    // Don't cache if explicitly disabled
    if (request.headers.get('cache-control') === 'no-cache' ||
        request.headers.get('x-no-cache') === 'true') {
      return false;
    }

    // Don't cache authentication endpoints
    if (request.url.includes('/auth/') || request.url.includes('/login')) {
      return false;
    }

    return true;
  }

  /**
   * Get cache strategy for a request
   */
  getCacheStrategy(request: HttpRequest<any>): CacheStrategy {
    // Check for custom strategy header
    const strategyHeader = request.headers.get('x-cache-strategy') as CacheStrategy;
    if (strategyHeader) {
      return strategyHeader;
    }

    // Default strategies based on URL patterns
    if (request.url.includes('/api/services') || request.url.includes('/api/search')) {
      return 'stale-while-revalidate';
    }

    if (request.url.includes('/api/static') || request.url.includes('/api/config')) {
      return 'cache-first';
    }

    if (request.url.includes('/api/user') || request.url.includes('/api/profile')) {
      return 'network-first';
    }

    return 'cache-first';
  }

  /**
   * Generate cache entries for debugging
   */
  getCacheEntries(): CacheEntry[] {
    return Array.from(this.cache.values()).sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  /**
   * Get cache size information
   */
  getCacheSize(): { entries: number; size: string; maxSize: string } {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      entries: this.cache.size,
      size: this.formatBytes(totalSize),
      maxSize: this.formatBytes(this.config.maxSize)
    };
  }

  // Private methods

  private generateCacheKey(request: HttpRequest<any>): string {
    // Include method, URL, and relevant headers in cache key
    const relevantHeaders = ['accept', 'content-type', 'authorization'];
    const headerParts = relevantHeaders
      .map(header => {
        const value = request.headers.get(header);
        return value ? `${header}:${value}` : '';
      })
      .filter(part => part)
      .join('|');

    return `${request.method}:${request.urlWithParams}${headerParts ? '|' + headerParts : ''}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateResponseSize(response: HttpResponse<any>): number {
    // Rough estimate of response size
    const bodySize = response.body ? JSON.stringify(response.body).length * 2 : 0; // UTF-16
    const headersSize = Object.keys(response.headers).length * 50; // Rough estimate
    return bodySize + headersSize;
  }

  private ensureCacheSpace(requiredSize: number): void {
    // Check if we have enough space
    const currentSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (currentSize + requiredSize <= this.config.maxSize && 
        this.cache.size < this.config.maxEntries) {
      return;
    }

    // Need to make space - use configured eviction strategy
    this.evictEntries(requiredSize);
  }

  private evictEntries(requiredSize: number): void {
    const entries = Array.from(this.cache.entries());
    let freedSize = 0;

    // Sort entries based on eviction strategy
    let sortedEntries: [string, CacheEntry][];
    
    switch (this.config.strategy) {
      case 'LRU': // Least Recently Used
        sortedEntries = entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
      case 'LFU': // Least Frequently Used
        sortedEntries = entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
        break;
      case 'FIFO': // First In, First Out
      default:
        sortedEntries = entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
        break;
    }

    // Remove entries until we have enough space
    for (const [key, entry] of sortedEntries) {
      this.cache.delete(key);
      freedSize += entry.size;
      
      if (freedSize >= requiredSize && this.cache.size < this.config.maxEntries) {
        break;
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // Ensure we're within size limits
    this.ensureCacheSpace(0);

    if (removedCount > 0) {
      this.updateStats();
      this.saveCacheToStorage();
    }

    this.stats.lastCleanup = now;
    console.log(`Cache cleanup completed. Removed ${removedCount} expired entries.`);
  }

  private initializePeriodicCleanup(): void {
    timer(this.config.cleanupInterval, this.config.cleanupInterval)
      .subscribe(() => this.cleanup());
  }

  private recordCacheHit(request: HttpRequest<any>): void {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    this.updateHitRate();

    const strategy = this.getCacheStrategy(request);
    this.updateStrategyStats(strategy, 'hit');
  }

  private recordCacheMiss(request: HttpRequest<any>): void {
    this.stats.totalRequests++;
    this.stats.cacheMisses++;
    this.updateHitRate();

    const strategy = this.getCacheStrategy(request);
    this.updateStrategyStats(strategy, 'miss');
  }

  private updateStrategyStats(strategy: CacheStrategy, type: 'hit' | 'miss'): void {
    if (!this.stats.strategies[strategy]) {
      this.stats.strategies[strategy] = { entries: 0, hits: 0, misses: 0 };
    }

    if (type === 'hit') {
      this.stats.strategies[strategy].hits++;
    } else {
      this.stats.strategies[strategy].misses++;
    }
  }

  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = (this.stats.cacheHits / this.stats.totalRequests) * 100;
      this.stats.missRate = (this.stats.cacheMisses / this.stats.totalRequests) * 100;
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    // Update strategy entries count
    for (const strategy in this.stats.strategies) {
      this.stats.strategies[strategy].entries = Array.from(this.cache.values())
        .filter(entry => this.getCacheStrategy({ url: entry.url } as any) === strategy).length;
    }

    this.statsSubject.next({ ...this.stats });
  }

  private resetStats(): void {
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastCleanup: Date.now(),
      strategies: {}
    };
    this.statsSubject.next({ ...this.stats });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private saveCacheToStorage(): void {
    try {
      // Only save cache metadata to localStorage (not the actual responses)
      const metadata = Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        url: entry.url,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        tags: entry.tags,
        size: entry.size,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }));

      localStorage.setItem('http_cache_metadata', JSON.stringify({
        metadata,
        stats: this.stats,
        config: this.config
      }));
    } catch (error) {
      console.warn('Failed to save cache metadata to localStorage:', error);
    }
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('http_cache_metadata');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
          this.statsSubject.next({ ...this.stats });
        }
        if (data.config) {
          this.config = { ...this.config, ...data.config };
        }
      }
    } catch (error) {
      console.warn('Failed to load cache metadata from localStorage:', error);
    }
  }
}