import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { QueryParamsService, QueryParams } from '../../../core/services/query-params.service';
import { NotificationService } from '../../services/notification.service';

interface UrlTestConfig {
  name: string;
  description: string;
  params: Partial<QueryParams>;
  expectedUrl: string;
}

@Component({
  selector: 'app-query-params-demo',
  templateUrl: './query-params-demo.component.html',
  styleUrls: ['./query-params-demo.component.css']
})
export class QueryParamsDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current state
  currentParams: QueryParams = {};
  currentUrl = '';
  shareableUrl = '';
  filterSummary: string[] = [];
  hasFilters = false;

  // Demo data
  categories = [
    'Masajes',
    'Tratamientos Faciales',
    'Terapias Corporales',
    'Relajación',
    'Aromaterapia',
    'Reflexología'
  ];

  tags = [
    'Relajante',
    'Antiedad',
    'Hidratante',
    'Desintoxicante',
    'Energizante',
    'Terapéutico'
  ];

  // Test configurations
  urlTestConfigs: UrlTestConfig[] = [
    {
      name: 'Búsqueda Básica',
      description: 'Búsqueda simple con término',
      params: { search: 'masaje relajante' },
      expectedUrl: '?search=masaje%20relajante'
    },
    {
      name: 'Filtro de Categoría',
      description: 'Filtrado por categoría específica',
      params: { category: 'Masajes', page: 1 },
      expectedUrl: '?category=Masajes&page=1'
    },
    {
      name: 'Rango de Precios',
      description: 'Filtrado por rango de precios',
      params: { priceMin: 50, priceMax: 200 },
      expectedUrl: '?priceMin=50&priceMax=200'
    },
    {
      name: 'Paginación',
      description: 'Navegación de páginas',
      params: { page: 3, limit: 8 },
      expectedUrl: '?page=3&limit=8'
    },
    {
      name: 'Ordenamiento',
      description: 'Ordenamiento por precio descendente',
      params: { sortBy: 'price', sortOrder: 'desc' },
      expectedUrl: '?sortBy=price&sortOrder=desc'
    },
    {
      name: 'Múltiples Etiquetas',
      description: 'Filtrado por múltiples etiquetas',
      params: { tags: ['Relajante', 'Terapéutico'] },
      expectedUrl: '?tags=Relajante%2CTerapéutico'
    },
    {
      name: 'Estado Complejo',
      description: 'Combinación de múltiples filtros',
      params: {
        search: 'facial',
        category: 'Tratamientos Faciales',
        priceMin: 100,
        priceMax: 300,
        availability: true,
        rating: 4,
        tags: ['Antiedad', 'Hidratante'],
        page: 2,
        sortBy: 'rating',
        sortOrder: 'desc'
      },
      expectedUrl: '?search=facial&category=Tratamientos%20Faciales&priceMin=100&priceMax=300&availability=true&rating=4&tags=Antiedad%2CHidratante&page=2&sortBy=rating&sortOrder=desc'
    }
  ];

  // Form values
  searchTerm = '';
  selectedCategory = '';
  priceMin = 0;
  priceMax = 1000;
  currentPage = 1;
  pageLimit = 12;
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  selectedTags: string[] = [];
  availabilityFilter?: boolean;
  ratingFilter?: number;

  // Test results
  testResults: { [key: string]: { success: boolean; actualUrl: string; error?: string } } = {};

  // Statistics
  urlHistory: { timestamp: Date; url: string; action: string }[] = [];
  updateCount = 0;

  constructor(
    private queryParamsService: QueryParamsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadInitialState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to parameter changes
    this.queryParamsService.params$
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.currentParams = params;
        this.updateFormValues(params);
        this.updateDisplayInfo();
        this.addToHistory('Parameter Update');
      });

    // Subscribe to filter state for optimized updates
    this.queryParamsService.filterState$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(state => {
        this.hasFilters = this.queryParamsService.hasFilters();
        this.filterSummary = this.queryParamsService.getFilterSummary();
      });

    // Monitor specific parameter changes
    this.queryParamsService.search$
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (search !== this.searchTerm) {
          this.searchTerm = search;
        }
      });

    this.queryParamsService.category$
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => {
        if (category !== this.selectedCategory) {
          this.selectedCategory = category;
        }
      });

    this.queryParamsService.priceRange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(range => {
        if (range.min !== this.priceMin || range.max !== this.priceMax) {
          this.priceMin = range.min;
          this.priceMax = range.max;
        }
      });

    this.queryParamsService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        if (pagination.page !== this.currentPage || pagination.limit !== this.pageLimit) {
          this.currentPage = pagination.page;
          this.pageLimit = pagination.limit;
        }
      });

    this.queryParamsService.sorting$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sorting => {
        if (sorting.sortBy !== this.sortBy || sorting.sortOrder !== this.sortOrder) {
          this.sortBy = sorting.sortBy;
          this.sortOrder = sorting.sortOrder;
        }
      });
  }

  private loadInitialState(): void {
    const params = this.queryParamsService.getCurrentParams();
    this.updateFormValues(params);
    this.updateDisplayInfo();
  }

  private updateFormValues(params: QueryParams): void {
    this.searchTerm = params.search || '';
    this.selectedCategory = params.category || '';
    this.priceMin = params.priceMin || 0;
    this.priceMax = params.priceMax || 1000;
    this.currentPage = params.page || 1;
    this.pageLimit = params.limit || 12;
    this.sortBy = params.sortBy || 'name';
    this.sortOrder = params.sortOrder || 'asc';
    this.selectedTags = params.tags || [];
    this.availabilityFilter = params.availability;
    this.ratingFilter = params.rating;
  }

  private updateDisplayInfo(): void {
    this.currentUrl = window.location.search;
    this.shareableUrl = this.queryParamsService.getShareableUrl();
    this.updateCount++;
  }

  private addToHistory(action: string): void {
    this.urlHistory.unshift({
      timestamp: new Date(),
      url: window.location.search || '(no parameters)',
      action
    });

    // Keep only last 20 entries
    if (this.urlHistory.length > 20) {
      this.urlHistory = this.urlHistory.slice(0, 20);
    }
  }

  // Event handlers
  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.queryParamsService.setSearch(value, { debounce: 300 });
  }

  onCategoryChange(value: string): void {
    this.selectedCategory = value;
    this.queryParamsService.setCategory(value);
  }

  onPriceRangeChange(): void {
    this.queryParamsService.setPriceRange(this.priceMin, this.priceMax);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.queryParamsService.setPagination(page, this.pageLimit);
  }

  onLimitChange(limit: number): void {
    this.pageLimit = limit;
    this.queryParamsService.setPagination(1, limit); // Reset to first page
  }

  onSortChange(): void {
    this.queryParamsService.setSorting(this.sortBy, this.sortOrder);
  }

  onTagToggle(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.queryParamsService.removeTag(tag);
    } else {
      this.queryParamsService.addTag(tag);
    }
  }

  onAvailabilityChange(value: string): void {
    const availability = value === 'true' ? true : value === 'false' ? false : undefined;
    this.availabilityFilter = availability;
    this.queryParamsService.setAvailability(availability);
  }

  onRatingChange(rating: number | undefined): void {
    this.ratingFilter = rating;
    this.queryParamsService.setRating(rating);
  }

  // Action methods
  clearAllFilters(): void {
    this.queryParamsService.clearFilters()
      .then(() => {
        this.notificationService.successToast('Éxito', 'Filtros limpiados');
        this.addToHistory('Clear Filters');
      })
      .catch(error => {
        this.notificationService.errorToast('Error', 'Error al limpiar filtros');
        console.error('Failed to clear filters:', error);
      });
  }

  resetToDefaults(): void {
    this.queryParamsService.reset()
      .then(() => {
        this.notificationService.successToast('Éxito', 'Parámetros restablecidos');
        this.addToHistory('Reset to Defaults');
      })
      .catch(error => {
        this.notificationService.errorToast('Error', 'Error al restablecer parámetros');
        console.error('Failed to reset parameters:', error);
      });
  }

  copyShareableUrl(): void {
    const url = this.shareableUrl;
    navigator.clipboard.writeText(url)
      .then(() => {
        this.notificationService.successToast('Éxito', 'URL copiada al portapapeles');
        this.addToHistory('Copy URL');
      })
      .catch(error => {
        this.notificationService.errorToast('Error', 'Error al copiar URL');
        console.error('Failed to copy URL:', error);
      });
  }

  // Test methods
  runUrlTest(config: UrlTestConfig): void {
    this.queryParamsService.updateParams({ params: config.params })
      .then(() => {
        const actualUrl = window.location.search;
        const success = actualUrl.includes(config.expectedUrl.substring(1)); // Remove ? from expected
        
        this.testResults[config.name] = {
          success,
          actualUrl,
          error: success ? undefined : `Expected pattern not found in URL`
        };

        if (success) {
          this.notificationService.successToast('Test Pasado', `Test "${config.name}" passed`);
        } else {
          this.notificationService.errorToast('Test Fallido', `Test "${config.name}" failed`);
        }

        this.addToHistory(`Test: ${config.name}`);
      })
      .catch(error => {
        this.testResults[config.name] = {
          success: false,
          actualUrl: window.location.search,
          error: error.message
        };
        this.notificationService.errorToast('Test Error', `Test "${config.name}" error: ${error.message}`);
      });
  }

  runAllTests(): void {
    this.notificationService.infoToast('Información', 'Ejecutando todas las pruebas...');
    
    // Clear previous results
    this.testResults = {};
    
    // Run tests sequentially with delay
    this.urlTestConfigs.forEach((config, index) => {
      setTimeout(() => {
        this.runUrlTest(config);
        
        // Show summary after last test
        if (index === this.urlTestConfigs.length - 1) {
          setTimeout(() => this.showTestSummary(), 500);
        }
      }, index * 1000);
    });
  }

  private showTestSummary(): void {
    const totalTests = this.urlTestConfigs.length;
    const passedTests = Object.values(this.testResults).filter(result => result.success).length;
    const failedTests = totalTests - passedTests;

    if (failedTests === 0) {
      this.notificationService.successToast('Éxito', `Todas las pruebas pasaron (${passedTests}/${totalTests})`);
    } else {
      this.notificationService.warningToast('Advertencia', `${passedTests} pruebas pasaron, ${failedTests} fallaron`);
    }

    this.addToHistory(`Test Summary: ${passedTests}/${totalTests} passed`);
  }

  // Utility methods
  getParamValue(key: string): any {
    return this.currentParams[key as keyof QueryParams];
  }

  formatDate(date: Date): string {
    return date.toLocaleTimeString();
  }

  trackByTestName(index: number, config: UrlTestConfig): string {
    return config.name;
  }

  trackByHistoryIndex(index: number, item: any): number {
    return index;
  }

  getCurrentParamsAsString(): string {
    return JSON.stringify(this.currentParams, null, 2);
  }

  getParamType(param: string): string {
    const value = this.getParamValue(param);
    return typeof value;
  }
}