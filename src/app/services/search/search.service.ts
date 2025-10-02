import { Injectable, signal, computed, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, EMPTY } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, startWith, tap, catchError } from 'rxjs/operators';
import { SpaServicesService, SpaService, ServiceFilters } from '../spa-services/spa-services.service';
import { CabinsService, Cabin, CabinFilters } from '../cabins/cabins.service';

export interface SearchFilters {
  query: string;
  category: 'all' | 'services' | 'cabins';
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  capacity?: number;
  duration?: number;
  isPopular?: boolean;
  checkIn?: string;
  checkOut?: string;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

export interface SearchResult {
  id: string;
  type: 'service' | 'cabin';
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category?: string;
  duration?: number;
  capacity?: { min: number; max: number };
  isPopular: boolean;
  isNew: boolean;
  tags: string[];
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  totalResults: number;
  isLoading: boolean;
  error: string | null;
  suggestions: string[];
  hasSearched: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Signals para manejo de estado reactivo
  private _searchQuery = signal<string>('');
  private _category = signal<'all' | 'services' | 'cabins'>('all');
  private _filters = signal<Partial<SearchFilters>>({});
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _results = signal<SearchResult[]>([]);
  private _totalResults = signal<number>(0);
  private _suggestions = signal<string[]>([]);
  private _hasSearched = signal<boolean>(false);

  // Signals públicos de solo lectura
  public readonly searchQuery = this._searchQuery.asReadonly();
  public readonly category = this._category.asReadonly();
  public readonly filters = this._filters.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly results = this._results.asReadonly();
  public readonly totalResults = this._totalResults.asReadonly();
  public readonly suggestions = this._suggestions.asReadonly();
  public readonly hasSearched = this._hasSearched.asReadonly();

  // Computed signals
  public readonly searchState = computed<SearchState>(() => ({
    query: this._searchQuery(),
    filters: {
      query: this._searchQuery(),
      category: this._category(),
      sortBy: 'relevance' as const,
      ...this._filters()
    },
    results: this._results(),
    totalResults: this._totalResults(),
    isLoading: this._isLoading(),
    error: this._error(),
    suggestions: this._suggestions(),
    hasSearched: this._hasSearched()
  }));

  public readonly hasResults = computed(() => this._results().length > 0);
  public readonly isEmpty = computed(() => this._hasSearched() && this._results().length === 0 && !this._isLoading());

  // BehaviorSubjects para compatibilidad con RxJS
  private searchSubject = new BehaviorSubject<string>('');
  private filtersSubject = new BehaviorSubject<SearchFilters>({
    query: '',
    category: 'all',
    sortBy: 'relevance'
  });

  // Observables para búsqueda reactiva
  public search$ = this.searchSubject.asObservable().pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(query => {
      this._searchQuery.set(query);
      if (query.trim()) {
        this._isLoading.set(true);
        this._error.set(null);
      }
    })
  );

  public searchResults$ = combineLatest([
    this.search$,
    this.filtersSubject.asObservable()
  ]).pipe(
    switchMap(([query, filters]) => {
      if (!query.trim()) {
        this._results.set([]);
        this._totalResults.set(0);
        this._isLoading.set(false);
        this._hasSearched.set(false);
        return EMPTY;
      }

      return this.performSearch(query, filters);
    }),
    catchError(error => {
      this._error.set('Error al realizar la búsqueda');
      this._isLoading.set(false);
      console.error('Search error:', error);
      return EMPTY;
    })
  );

  // Historial de búsquedas
  private searchHistory: string[] = [];
  private readonly maxHistoryItems = 10;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private spaServicesService: SpaServicesService,
    private cabinsService: CabinsService
  ) {
    this.initializeFromUrl();
    this.setupSearchEffects();
    this.loadSearchHistory();
    
    // Suscribirse a resultados de búsqueda
    this.searchResults$.subscribe();
  }

  /**
   * Inicia una búsqueda
   */
  search(query: string, updateUrl = true): void {
    this.searchSubject.next(query);
    this.addToHistory(query);
    
    if (updateUrl) {
      this.updateUrl({ query });
    }
  }

  /**
   * Actualiza la categoría de búsqueda
   */
  setCategory(category: 'all' | 'services' | 'cabins', updateUrl = true): void {
    this._category.set(category);
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, category });
    
    if (updateUrl) {
      this.updateUrl({ category });
    }
  }

  /**
   * Actualiza filtros de búsqueda
   */
  updateFilters(filters: Partial<SearchFilters>, updateUrl = true): void {
    const currentFilters = this._filters();
    const newFilters = { ...currentFilters, ...filters };
    this._filters.set(newFilters);
    
    const currentSearchFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentSearchFilters, ...newFilters });
    
    if (updateUrl) {
      this.updateUrl(newFilters);
    }
  }

  /**
   * Limpia filtros
   */
  clearFilters(updateUrl = true): void {
    this._filters.set({});
    this.filtersSubject.next({
      query: this._searchQuery(),
      category: this._category(),
      sortBy: 'relevance'
    });
    
    if (updateUrl) {
      this.updateUrl({}, true);
    }
  }

  /**
   * Limpia la búsqueda completa
   */
  clearSearch(): void {
    this._searchQuery.set('');
    this._category.set('all');
    this._filters.set({});
    this._results.set([]);
    this._totalResults.set(0);
    this._error.set(null);
    this._hasSearched.set(false);
    this._isLoading.set(false);
    
    this.searchSubject.next('');
    this.filtersSubject.next({
      query: '',
      category: 'all',
      sortBy: 'relevance'
    });
    
    this.router.navigate([], { queryParams: {} });
  }

  /**
   * Obtiene sugerencias de búsqueda
   */
  getSuggestions(query: string): void {
    if (!query.trim() || query.length < 2) {
      this._suggestions.set([]);
      return;
    }

    const suggestions: string[] = [];
    
    // Sugerencias de servicios
    this.spaServicesService.services$.subscribe(services => {
      services.forEach(service => {
        if (service.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(service.name);
        }
        service.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase()) && !suggestions.includes(tag)) {
            suggestions.push(tag);
          }
        });
      });
    });

    // Sugerencias de cabañas
    this.cabinsService.cabins$.subscribe(cabins => {
      cabins.forEach(cabin => {
        if (cabin.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(cabin.name);
        }
        cabin.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase()) && !suggestions.includes(tag)) {
            suggestions.push(tag);
          }
        });
      });
    });

    // Agregar historial relevante
    this.searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(query.toLowerCase()) && !suggestions.includes(historyItem)) {
        suggestions.push(historyItem);
      }
    });

    this._suggestions.set(suggestions.slice(0, 8));
  }

  /**
   * Obtiene el historial de búsquedas
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Limpia el historial de búsquedas
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('spa-search-history');
  }

  /**
   * Realiza la búsqueda actual
   */
  private performSearch(query: string, filters: SearchFilters): Observable<SearchResult[]> {
    this._hasSearched.set(true);
    
    return combineLatest([
      this.searchServices(query, filters),
      this.searchCabins(query, filters)
    ]).pipe(
      map(([serviceResults, cabinResults]) => {
        let allResults: SearchResult[] = [];
        
        if (filters.category === 'all' || filters.category === 'services') {
          allResults.push(...serviceResults);
        }
        
        if (filters.category === 'all' || filters.category === 'cabins') {
          allResults.push(...cabinResults);
        }
        
        // Ordenar resultados
        allResults = this.sortResults(allResults, filters.sortBy);
        
        this._results.set(allResults);
        this._totalResults.set(allResults.length);
        this._isLoading.set(false);
        
        return allResults;
      })
    );
  }

  /**
   * Busca en servicios
   */
  private searchServices(query: string, filters: SearchFilters): Observable<SearchResult[]> {
    const serviceFilters: ServiceFilters = {
      search: query,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      rating: filters.rating,
      duration: filters.duration,
      isPopular: filters.isPopular
    };

    this.spaServicesService.updateFilters(serviceFilters);
    
    return this.spaServicesService.filteredServices$.pipe(
      map(services => this.mapServicesToResults(services))
    );
  }

  /**
   * Busca en cabañas
   */
  private searchCabins(query: string, filters: SearchFilters): Observable<SearchResult[]> {
    const cabinFilters: CabinFilters = {
      search: query,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      rating: filters.rating,
      capacity: filters.capacity,
      isPopular: filters.isPopular,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut
    };

    this.cabinsService.updateFilters(cabinFilters);
    
    return this.cabinsService.filteredCabins$.pipe(
      map(cabins => this.mapCabinsToResults(cabins))
    );
  }

  /**
   * Mapea servicios a resultados de búsqueda
   */
  private mapServicesToResults(services: SpaService[]): SearchResult[] {
    return services.map(service => ({
      id: service.id,
      type: 'service' as const,
      title: service.name,
      description: service.shortDescription,
      price: service.price,
      discountPrice: service.discountPrice,
      rating: service.rating,
      reviewCount: service.reviewCount,
      image: service.images[0] || '/assets/images/default-service.jpg',
      category: service.category,
      duration: service.duration,
      isPopular: service.isPopular,
      isNew: service.isNew,
      tags: service.tags
    }));
  }

  /**
   * Mapea cabañas a resultados de búsqueda
   */
  private mapCabinsToResults(cabins: Cabin[]): SearchResult[] {
    return cabins.map(cabin => ({
      id: cabin.id,
      type: 'cabin' as const,
      title: cabin.name,
      description: cabin.shortDescription,
      price: cabin.pricePerNight,
      discountPrice: cabin.discountPrice,
      rating: cabin.rating,
      reviewCount: cabin.reviewCount,
      image: cabin.images[0] || '/assets/images/default-cabin.jpg',
      category: cabin.type,
      capacity: cabin.capacity,
      isPopular: cabin.isPopular,
      isNew: cabin.isNew,
      tags: cabin.tags
    }));
  }

  /**
   * Ordena los resultados
   */
  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    switch (sortBy) {
      case 'price-asc':
        return results.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return results.sort((a, b) => b.price - a.price);
      case 'rating':
        return results.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return results.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      case 'relevance':
      default:
        return results.sort((a, b) => {
          // Priorizar elementos populares y con mejor rating
          const aScore = (a.isPopular ? 2 : 0) + a.rating;
          const bScore = (b.isPopular ? 2 : 0) + b.rating;
          return bScore - aScore;
        });
    }
  }

  /**
   * Inicializa desde parámetros URL
   */
  private initializeFromUrl(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this._searchQuery.set(params['q']);
        this.searchSubject.next(params['q']);
      }
      
      if (params['category']) {
        this._category.set(params['category']);
      }
      
      // Otros parámetros de filtro
      const filters: Partial<SearchFilters> = {};
      if (params['priceMin']) filters.priceMin = Number(params['priceMin']);
      if (params['priceMax']) filters.priceMax = Number(params['priceMax']);
      if (params['rating']) filters.rating = Number(params['rating']);
      if (params['capacity']) filters.capacity = Number(params['capacity']);
      if (params['duration']) filters.duration = Number(params['duration']);
      if (params['popular']) filters.isPopular = params['popular'] === 'true';
      if (params['checkIn']) filters.checkIn = params['checkIn'];
      if (params['checkOut']) filters.checkOut = params['checkOut'];
      if (params['sort']) filters.sortBy = params['sort'];
      
      if (Object.keys(filters).length > 0) {
        this._filters.set(filters);
        this.filtersSubject.next({
          query: this._searchQuery(),
          category: this._category(),
          sortBy: 'relevance',
          ...filters
        });
      }
    });
  }

  /**
   * Actualiza la URL con parámetros de búsqueda
   */
  private updateUrl(params: any, clearAll = false): void {
    const queryParams: any = clearAll ? {} : { ...this.route.snapshot.queryParams };
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams[key] = params[key];
      } else {
        delete queryParams[key];
      }
    });
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Configura efectos reactivos
   */
  private setupSearchEffects(): void {
    // Effect para actualizar sugerencias cuando cambia la query
    effect(() => {
      const query = this._searchQuery();
      if (query && query.length >= 2) {
        this.getSuggestions(query);
      } else {
        this._suggestions.set([]);
      }
    });
  }

  /**
   * Agrega término al historial
   */
  private addToHistory(query: string): void {
    if (!query.trim()) return;
    
    const index = this.searchHistory.indexOf(query);
    if (index > -1) {
      this.searchHistory.splice(index, 1);
    }
    
    this.searchHistory.unshift(query);
    
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }
    
    this.saveSearchHistory();
  }

  /**
   * Carga historial desde localStorage
   */
  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem('spa-search-history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Error loading search history:', error);
      this.searchHistory = [];
    }
  }

  /**
   * Guarda historial en localStorage
   */
  private saveSearchHistory(): void {
    try {
      localStorage.setItem('spa-search-history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Error saving search history:', error);
    }
  }
}