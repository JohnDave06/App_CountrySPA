import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, map, startWith, combineLatestWith } from 'rxjs/operators';
import { AdvancedSearchService } from '../../../core/services/advanced-search.service';

export interface FilterData {
  searchTerm: string;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: 'name' | 'price' | 'rating' | 'duration';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-service-filter',
  templateUrl: './service-filter.component.html',
  styleUrls: ['./service-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceFilterComponent implements OnInit, OnDestroy {
  @Input() categories: string[] = [];
  @Input() priceRange: { min: number; max: number } = { min: 0, max: 500000 };
  @Input() debounceTime: number = 300;
  @Input() showAdvancedFilters: boolean = true;
  @Input() useAdvancedRxJS: boolean = false; // Toggle for advanced RxJS features

  @Output() filterChange = new EventEmitter<FilterData>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() categoryChange = new EventEmitter<string>();
  @Output() priceRangeChange = new EventEmitter<{ min: number; max: number }>();

  searchControl = new FormControl('');
  selectedCategory = 'all';
  currentPriceRange = { min: 0, max: 500000 };
  sortBy: FilterData['sortBy'] = 'name';
  sortOrder: FilterData['sortOrder'] = 'asc';
  showFilters = false;

  // Advanced RxJS features
  suggestions$: Observable<string[]>;
  searchHistory$: Observable<string[]>;
  
  private destroy$ = new Subject<void>();

  constructor(private advancedSearchService: AdvancedSearchService) {
    this.suggestions$ = this.advancedSearchService.suggestions$;
    this.searchHistory$ = this.advancedSearchService.searchHistory$;
  }

  ngOnInit(): void {
    this.currentPriceRange = { ...this.priceRange };
    
    if (this.useAdvancedRxJS) {
      this.setupAdvancedRxJSFeatures();
    } else {
      this.setupBasicSearch();
    }
  }

  private setupBasicSearch(): void {
    // Setup debounced search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        const term = searchTerm || '';
        this.searchTermChange.emit(term);
        this.emitFilterChange();
      });
  }

  private setupAdvancedRxJSFeatures(): void {
    // Advanced search with switchMap, debounceTime, distinctUntilChanged
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        // Use switchMap to cancel previous search suggestions
        switchMap(term => {
          if (this.useAdvancedRxJS && term && term.length >= 2) {
            // Trigger suggestion update in advanced search service
            this.advancedSearchService.updateSearchTerm(term);
          }
          return [term || ''];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.searchTermChange.emit(searchTerm);
        this.emitFilterChange();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.categoryChange.emit(category);
    this.emitFilterChange();
  }

  onPriceRangeChange(): void {
    this.priceRangeChange.emit({ ...this.currentPriceRange });
    this.emitFilterChange();
  }

  onSortChange(): void {
    this.emitFilterChange();
  }

  onSortOrderToggle(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.emitFilterChange();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedCategory = 'all';
    this.currentPriceRange = { ...this.priceRange };
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.emitFilterChange();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  private emitFilterChange(): void {
    const filterData: FilterData = {
      searchTerm: this.searchControl.value || '',
      category: this.selectedCategory,
      priceRange: { ...this.currentPriceRange },
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
    
    this.filterChange.emit(filterData);
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchControl.value) ||
           this.selectedCategory !== 'all' ||
           this.currentPriceRange.min !== this.priceRange.min ||
           this.currentPriceRange.max !== this.priceRange.max ||
           this.sortBy !== 'name' ||
           this.sortOrder !== 'asc';
  }

  get priceRangeFormatted(): { min: string; max: string } {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
    
    return {
      min: formatter.format(this.currentPriceRange.min),
      max: formatter.format(this.currentPriceRange.max)
    };
  }
}