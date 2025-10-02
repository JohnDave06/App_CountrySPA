import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export interface QueryParams {
  search?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
  availability?: boolean;
  rating?: number;
}

export interface QueryParamsUpdate {
  params: Partial<QueryParams>;
  replaceUrl?: boolean;
  skipLocationChange?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QueryParamsService {
  private readonly defaultParams: QueryParams = {
    search: '',
    category: '',
    priceMin: 0,
    priceMax: 1000,
    page: 1,
    limit: 12,
    sortBy: 'name',
    sortOrder: 'asc',
    tags: [],
    availability: undefined,
    rating: undefined
  };

  private paramsSubject = new BehaviorSubject<QueryParams>(this.defaultParams);
  private updateQueue: Partial<QueryParams>[] = [];
  private isUpdating = false;

  public readonly params$ = this.paramsSubject.asObservable();
  
  // Specific parameter observables for optimized subscriptions
  public readonly search$ = this.params$.pipe(
    map(params => params.search || ''),
    distinctUntilChanged()
  );

  public readonly category$ = this.params$.pipe(
    map(params => params.category || ''),
    distinctUntilChanged()
  );

  public readonly priceRange$ = this.params$.pipe(
    map(params => ({ min: params.priceMin || 0, max: params.priceMax || 1000 })),
    distinctUntilChanged((prev, curr) => 
      prev.min === curr.min && prev.max === curr.max
    )
  );

  public readonly pagination$ = this.params$.pipe(
    map(params => ({ 
      page: params.page || 1, 
      limit: params.limit || 12,
      offset: ((params.page || 1) - 1) * (params.limit || 12)
    })),
    distinctUntilChanged((prev, curr) => 
      prev.page === curr.page && prev.limit === curr.limit
    )
  );

  public readonly sorting$ = this.params$.pipe(
    map(params => ({ 
      sortBy: params.sortBy || 'name', 
      sortOrder: params.sortOrder || 'asc' 
    })),
    distinctUntilChanged((prev, curr) => 
      prev.sortBy === curr.sortBy && prev.sortOrder === curr.sortOrder
    )
  );

  public readonly filters$ = this.params$.pipe(
    map(params => ({
      search: params.search || '',
      category: params.category || '',
      priceMin: params.priceMin || 0,
      priceMax: params.priceMax || 1000,
      tags: params.tags || [],
      availability: params.availability,
      rating: params.rating
    })),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  // Combined state for complex filtering
  public readonly filterState$ = combineLatest([
    this.search$,
    this.category$,
    this.priceRange$,
    this.sorting$,
    this.pagination$
  ]).pipe(
    map(([search, category, priceRange, sorting, pagination]) => ({
      search,
      category,
      priceRange,
      sorting,
      pagination,
      isEmpty: !search && !category && priceRange.min === 0 && priceRange.max === 1000
    }))
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeFromRoute();
  }

  /**
   * Initialize query parameters from current route
   */
  private initializeFromRoute(): void {
    const queryParams = this.route.snapshot.queryParams;
    const parsedParams = this.parseQueryParams(queryParams);
    this.paramsSubject.next({ ...this.defaultParams, ...parsedParams });
  }

  /**
   * Parse query parameters from URL
   */
  private parseQueryParams(queryParams: any): Partial<QueryParams> {
    const parsed: Partial<QueryParams> = {};

    if (queryParams.search) {
      parsed.search = queryParams.search;
    }

    if (queryParams.category) {
      parsed.category = queryParams.category;
    }

    if (queryParams.priceMin !== undefined) {
      const priceMin = Number(queryParams.priceMin);
      if (!isNaN(priceMin)) parsed.priceMin = priceMin;
    }

    if (queryParams.priceMax !== undefined) {
      const priceMax = Number(queryParams.priceMax);
      if (!isNaN(priceMax)) parsed.priceMax = priceMax;
    }

    if (queryParams.page !== undefined) {
      const page = Number(queryParams.page);
      if (!isNaN(page) && page > 0) parsed.page = page;
    }

    if (queryParams.limit !== undefined) {
      const limit = Number(queryParams.limit);
      if (!isNaN(limit) && limit > 0) parsed.limit = limit;
    }

    if (queryParams.sortBy) {
      parsed.sortBy = queryParams.sortBy;
    }

    if (queryParams.sortOrder && ['asc', 'desc'].includes(queryParams.sortOrder)) {
      parsed.sortOrder = queryParams.sortOrder as 'asc' | 'desc';
    }

    if (queryParams.tags) {
      try {
        const tags = Array.isArray(queryParams.tags) 
          ? queryParams.tags 
          : queryParams.tags.split(',');
        parsed.tags = tags.filter((tag: any) => typeof tag === 'string' && tag.trim());
      } catch (error) {
        console.warn('Failed to parse tags from query params:', error);
      }
    }

    if (queryParams.availability !== undefined) {
      parsed.availability = queryParams.availability === 'true';
    }

    if (queryParams.rating !== undefined) {
      const rating = Number(queryParams.rating);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        parsed.rating = rating;
      }
    }

    return parsed;
  }

  /**
   * Update query parameters
   */
  updateParams(update: QueryParamsUpdate): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.updateQueue.push(update.params);
      
      if (!this.isUpdating) {
        this.processUpdateQueue(update.replaceUrl, update.skipLocationChange)
          .then(resolve)
          .catch(reject);
      } else {
        // If already updating, resolve immediately as update will be processed
        resolve(true);
      }
    });
  }

  /**
   * Process queued parameter updates
   */
  private async processUpdateQueue(
    replaceUrl = false, 
    skipLocationChange = false
  ): Promise<boolean> {
    if (this.isUpdating || this.updateQueue.length === 0) {
      return true;
    }

    this.isUpdating = true;

    try {
      // Merge all queued updates
      const mergedUpdate = this.updateQueue.reduce((acc, update) => ({
        ...acc,
        ...update
      }), {});

      this.updateQueue = [];

      // Update internal state
      const currentParams = this.paramsSubject.value;
      const newParams = { ...currentParams, ...mergedUpdate };
      
      // Clean up undefined values
      Object.keys(newParams).forEach(key => {
        if (newParams[key as keyof QueryParams] === undefined || 
            newParams[key as keyof QueryParams] === null) {
          delete newParams[key as keyof QueryParams];
        }
      });

      this.paramsSubject.next(newParams);

      // Update URL
      const queryParams = this.serializeParams(newParams);
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl,
        skipLocationChange
      });

      return true;
    } catch (error) {
      console.error('Failed to update query parameters:', error);
      return false;
    } finally {
      this.isUpdating = false;
      
      // Process any additional updates that came in
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.processUpdateQueue(replaceUrl, skipLocationChange), 0);
      }
    }
  }

  /**
   * Serialize parameters for URL
   */
  private serializeParams(params: QueryParams): any {
    const serialized: any = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'tags' && Array.isArray(value) && value.length > 0) {
          serialized[key] = value.join(',');
        } else if (typeof value === 'boolean') {
          serialized[key] = value.toString();
        } else if (typeof value === 'number') {
          serialized[key] = value.toString();
        } else if (typeof value === 'string' && value.trim()) {
          serialized[key] = value.trim();
        }
      }
    });

    return serialized;
  }

  /**
   * Set search term
   */
  setSearch(search: string, options?: { debounce?: number }): Promise<boolean> {
    const update = { search: search || undefined };
    
    if (options?.debounce) {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.updateParams({ params: update }).then(resolve);
        }, options.debounce);
      });
    }
    
    return this.updateParams({ params: update });
  }

  /**
   * Set category filter
   */
  setCategory(category: string): Promise<boolean> {
    return this.updateParams({ 
      params: { 
        category: category || undefined, 
        page: 1 // Reset to first page when changing category
      } 
    });
  }

  /**
   * Set price range
   */
  setPriceRange(min: number, max: number): Promise<boolean> {
    return this.updateParams({ 
      params: { 
        priceMin: min !== this.defaultParams.priceMin ? min : undefined,
        priceMax: max !== this.defaultParams.priceMax ? max : undefined,
        page: 1 // Reset to first page when changing price range
      } 
    });
  }

  /**
   * Set pagination
   */
  setPagination(page: number, limit?: number): Promise<boolean> {
    const params: Partial<QueryParams> = { page };
    if (limit !== undefined) {
      params.limit = limit;
    }
    return this.updateParams({ params });
  }

  /**
   * Set sorting
   */
  setSorting(sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): Promise<boolean> {
    return this.updateParams({ 
      params: { 
        sortBy, 
        sortOrder,
        page: 1 // Reset to first page when changing sort
      } 
    });
  }

  /**
   * Add tag filter
   */
  addTag(tag: string): Promise<boolean> {
    const currentTags = this.paramsSubject.value.tags || [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      return this.updateParams({ 
        params: { 
          tags: newTags,
          page: 1 // Reset to first page when adding tag
        } 
      });
    }
    return Promise.resolve(true);
  }

  /**
   * Remove tag filter
   */
  removeTag(tag: string): Promise<boolean> {
    const currentTags = this.paramsSubject.value.tags || [];
    const newTags = currentTags.filter(t => t !== tag);
    return this.updateParams({ 
      params: { 
        tags: newTags.length > 0 ? newTags : undefined,
        page: 1 // Reset to first page when removing tag
      } 
    });
  }

  /**
   * Set availability filter
   */
  setAvailability(availability: boolean | undefined): Promise<boolean> {
    return this.updateParams({ 
      params: { 
        availability,
        page: 1 // Reset to first page when changing availability
      } 
    });
  }

  /**
   * Set rating filter
   */
  setRating(rating: number | undefined): Promise<boolean> {
    return this.updateParams({ 
      params: { 
        rating,
        page: 1 // Reset to first page when changing rating
      } 
    });
  }

  /**
   * Clear all filters
   */
  clearFilters(): Promise<boolean> {
    return this.updateParams({ 
      params: {
        search: undefined,
        category: undefined,
        priceMin: undefined,
        priceMax: undefined,
        tags: undefined,
        availability: undefined,
        rating: undefined,
        page: 1
      }
    });
  }

  /**
   * Clear all parameters and reset to defaults
   */
  reset(): Promise<boolean> {
    return this.updateParams({ 
      params: this.defaultParams,
      replaceUrl: true
    });
  }

  /**
   * Get current parameter values
   */
  getCurrentParams(): QueryParams {
    return { ...this.paramsSubject.value };
  }

  /**
   * Generate shareable URL with current parameters
   */
  getShareableUrl(): string {
    const currentParams = this.getCurrentParams();
    const queryParams = this.serializeParams(currentParams);
    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams
    });
    return this.router.serializeUrl(urlTree);
  }

  /**
   * Check if parameters have specific values
   */
  hasFilters(): boolean {
    const params = this.getCurrentParams();
    return !!(
      params.search ||
      params.category ||
      (params.priceMin !== undefined && params.priceMin !== this.defaultParams.priceMin) ||
      (params.priceMax !== undefined && params.priceMax !== this.defaultParams.priceMax) ||
      (params.tags && params.tags.length > 0) ||
      params.availability !== undefined ||
      params.rating !== undefined
    );
  }

  /**
   * Get filter summary for display
   */
  getFilterSummary(): string[] {
    const params = this.getCurrentParams();
    const summary: string[] = [];

    if (params.search) {
      summary.push(`Búsqueda: "${params.search}"`);
    }

    if (params.category) {
      summary.push(`Categoría: ${params.category}`);
    }

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      const min = params.priceMin || 0;
      const max = params.priceMax || 1000;
      summary.push(`Precio: $${min} - $${max}`);
    }

    if (params.tags && params.tags.length > 0) {
      summary.push(`Etiquetas: ${params.tags.join(', ')}`);
    }

    if (params.availability !== undefined) {
      summary.push(`Disponible: ${params.availability ? 'Sí' : 'No'}`);
    }

    if (params.rating !== undefined) {
      summary.push(`Calificación: ${params.rating}+ estrellas`);
    }

    return summary;
  }
}