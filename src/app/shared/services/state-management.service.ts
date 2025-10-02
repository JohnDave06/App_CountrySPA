import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferences: UserPreferences;
  favoriteServices: string[];
  reservationHistory: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  accessibility: {
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  favorites: Set<string>;
  cart: CartItem[];
  currentPage: string;
  searchHistory: string[];
}

export interface CartItem {
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  selectedDate?: Date;
  selectedTime?: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class StateManagementService {
  private readonly STORAGE_KEY = 'country-spa-state';
  
  // Private BehaviorSubjects for state management
  private userSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private favoritesSubject = new BehaviorSubject<Set<string>>(new Set());
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private currentPageSubject = new BehaviorSubject<string>('home');
  private searchHistorySubject = new BehaviorSubject<string[]>([]);

  // Public observables
  public readonly user$ = this.userSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly favorites$ = this.favoritesSubject.asObservable();
  public readonly cart$ = this.cartSubject.asObservable();
  public readonly currentPage$ = this.currentPageSubject.asObservable();
  public readonly searchHistory$ = this.searchHistorySubject.asObservable();

  // Computed observables
  public readonly isAuthenticated$ = this.user$.pipe(
    map(user => !!user),
    shareReplay(1)
  );

  public readonly cartTotal$ = this.cart$.pipe(
    map(items => items.reduce((total, item) => total + (item.price * item.quantity), 0)),
    shareReplay(1)
  );

  public readonly cartItemCount$ = this.cart$.pipe(
    map(items => items.reduce((count, item) => count + item.quantity, 0)),
    shareReplay(1)
  );

  public readonly appState$: Observable<AppState> = combineLatest([
    this.user$,
    this.isAuthenticated$,
    this.loading$,
    this.error$,
    this.favorites$,
    this.cart$,
    this.currentPage$,
    this.searchHistory$
  ]).pipe(
    map(([user, isAuthenticated, loading, error, favorites, cart, currentPage, searchHistory]) => ({
      user,
      isAuthenticated,
      loading,
      error,
      favorites,
      cart,
      currentPage,
      searchHistory
    })),
    shareReplay(1)
  );

  constructor() {
    this.loadState();
    
    // Auto-save state changes
    this.appState$.subscribe(state => {
      this.saveState(state);
    });
  }

  // User management
  setUser(user: User | null): void {
    this.userSubject.next(user);
    this.setError(null); // Clear any authentication errors
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    const currentUser = this.userSubject.value;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        preferences: { ...currentUser.preferences, ...preferences }
      };
      this.setUser(updatedUser);
    }
  }

  addToUserFavorites(serviceId: string): void {
    const currentUser = this.userSubject.value;
    if (currentUser && !currentUser.favoriteServices.includes(serviceId)) {
      const updatedUser = {
        ...currentUser,
        favoriteServices: [...currentUser.favoriteServices, serviceId]
      };
      this.setUser(updatedUser);
    }
  }

  removeFromUserFavorites(serviceId: string): void {
    const currentUser = this.userSubject.value;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        favoriteServices: currentUser.favoriteServices.filter(id => id !== serviceId)
      };
      this.setUser(updatedUser);
    }
  }

  // Loading state management
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // Error management
  setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  clearError(): void {
    this.setError(null);
  }

  // Favorites management (session-based)
  addToFavorites(serviceId: string): void {
    const currentFavorites = this.favoritesSubject.value;
    const newFavorites = new Set(currentFavorites);
    newFavorites.add(serviceId);
    this.favoritesSubject.next(newFavorites);
    
    // Also update user favorites if authenticated
    this.addToUserFavorites(serviceId);
  }

  removeFromFavorites(serviceId: string): void {
    const currentFavorites = this.favoritesSubject.value;
    const newFavorites = new Set(currentFavorites);
    newFavorites.delete(serviceId);
    this.favoritesSubject.next(newFavorites);
    
    // Also update user favorites if authenticated
    this.removeFromUserFavorites(serviceId);
  }

  toggleFavorite(serviceId: string): void {
    const currentFavorites = this.favoritesSubject.value;
    if (currentFavorites.has(serviceId)) {
      this.removeFromFavorites(serviceId);
    } else {
      this.addToFavorites(serviceId);
    }
  }

  isFavorite(serviceId: string): boolean {
    return this.favoritesSubject.value.has(serviceId);
  }

  // Cart management
  addToCart(item: CartItem): void {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.findIndex(
      cartItem => cartItem.serviceId === item.serviceId
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedCart = [...currentCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + item.quantity
      };
      this.cartSubject.next(updatedCart);
    } else {
      // Add new item
      this.cartSubject.next([...currentCart, item]);
    }
  }

  removeFromCart(serviceId: string): void {
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.filter(item => item.serviceId !== serviceId);
    this.cartSubject.next(updatedCart);
  }

  updateCartItemQuantity(serviceId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(serviceId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.map(item =>
      item.serviceId === serviceId ? { ...item, quantity } : item
    );
    this.cartSubject.next(updatedCart);
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }

  // Navigation tracking
  setCurrentPage(page: string): void {
    this.currentPageSubject.next(page);
  }

  // Search history management
  addToSearchHistory(term: string): void {
    if (!term.trim()) return;
    
    const currentHistory = this.searchHistorySubject.value;
    const newHistory = [term, ...currentHistory.filter(t => t !== term)].slice(0, 10);
    this.searchHistorySubject.next(newHistory);
  }

  clearSearchHistory(): void {
    this.searchHistorySubject.next([]);
  }

  // Utility methods
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getCurrentFavorites(): Set<string> {
    return this.favoritesSubject.value;
  }

  getCurrentCart(): CartItem[] {
    return this.cartSubject.value;
  }

  // State persistence
  private saveState(state: AppState): void {
    try {
      const stateToSave = {
        user: state.user,
        favorites: Array.from(state.favorites),
        cart: state.cart,
        searchHistory: state.searchHistory
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  private loadState(): void {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        if (parsedState.user) {
          this.setUser(parsedState.user);
        }
        
        if (parsedState.favorites) {
          this.favoritesSubject.next(new Set(parsedState.favorites));
        }
        
        if (parsedState.cart) {
          this.cartSubject.next(parsedState.cart);
        }
        
        if (parsedState.searchHistory) {
          this.searchHistorySubject.next(parsedState.searchHistory);
        }
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
  }

  // Reset entire state (for logout, etc.)
  resetState(): void {
    this.userSubject.next(null);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
    this.favoritesSubject.next(new Set());
    this.cartSubject.next([]);
    this.currentPageSubject.next('home');
    this.searchHistorySubject.next([]);
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}