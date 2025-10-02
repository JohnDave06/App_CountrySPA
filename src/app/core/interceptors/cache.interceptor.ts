import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap, share, finalize } from 'rxjs/operators';
import { HttpCacheService, CacheStrategy } from '../services/http-cache.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private pendingRequests = new Map<string, Observable<HttpEvent<any>>>();

  constructor(
    private cacheService: HttpCacheService,
    private notificationService: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip caching if not appropriate
    if (!this.cacheService.shouldCache(req)) {
      return next.handle(req);
    }

    const strategy = this.cacheService.getCacheStrategy(req);
    const cacheKey = this.generateCacheKey(req);

    // Handle different caching strategies
    switch (strategy) {
      case 'cache-only':
        return this.handleCacheOnly(req, next);
      
      case 'network-only':
        return this.handleNetworkOnly(req, next);
      
      case 'cache-first':
        return this.handleCacheFirst(req, next);
      
      case 'network-first':
        return this.handleNetworkFirst(req, next);
      
      case 'stale-while-revalidate':
        return this.handleStaleWhileRevalidate(req, next);
      
      default:
        return this.handleCacheFirst(req, next);
    }
  }

  /**
   * Cache-only strategy: Only serve from cache
   */
  private handleCacheOnly(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const cached = this.cacheService.get(req);
    
    if (cached) {
      return of(cached.response.clone());
    }

    // Return error response if not in cache
    return of(new HttpResponse({
      status: 504,
      statusText: 'Gateway Timeout',
      body: { error: 'Resource not available in cache' }
    }));
  }

  /**
   * Network-only strategy: Always fetch from network
   */
  private handleNetworkOnly(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Still cache the response for future cache-first requests
          this.cacheService.put(req, event, {
            tags: this.extractCacheTags(req),
            ttl: this.getTtlForRequest(req)
          });
        }
      })
    );
  }

  /**
   * Cache-first strategy: Try cache first, then network
   */
  private handleCacheFirst(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {    const cached = this.cacheService.get(req);
    
    if (cached) {
      return of(cached.response.clone());
    }

    // Not in cache, fetch from network
    return this.fetchFromNetwork(req, next);
  }

  /**
   * Network-first strategy: Try network first, fallback to cache
   */
  private handleNetworkFirst(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cacheService.put(req, event, {
            tags: this.extractCacheTags(req),
            ttl: this.getTtlForRequest(req)
          });
        }
      }),
      // On error, try to serve from cache
      switchMap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.ok) {
          return of(event);
        }
        
        // If there's an error or non-ok response, try cache
        const cached = this.cacheService.get(req);
        if (cached) {
          this.notificationService.infoToast(
            'Serving Cached Data',
            'Network request failed, serving cached version',
            { duration: 3000 }
          );
          return of(cached.response.clone());
        }
        
        return of(event);
      })
    );
  }

  /**
   * Stale-while-revalidate strategy: Serve from cache immediately, update in background
   */
  private handleStaleWhileRevalidate(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const cached = this.cacheService.get(req);
    
    if (cached) {
      // Serve cached response immediately
      const cachedResponse = of(cached.response.clone());
      
      // Update cache in background (fire and forget)
      this.updateCacheInBackground(req, next);
      
      return cachedResponse;
    }

    // No cache available, fetch from network
    return this.fetchFromNetwork(req, next);
  }

  /**
   * Fetch from network and cache the response
   */
  private fetchFromNetwork(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const cacheKey = this.generateCacheKey(req);
    
    // Check if this request is already pending to avoid duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const request$ = next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Cache successful responses
          if (event.ok) {
            this.cacheService.put(req, event, {
              tags: this.extractCacheTags(req),
              ttl: this.getTtlForRequest(req)
            });
          }
        }
      }),
      finalize(() => {
        // Remove from pending requests when completed
        this.pendingRequests.delete(cacheKey);
      }),
      share() // Share the observable to avoid multiple subscriptions
    );

    // Store the pending request
    this.pendingRequests.set(cacheKey, request$);
    
    return request$;
  }

  /**
   * Update cache in background without affecting the response
   */
  private updateCacheInBackground(req: HttpRequest<any>, next: HttpHandler): void {
    const cacheKey = this.generateCacheKey(req);
    
    // Don't start another background update if one is already pending
    if (this.pendingRequests.has(cacheKey + '_bg')) {
      return;
    }

    const backgroundUpdate$ = next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse && event.ok) {
          this.cacheService.put(req, event, {
            tags: this.extractCacheTags(req),
            ttl: this.getTtlForRequest(req)
          });
        }
      }),
      finalize(() => {
        this.pendingRequests.delete(cacheKey + '_bg');
      }),
      share()
    );

    this.pendingRequests.set(cacheKey + '_bg', backgroundUpdate$);
    
    // Subscribe to trigger the request (fire and forget)
    backgroundUpdate$.subscribe({
      next: () => {}, // We don't need to do anything with the response
      error: (error) => {
        console.warn('Background cache update failed:', error);
      }
    });
  }

  /**
   * Generate cache key for the request
   */
  private generateCacheKey(req: HttpRequest<any>): string {
    return `${req.method}:${req.urlWithParams}`;
  }

  /**
   * Extract cache tags from request headers or URL
   */
  private extractCacheTags(req: HttpRequest<any>): string[] {
    const tags: string[] = [];
    
    // Check for explicit cache tags in headers
    const cacheTagsHeader = req.headers.get('x-cache-tags');
    if (cacheTagsHeader) {
      tags.push(...cacheTagsHeader.split(',').map(tag => tag.trim()));
    }

    // Add automatic tags based on URL patterns
    if (req.url.includes('/api/services')) {
      tags.push('services');
    }
    
    if (req.url.includes('/api/search')) {
      tags.push('search');
    }
    
    if (req.url.includes('/api/user')) {
      tags.push('user');
    }
    
    if (req.url.match(/\/api\/services\/\d+/)) {
      const serviceId = req.url.match(/\/api\/services\/(\d+)/)?.[1];
      if (serviceId) {
        tags.push(`service-${serviceId}`);
      }
    }

    return tags;
  }

  /**
   * Get TTL for specific request types
   */
  private getTtlForRequest(req: HttpRequest<any>): number {
    // Check for explicit TTL in headers
    const ttlHeader = req.headers.get('x-cache-ttl');
    if (ttlHeader) {
      const ttl = parseInt(ttlHeader, 10);
      if (!isNaN(ttl)) {
        return ttl * 1000; // Convert to milliseconds
      }
    }

    // Default TTLs based on URL patterns
    if (req.url.includes('/api/static') || req.url.includes('/api/config')) {
      return 60 * 60 * 1000; // 1 hour
    }

    if (req.url.includes('/api/services')) {
      return 15 * 60 * 1000; // 15 minutes
    }

    if (req.url.includes('/api/search')) {
      return 5 * 60 * 1000; // 5 minutes
    }

    if (req.url.includes('/api/user')) {
      return 2 * 60 * 1000; // 2 minutes
    }

    // Default TTL
    return 10 * 60 * 1000; // 10 minutes
  }
}