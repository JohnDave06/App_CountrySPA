import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { SignalsStateService } from '../../services/signals-state.service';

@Component({
  selector: 'app-signals-demo',
  templateUrl: './signals-demo.component.html',
  styleUrls: ['./signals-demo.component.css']
})
export class SignalsDemoComponent implements OnInit {
  // Local signals for demonstration
  private _counterSignal = signal(0);
  private _messageSignal = signal('¡Hola desde Angular Signals!');
  private _visibleSignal = signal(true);

  // Computed signals
  readonly counter = this._counterSignal.asReadonly();
  readonly message = this._messageSignal.asReadonly();
  readonly visible = this._visibleSignal.asReadonly();

  readonly doubledCounter = computed(() => this.counter() * 2);
  readonly counterStatus = computed(() => {
    const count = this.counter();
    if (count === 0) return 'inicial';
    if (count < 5) return 'bajo';
    if (count < 10) return 'medio';
    return 'alto';
  });

  readonly dynamicMessage = computed(() => {
    const count = this.counter();
    const status = this.counterStatus();
    return `Contador: ${count} (${status}) - Doble: ${this.doubledCounter()}`;
  });

  // Service signals (reactive to global state)
  readonly serviceCount = computed(() => this.signalsService.serviceCount());
  readonly filteredCount = computed(() => this.signalsService.filteredServiceCount());
  readonly favoritesCount = computed(() => this.signalsService.favoritesCount());
  readonly loading = computed(() => this.signalsService.loading());
  readonly hasActiveFilters = computed(() => this.signalsService.hasActiveFilters());

  readonly searchStats = computed(() => this.signalsService.searchStatistics());

  constructor(public signalsService: SignalsStateService) {
    // Effect to react to counter changes
    effect(() => {
      const count = this.counter();
      if (count > 0 && count % 5 === 0) {
        console.log(`¡Milestone alcanzado! Contador: ${count}`);
      }
    });

    // Effect to sync with localStorage
    effect(() => {
      const count = this.counter();
      try {
        localStorage.setItem('signals-demo-counter', count.toString());
      } catch (error) {
        console.warn('Failed to save counter to localStorage:', error);
      }
    });
  }

  ngOnInit(): void {
    this.loadCounterFromStorage();
  }

  // Counter actions
  increment(): void {
    this._counterSignal.update(count => count + 1);
  }

  decrement(): void {
    this._counterSignal.update(count => Math.max(0, count - 1));
  }

  reset(): void {
    this._counterSignal.set(0);
  }

  addFive(): void {
    this._counterSignal.update(count => count + 5);
  }

  // Message actions
  updateMessage(newMessage: string): void {
    this._messageSignal.set(newMessage);
  }

  appendToMessage(text: string): void {
    this._messageSignal.update(current => `${current} ${text}`);
  }

  resetMessage(): void {
    this._messageSignal.set('¡Hola desde Angular Signals!');
  }

  // Visibility actions
  toggleVisibility(): void {
    this._visibleSignal.update(visible => !visible);
  }

  // Demo actions with service
  async loadDemoData(): Promise<void> {
    this.signalsService.setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock services data
    const mockServices = [
      {
        id: 'demo-1',
        name: 'Masaje Relajante Demo',
        description: 'Servicio de demostración con signals',
        price: 80000,
        duration: 60,
        category: 'masajes',
        icon: '💆‍♀️',
        rating: 4.8,
        reviews: 45,
        available: true
      },
      {
        id: 'demo-2',
        name: 'Facial Hidratante Demo',
        description: 'Otro servicio de prueba',
        price: 120000,
        duration: 90,
        category: 'faciales',
        icon: '✨',
        rating: 4.9,
        reviews: 32,
        available: true
      }
    ];

    this.signalsService.setServices(mockServices);
    this.signalsService.setLoading(false);
  }

  searchDemo(term: string): void {
    this.signalsService.setSearchTerm(term);
  }

  toggleFavoriteDemo(serviceId: string): void {
    this.signalsService.toggleFavorite(serviceId);
  }

  clearFiltersDemo(): void {
    this.signalsService.clearAllFilters();
  }

  // Utility methods
  private loadCounterFromStorage(): void {
    try {
      const saved = localStorage.getItem('signals-demo-counter');
      if (saved) {
        const count = parseInt(saved, 10);
        if (!isNaN(count)) {
          this._counterSignal.set(count);
        }
      }
    } catch (error) {
      console.warn('Failed to load counter from localStorage:', error);
    }
  }

  // Animation and UI helpers
  getCounterColorClass(): string {
    const status = this.counterStatus();
    switch (status) {
      case 'inicial': return 'text-gray-500';
      case 'bajo': return 'text-blue-500';
      case 'medio': return 'text-yellow-500';
      case 'alto': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  getProgressPercentage(): number {
    const count = this.counter();
    return Math.min((count / 20) * 100, 100); // Max progress at count 20
  }
}