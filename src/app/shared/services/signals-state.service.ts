import { Injectable, signal, computed, effect } from '@angular/core';
import { ServiceCardData } from '../components/service-card/service-card.component';

export interface SignalAppState {
  services: ServiceCardData[];
  filteredServices: ServiceCardData[];
  searchTerm: string;
  selectedCategory: string;
  loading: boolean;
  error: string | null;
  favorites: string[];
  sortBy: 'name' | 'price' | 'rating' | 'duration';
  sortOrder: 'asc' | 'desc';
  priceRange: { min: number; max: number };
}

@Injectable({
  providedIn: 'root'
})
export class SignalsStateService {
  // Signal-based state
  private _services = signal<ServiceCardData[]>([]);
  private _searchTerm = signal<string>('');
  private _selectedCategory = signal<string>('all');
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _favorites = signal<string[]>([]);
  private _sortBy = signal<'name' | 'price' | 'rating' | 'duration'>('name');
  private _sortOrder = signal<'asc' | 'desc'>('asc');
  private _priceRange = signal<{ min: number; max: number }>({ min: 0, max: 500000 });

  // Public readonly signals
  readonly services = this._services.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly favorites = this._favorites.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortOrder = this._sortOrder.asReadonly();
  readonly priceRange = this._priceRange.asReadonly();

  // Computed signals
  readonly categories = computed(() => {
    const services = this._services();
    return [...new Set(services.map(s => s.category))];
  });

  readonly filteredServices = computed(() => {
    let filtered = this._services();
    const searchTerm = this._searchTerm().toLowerCase();
    const selectedCategory = this._selectedCategory();
    const priceRange = this._priceRange();
    const sortBy = this._sortBy();
    const sortOrder = this._sortOrder();

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Apply price range filter
    filtered = filtered.filter(service =>
      service.price >= priceRange.min && service.price <= priceRange.max
    );

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  });

  readonly favoritesCount = computed(() => this._favorites().length);
  
  readonly favoriteServices = computed(() => {
    const favoriteIds = this._favorites();
    const services = this._services();
    return services.filter(service => favoriteIds.includes(service.id));
  });

  readonly serviceCount = computed(() => this._services().length);
  
  readonly filteredServiceCount = computed(() => this.filteredServices().length);

  readonly hasActiveFilters = computed(() => {
    return this._searchTerm() !== '' ||
           this._selectedCategory() !== 'all' ||
           this._priceRange().min !== 0 ||
           this._priceRange().max !== 500000 ||
           this._sortBy() !== 'name' ||
           this._sortOrder() !== 'asc';
  });

  readonly searchStatistics = computed(() => {
    const total = this._services().length;
    const filtered = this.filteredServices().length;
    const searchTerm = this._searchTerm();
    
    return {
      total,
      filtered,
      searchTerm,
      hasResults: filtered > 0,
      resultPercentage: total > 0 ? Math.round((filtered / total) * 100) : 0
    };
  });

  constructor() {
    // Effect to log state changes (for debugging)
    effect(() => {
      const state = {
        serviceCount: this.serviceCount(),
        filteredCount: this.filteredServiceCount(),
        searchTerm: this.searchTerm(),
        category: this.selectedCategory(),
        favorites: this.favoritesCount(),
        loading: this.loading()
      };
      console.log('Signals State Update:', state);
    });

    // Effect to persist favorites to localStorage
    effect(() => {
      const favorites = this._favorites();
      try {
        localStorage.setItem('spa-favorites', JSON.stringify(favorites));
      } catch (error) {
        console.warn('Failed to save favorites to localStorage:', error);
      }
    });

    // Load favorites from localStorage on init
    this.loadFavoritesFromStorage();
  }

  // State mutation methods
  setServices(services: ServiceCardData[]): void {
    this._services.set(services);
    
    // Auto-calculate price range based on services
    if (services.length > 0) {
      const prices = services.map(s => s.price);
      const newPriceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
      this._priceRange.set(newPriceRange);
    }
  }

  addService(service: ServiceCardData): void {
    this._services.update(services => [...services, service]);
  }

  updateService(updatedService: ServiceCardData): void {
    this._services.update(services =>
      services.map(service =>
        service.id === updatedService.id ? updatedService : service
      )
    );
  }

  removeService(serviceId: string): void {
    this._services.update(services =>
      services.filter(service => service.id !== serviceId)
    );
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }

  setSelectedCategory(category: string): void {
    this._selectedCategory.set(category);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  setSortBy(sortBy: 'name' | 'price' | 'rating' | 'duration'): void {
    this._sortBy.set(sortBy);
  }

  setSortOrder(order: 'asc' | 'desc'): void {
    this._sortOrder.set(order);
  }

  toggleSortOrder(): void {
    this._sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
  }

  setPriceRange(range: { min: number; max: number }): void {
    this._priceRange.set(range);
  }

  // Favorites management
  addToFavorites(serviceId: string): void {
    this._favorites.update(favorites => 
      favorites.includes(serviceId) ? favorites : [...favorites, serviceId]
    );
  }

  removeFromFavorites(serviceId: string): void {
    this._favorites.update(favorites =>
      favorites.filter(id => id !== serviceId)
    );
  }

  toggleFavorite(serviceId: string): void {
    this._favorites.update(favorites =>
      favorites.includes(serviceId)
        ? favorites.filter(id => id !== serviceId)
        : [...favorites, serviceId]
    );
  }

  isFavorite(serviceId: string): boolean {
    return this._favorites().includes(serviceId);
  }

  clearFavorites(): void {
    this._favorites.set([]);
  }

  // Filter management
  clearAllFilters(): void {
    this._searchTerm.set('');
    this._selectedCategory.set('all');
    this._sortBy.set('name');
    this._sortOrder.set('asc');
    
    // Reset price range to original values
    const services = this._services();
    if (services.length > 0) {
      const prices = services.map(s => s.price);
      this._priceRange.set({
        min: Math.min(...prices),
        max: Math.max(...prices)
      });
    } else {
      this._priceRange.set({ min: 0, max: 500000 });
    }
  }

  // Utility methods
  getServiceById(serviceId: string): ServiceCardData | undefined {
    return this._services().find(service => service.id === serviceId);
  }

  searchServices(term: string): ServiceCardData[] {
    const searchTerm = term.toLowerCase();
    return this._services().filter(service =>
      service.name.toLowerCase().includes(searchTerm) ||
      service.description.toLowerCase().includes(searchTerm) ||
      service.category.toLowerCase().includes(searchTerm)
    );
  }

  getServicesByCategory(category: string): ServiceCardData[] {
    return this._services().filter(service => service.category === category);
  }

  // Statistics and analytics
  getCategoryStats() {
    const services = this._services();
    const categoryMap = new Map<string, number>();
    
    services.forEach(service => {
      const count = categoryMap.get(service.category) || 0;
      categoryMap.set(service.category, count + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / services.length) * 100)
    }));
  }

  getPriceStats() {
    const services = this._services();
    if (services.length === 0) return null;
    
    const prices = services.map(s => s.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
      median: this.calculateMedian(prices)
    };
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
    }
    
    return sorted[middle];
  }

  private loadFavoritesFromStorage(): void {
    try {
      const saved = localStorage.getItem('spa-favorites');
      if (saved) {
        const favorites = JSON.parse(saved);
        this._favorites.set(Array.isArray(favorites) ? favorites : []);
      }
    } catch (error) {
      console.warn('Failed to load favorites from localStorage:', error);
    }
  }

  // Reset all state
  resetState(): void {
    this._services.set([]);
    this._searchTerm.set('');
    this._selectedCategory.set('all');
    this._loading.set(false);
    this._error.set(null);
    this._favorites.set([]);
    this._sortBy.set('name');
    this._sortOrder.set('asc');
    this._priceRange.set({ min: 0, max: 500000 });
  }
}