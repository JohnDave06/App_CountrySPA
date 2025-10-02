import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, Observable, timer } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { HttpCacheService, CacheEntry, CacheStats, CacheStrategy } from '../../../core/services/http-cache.service';
import { HttpDemoService } from '../../../core/services/http-demo.service';

interface CacheDemo {
  name: string;
  description: string;
  strategy: CacheStrategy;
  endpoint: string;
  ttl?: number;
  tags?: string[];
  lastExecuted?: number;
  responseTime?: number;
  fromCache?: boolean;
}

@Component({
  selector: 'app-cache-demo',
  templateUrl: './cache-demo.component.html',
  styleUrls: ['./cache-demo.component.css']
})
export class CacheDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Cache statistics
  cacheStats$: Observable<CacheStats>;
  cacheEntries: CacheEntry[] = [];
  
  // Demo configurations
  cacheDemos: CacheDemo[] = [
    {
      name: 'Cache First - Services',
      description: 'Sirve desde cache si está disponible, si no va a la red',
      strategy: 'cache-first',
      endpoint: '/api/services',
      ttl: 300000, // 5 minutes
      tags: ['services', 'data']
    },
    {
      name: 'Network First - User Profile',
      description: 'Intenta la red primero, fallback a cache en caso de error',
      strategy: 'network-first',
      endpoint: '/api/user/profile',
      ttl: 120000, // 2 minutes
      tags: ['user', 'profile']
    },
    {
      name: 'Stale While Revalidate - Search',
      description: 'Sirve cache inmediatamente, actualiza en segundo plano',
      strategy: 'stale-while-revalidate',
      endpoint: '/api/search/results',
      ttl: 180000, // 3 minutes
      tags: ['search', 'results']
    },
    {
      name: 'Cache Only - Static Config',
      description: 'Solo sirve desde cache, nunca va a la red',
      strategy: 'cache-only',
      endpoint: '/api/config/static',
      ttl: 3600000, // 1 hour
      tags: ['config', 'static']
    },
    {
      name: 'Network Only - Analytics',
      description: 'Siempre va a la red, no usa cache',
      strategy: 'network-only',
      endpoint: '/api/analytics/events',
      tags: ['analytics', 'realtime']
    }
  ];

  // Cache management
  selectedDemo: CacheDemo | null = null;
  autoRefreshEnabled = false;
  autoRefreshInterval = 5000; // 5 seconds
  
  // Statistics
  requestsLog: Array<{
    timestamp: number;
    demo: string;
    strategy: CacheStrategy;
    responseTime: number;
    fromCache: boolean;
    size?: number;
  }> = [];

  constructor(
    private httpCacheService: HttpCacheService,
    private httpDemoService: HttpDemoService,
    private http: HttpClient
  ) {
    this.cacheStats$ = this.httpCacheService.stats$;
  }

  ngOnInit(): void {
    this.loadCacheEntries();
    this.setupAutoRefresh();
    
    // Subscribe to cache stats updates
    this.cacheStats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      console.log('Cache stats updated:', stats);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Execute a cache demo
   */
  async executeDemo(demo: CacheDemo): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create HTTP headers for cache configuration
      const headers = new HttpHeaders({
        'x-cache-strategy': demo.strategy,
        'x-cache-ttl': demo.ttl ? (demo.ttl / 1000).toString() : '300',
        'x-cache-tags': demo.tags ? demo.tags.join(',') : ''
      });

      const request$ = this.createMockRequest(demo.endpoint, headers);
      
      const response = await request$.toPromise();
      const responseTime = Date.now() - startTime;
      
      // Check if response came from cache
      const cacheEntry = this.httpCacheService.get({
        method: 'GET',
        url: demo.endpoint,
        headers
      } as any);
      
      const fromCache = cacheEntry !== null && responseTime < 100; // Assume cache if very fast
      
      // Update demo info
      demo.lastExecuted = Date.now();
      demo.responseTime = responseTime;
      demo.fromCache = fromCache;
      
      // Add to requests log
      this.requestsLog.unshift({
        timestamp: Date.now(),
        demo: demo.name,
        strategy: demo.strategy,
        responseTime,
        fromCache,
        size: JSON.stringify(response).length
      });
      
      // Keep only last 50 requests
      if (this.requestsLog.length > 50) {
        this.requestsLog = this.requestsLog.slice(0, 50);
      }
      
      // Refresh cache entries
      this.loadCacheEntries();
      
    } catch (error) {
      console.error('Demo execution failed:', error);
      demo.responseTime = Date.now() - startTime;
      demo.fromCache = false;
    }
  }

  /**
   * Execute all demos in sequence
   */
  async executeAllDemos(): Promise<void> {
    for (const demo of this.cacheDemos) {
      await this.executeDemo(demo);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(): void {
    const pattern = prompt('Enter URL pattern to invalidate (regex):');
    if (pattern) {
      const count = this.httpCacheService.invalidateByPattern(pattern);
      alert(`Invalidated ${count} cache entries`);
      this.loadCacheEntries();
    }
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(): void {
    const tags = prompt('Enter tags to invalidate (comma-separated):');
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      const count = this.httpCacheService.invalidateByTags(tagArray);
      alert(`Invalidated ${count} cache entries`);
      this.loadCacheEntries();
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    if (confirm('Are you sure you want to clear the entire cache?')) {
      this.httpCacheService.clear();
      this.loadCacheEntries();
      this.requestsLog = [];
    }
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(): void {
    const currentConfig = this.httpCacheService.getConfig();
    
    const maxSize = prompt('Max cache size (MB):', (currentConfig.maxSize / (1024 * 1024)).toString());
    const maxEntries = prompt('Max cache entries:', currentConfig.maxEntries.toString());
    const defaultTtl = prompt('Default TTL (minutes):', (currentConfig.defaultTtl / (60 * 1000)).toString());
    
    if (maxSize && maxEntries && defaultTtl) {
      this.httpCacheService.updateConfig({
        maxSize: parseInt(maxSize) * 1024 * 1024,
        maxEntries: parseInt(maxEntries),
        defaultTtl: parseInt(defaultTtl) * 60 * 1000
      });
      
      alert('Cache configuration updated!');
    }
  }

  /**
   * Toggle auto refresh
   */
  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    this.setupAutoRefresh();
  }

  /**
   * Get cache size information
   */
  getCacheSize(): { entries: number; size: string; maxSize: string } {
    return this.httpCacheService.getCacheSize();
  }

  /**
   * Format timestamp
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  /**
   * Format bytes
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get strategy color for UI
   */
  getStrategyColor(strategy: CacheStrategy): string {
    const colors = {
      'cache-first': 'bg-blue-100 text-blue-800',
      'network-first': 'bg-green-100 text-green-800',
      'cache-only': 'bg-purple-100 text-purple-800',
      'network-only': 'bg-red-100 text-red-800',
      'stale-while-revalidate': 'bg-yellow-100 text-yellow-800'
    };
    return colors[strategy] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get time until expiration
   */
  getTimeUntilExpiration(entry: CacheEntry): string {
    const remaining = entry.ttl - (Date.now() - entry.timestamp);
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Track by function for ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }

  trackByUrl(index: number, entry: CacheEntry): string {
    return entry.url;
  }

  // Private methods

  private loadCacheEntries(): void {
    this.cacheEntries = this.httpCacheService.getCacheEntries();
  }

  private setupAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      timer(0, this.autoRefreshInterval).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.loadCacheEntries();
      });
    }
  }

  private createMockRequest(endpoint: string, headers: HttpHeaders): Observable<any> {
    // Create mock responses based on endpoint
    switch (endpoint) {
      case '/api/services':
        return this.httpDemoService.getServices();
      
      case '/api/user/profile':
        return this.http.get('https://jsonplaceholder.typicode.com/users/1', { headers });
      
      case '/api/search/results':
        return this.httpDemoService.getSlowData();
      
      case '/api/config/static':
        return this.http.get('https://jsonplaceholder.typicode.com/posts/1', { headers });
      
      case '/api/analytics/events':
        return this.http.get('https://jsonplaceholder.typicode.com/comments/1', { headers });
      
      default:
        return this.httpDemoService.getServices();
    }
  }
}