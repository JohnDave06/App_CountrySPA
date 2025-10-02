import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, merge, EMPTY, of, timer } from 'rxjs';
import { 
  map, 
  switchMap, 
  debounceTime, 
  distinctUntilChanged, 
  startWith, 
  catchError, 
  retry, 
  shareReplay, 
  withLatestFrom,
  mergeMap,
  concatMap,
  exhaustMap,
  filter,
  tap,
  finalize,
  throttleTime,
  scan,
  buffer,
  bufferTime,
  take,
  takeUntil,
  takeWhile
} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface SearchFilters {
  searchTerm: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  rating: number;
  availability: boolean;
  sortBy: 'name' | 'price' | 'rating' | 'date';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult {
  items: any[];
  totalCount: number;
  hasMore: boolean;
  searchTime: number;
  facets: {
    categories: { name: string; count: number }[];
    priceRanges: { range: string; count: number }[];
    ratings: { rating: number; count: number }[];
  };
}

export interface SearchState {
  loading: boolean;
  results: SearchResult | null;
  error: string | null;
  filters: SearchFilters;
  searchHistory: string[];
  suggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedSearchService {
  // Core search state
  private searchTermSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<string>('');
  private priceRangeSubject = new BehaviorSubject<{ min: number; max: number }>({ min: 0, max: 10000 });
  private ratingSubject = new BehaviorSubject<number>(0);
  private availabilitySubject = new BehaviorSubject<boolean>(true);
  private sortSubject = new BehaviorSubject<{ field: string; order: 'asc' | 'desc' }>({ field: 'name', order: 'asc' });
  
  // UI state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private searchHistorySubject = new BehaviorSubject<string[]>([]);
  private suggestionsSubject = new BehaviorSubject<string[]>([]);

  // Mock data for demonstration
  private mockServices = [
    { id: 1, name: 'Massage Relaxante', category: 'massage', price: 1200, rating: 4.8, availability: true, description: 'Masaje relajante con aceites esenciales' },
    { id: 2, name: 'Facial Rejuvenecedor', category: 'facial', price: 800, rating: 4.6, availability: true, description: 'Tratamiento facial anti-edad' },
    { id: 3, name: 'Manicura Premium', category: 'beauty', price: 400, rating: 4.9, availability: false, description: 'Manicura completa con gel' },
    { id: 4, name: 'Pedicura Spa', category: 'beauty', price: 500, rating: 4.7, availability: true, description: 'Pedicura relajante con exfoliación' },
    { id: 5, name: 'Terapia de Piedras', category: 'massage', price: 1500, rating: 4.9, availability: true, description: 'Masaje con piedras calientes' },
    { id: 6, name: 'Limpieza Profunda', category: 'facial', price: 600, rating: 4.5, availability: true, description: 'Limpieza facial profunda con vapor' },
    { id: 7, name: 'Aromaterapia', category: 'therapy', price: 900, rating: 4.8, availability: true, description: 'Sesión de aromaterapia relajante' },
    { id: 8, name: 'Reflexología', category: 'therapy', price: 700, rating: 4.6, availability: false, description: 'Masaje de reflexología podal' },
    { id: 9, name: 'Peeling Químico', category: 'facial', price: 1000, rating: 4.4, availability: true, description: 'Peeling químico profesional' },
    { id: 10, name: 'Masaje Deportivo', category: 'massage', price: 1100, rating: 4.7, availability: true, description: 'Masaje terapéutico para deportistas' }
  ];

  constructor(private http: HttpClient) {
    this.initializeSearchPipeline();
    this.initializeAutoSuggestions();
    this.initializeSearchHistory();
  }

  // Public observables
  public readonly searchTerm$ = this.searchTermSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly searchHistory$ = this.searchHistorySubject.asObservable();
  public readonly suggestions$ = this.suggestionsSubject.asObservable();

  // Advanced search pipeline using multiple RxJS operators
  public readonly searchResults$: Observable<SearchResult> = this.initializeSearchPipeline();

  // Combined search state for easy consumption
  public readonly searchState$: Observable<SearchState> = combineLatest([
    this.loading$,
    this.searchResults$.pipe(startWith(null)),
    this.error$,
    this.getCurrentFilters(),
    this.searchHistory$,
    this.suggestions$
  ]).pipe(
    map(([loading, results, error, filters, searchHistory, suggestions]) => ({
      loading,
      results,
      error,
      filters,
      searchHistory,
      suggestions
    })),
    shareReplay(1)
  );

  // Initialize the main search pipeline with advanced RxJS operators
  private initializeSearchPipeline(): Observable<SearchResult> {
    return combineLatest([
      this.searchTermSubject.pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit when value actually changes
        tap(term => console.log('Search term changed:', term))
      ),
      this.categorySubject.pipe(distinctUntilChanged()),
      this.priceRangeSubject.pipe(distinctUntilChanged((prev, curr) => 
        prev.min === curr.min && prev.max === curr.max
      )),
      this.ratingSubject.pipe(distinctUntilChanged()),
      this.availabilitySubject.pipe(distinctUntilChanged()),
      this.sortSubject.pipe(distinctUntilChanged((prev, curr) => 
        prev.field === curr.field && prev.order === curr.order
      ))
    ]).pipe(
      // Log all filter changes for debugging
      tap(([term, category, price, rating, availability, sort]) => 
        console.log('Filters changed:', { term, category, price, rating, availability, sort })
      ),
      
      // Throttle rapid filter changes to avoid excessive API calls
      throttleTime(200),
      
      // Switch to new search when filters change (cancel previous search)
      switchMap(([searchTerm, category, priceRange, rating, availability, sort]) => {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        
        const filters: SearchFilters = {
          searchTerm,
          category,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          rating,
          availability,
          sortBy: sort.field as any,
          sortOrder: sort.order
        };

        return this.performSearch(filters).pipe(
          // Add search term to history if it's not empty
          tap(result => {
            if (searchTerm.trim() && result.items.length > 0) {
              this.addToSearchHistory(searchTerm);
            }
          }),
          
          // Handle errors gracefully
          catchError(error => {
            console.error('Search error:', error);
            this.errorSubject.next('Error al realizar la búsqueda. Intenta de nuevo.');
            return of({
              items: [],
              totalCount: 0,
              hasMore: false,
              searchTime: 0,
              facets: { categories: [], priceRanges: [], ratings: [] }
            });
          }),
          
          // Always clear loading state
          finalize(() => this.loadingSubject.next(false))
        );
      }),
      
      // Share the result among multiple subscribers
      shareReplay(1)
    );
  }

  // Auto-suggestions using advanced operators
  private initializeAutoSuggestions(): void {
    this.searchTermSubject.pipe(
      // Only process terms with at least 2 characters
      filter(term => term.length >= 2),
      
      // Debounce user input
      debounceTime(150),
      distinctUntilChanged(),
      
      // Switch to new suggestion request
      switchMap(term => 
        this.getSuggestions(term).pipe(
          catchError(() => of([])) // Ignore suggestion errors
        )
      )
    ).subscribe(suggestions => {
      this.suggestionsSubject.next(suggestions);
    });
  }

  // Search history management with buffer and scan operators
  private initializeSearchHistory(): void {
    // Buffer search terms and periodically save to localStorage
    this.searchHistorySubject.pipe(
      bufferTime(2000), // Buffer for 2 seconds
      filter(buffer => buffer.length > 0),
      map(buffer => buffer[buffer.length - 1]) // Take the latest
    ).subscribe(history => {
      localStorage.setItem('spa_search_history', JSON.stringify(history));
    });

    // Load initial history from localStorage
    const savedHistory = localStorage.getItem('spa_search_history');
    if (savedHistory) {
      try {
        this.searchHistorySubject.next(JSON.parse(savedHistory));
      } catch (e) {
        console.warn('Failed to load search history:', e);
      }
    }
  }

  // Simulate search API call with realistic delay and processing
  private performSearch(filters: SearchFilters): Observable<SearchResult> {
    const startTime = Date.now();
    
    return timer(300 + Math.random() * 700).pipe( // Simulate variable API response time
      map(() => {
        let filteredItems = [...this.mockServices];

        // Apply search term filter
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term)
          );
        }

        // Apply category filter
        if (filters.category) {
          filteredItems = filteredItems.filter(item => item.category === filters.category);
        }

        // Apply price range filter
        filteredItems = filteredItems.filter(item => 
          item.price >= filters.minPrice && item.price <= filters.maxPrice
        );

        // Apply rating filter
        if (filters.rating > 0) {
          filteredItems = filteredItems.filter(item => item.rating >= filters.rating);
        }

        // Apply availability filter
        if (filters.availability) {
          filteredItems = filteredItems.filter(item => item.availability);
        }

        // Apply sorting
        filteredItems.sort((a, b) => {
          let comparison = 0;
          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'price':
              comparison = a.price - b.price;
              break;
            case 'rating':
              comparison = a.rating - b.rating;
              break;
            default:
              comparison = 0;
          }
          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });

        // Generate facets for filtering
        const facets = this.generateFacets(this.mockServices);
        const searchTime = Date.now() - startTime;

        return {
          items: filteredItems,
          totalCount: filteredItems.length,
          hasMore: false, // For demo purposes
          searchTime,
          facets
        };
      }),
      
      // Retry failed searches up to 2 times
      retry(2)
    );
  }

  // Generate suggestions using mergeMap for parallel processing
  private getSuggestions(term: string): Observable<string[]> {
    const termLower = term.toLowerCase();
    
    return of(term).pipe(
      mergeMap(() => {
        // Simulate multiple suggestion sources processed in parallel
        const nameSuggestions$ = of(this.mockServices
          .filter(item => item.name.toLowerCase().includes(termLower))
          .map(item => item.name)
        );
        
        const categorySuggestions$ = of([...new Set(this.mockServices
          .filter(item => item.category.toLowerCase().includes(termLower))
          .map(item => item.category)
        )]);

        const descriptionSuggestions$ = of(this.mockServices
          .filter(item => item.description.toLowerCase().includes(termLower))
          .map(item => item.name)
        );

        // Merge all suggestion sources
        return merge(nameSuggestions$, categorySuggestions$, descriptionSuggestions$);
      }),
      
      // Scan to accumulate all suggestions
      scan((acc: string[], curr: string[]) => [...acc, ...curr], []),
      
      // Take only the final accumulated result
      take(3), // We have 3 sources
      
      map(suggestions => {
        // Remove duplicates and limit to 10 suggestions
        const unique = [...new Set(suggestions)];
        return unique.slice(0, 10);
      })
    );
  }

  // Generate facets for filtering UI
  private generateFacets(items: any[]) {
    const categories = items.reduce((acc, item) => {
      const existing = acc.find((cat: { name: string; count: number }) => cat.name === item.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: item.category, count: 1 });
      }
      return acc;
    }, [] as { name: string; count: number }[]);

    const priceRanges = [
      { range: '0-500', count: items.filter(item => item.price <= 500).length },
      { range: '500-1000', count: items.filter(item => item.price > 500 && item.price <= 1000).length },
      { range: '1000+', count: items.filter(item => item.price > 1000).length }
    ];

    const ratings = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: items.filter(item => Math.floor(item.rating) === rating).length
    })).filter(r => r.count > 0);

    return { categories, priceRanges, ratings };
  }

  // Public methods for updating search parameters
  public updateSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  public updateCategory(category: string): void {
    this.categorySubject.next(category);
  }

  public updatePriceRange(min: number, max: number): void {
    this.priceRangeSubject.next({ min, max });
  }

  public updateRating(rating: number): void {
    this.ratingSubject.next(rating);
  }

  public updateAvailability(availability: boolean): void {
    this.availabilitySubject.next(availability);
  }

  public updateSort(field: string, order: 'asc' | 'desc'): void {
    this.sortSubject.next({ field, order });
  }

  // Advanced search operations using different merge strategies
  public searchWithConcatMap(terms: string[]): Observable<SearchResult> {
    return of(...terms).pipe(
      concatMap(term => {
        this.updateSearchTerm(term);
        return this.searchResults$.pipe(take(1));
      })
    );
  }

  public searchWithMergeMap(terms: string[]): Observable<SearchResult> {
    return of(...terms).pipe(
      mergeMap(term => {
        this.updateSearchTerm(term);
        return this.searchResults$.pipe(take(1));
      })
    );
  }

  public searchWithExhaustMap(term: string): Observable<SearchResult> {
    return of(term).pipe(
      exhaustMap(searchTerm => {
        this.updateSearchTerm(searchTerm);
        return this.searchResults$.pipe(take(1));
      })
    );
  }

  // Utility methods
  private getCurrentFilters(): Observable<SearchFilters> {
    return combineLatest([
      this.searchTermSubject,
      this.categorySubject,
      this.priceRangeSubject,
      this.ratingSubject,
      this.availabilitySubject,
      this.sortSubject
    ]).pipe(
      map(([searchTerm, category, priceRange, rating, availability, sort]) => ({
        searchTerm,
        category,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        rating,
        availability,
        sortBy: sort.field as any,
        sortOrder: sort.order
      }))
    );
  }

  private addToSearchHistory(term: string): void {
    const currentHistory = this.searchHistorySubject.value;
    const newHistory = [term, ...currentHistory.filter(h => h !== term)].slice(0, 10);
    this.searchHistorySubject.next(newHistory);
  }

  public clearSearchHistory(): void {
    this.searchHistorySubject.next([]);
    localStorage.removeItem('spa_search_history');
  }

  public resetFilters(): void {
    this.searchTermSubject.next('');
    this.categorySubject.next('');
    this.priceRangeSubject.next({ min: 0, max: 10000 });
    this.ratingSubject.next(0);
    this.availabilitySubject.next(true);
    this.sortSubject.next({ field: 'name', order: 'asc' });
  }
}