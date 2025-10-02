import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, Observable, combineLatest, merge, interval, of, timer } from 'rxjs';
import { 
  takeUntil, 
  map, 
  switchMap, 
  debounceTime, 
  distinctUntilChanged, 
  startWith,
  mergeMap,
  concatMap,
  exhaustMap,
  tap,
  catchError,
  finalize,
  throttleTime,
  scan,
  buffer,
  bufferTime,
  take,
  filter,
  shareReplay,
  withLatestFrom,
  combineLatestWith
} from 'rxjs/operators';
import { AdvancedSearchService, SearchResult, SearchState } from '../../../core/services/advanced-search.service';

interface OperatorDemo {
  name: string;
  description: string;
  example: string;
  result: any;
  isRunning: boolean;
}

@Component({
  selector: 'app-rxjs-demo',
  templateUrl: './rxjs-demo.component.html',
  styleUrls: ['./rxjs-demo.component.css']
})
export class RxjsDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Search controls
  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  priceMinControl = new FormControl(0);
  priceMaxControl = new FormControl(10000);
  ratingControl = new FormControl(0);
  availabilityControl = new FormControl(true);
  
  // Demo state
  operatorDemos: OperatorDemo[] = [];
  searchState$: Observable<SearchState>;
  
  // Live demonstrations
  debounceDemo$ = new Subject<string>();
  throttleDemo$ = new Subject<string>();
  distinctDemo$ = new Subject<string>();
  switchMapDemo$ = new Subject<string>();
  mergeMapDemo$ = new Subject<string>();
  concatMapDemo$ = new Subject<string>();
  exhaustMapDemo$ = new Subject<string>();
  
  // Results for live demos
  debounceResults: string[] = [];
  throttleResults: string[] = [];
  distinctResults: string[] = [];
  switchMapResults: any[] = [];
  mergeMapResults: any[] = [];
  concatMapResults: any[] = [];
  exhaustMapResults: any[] = [];
  
  // Buffer demo
  bufferDemo$ = new Subject<number>();
  bufferResults: number[][] = [];
  bufferTimeResults: number[][] = [];
  
  // Scan demo
  scanResults: number[] = [];
  
  // CombineLatest demo
  combineLatestResults: any[] = [];

  constructor(private searchService: AdvancedSearchService) {
    this.searchState$ = this.searchService.searchState$;
    this.initializeOperatorDemos();
  }

  ngOnInit(): void {
    this.setupFormControlBindings();
    this.setupLiveDemonstrations();
    this.initializeOperatorDemos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormControlBindings(): void {
    // Bind form controls to search service with advanced RxJS operators
    
    // Search term with debounce and distinct
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchService.updateSearchTerm(term || '');
    });
    
    // Category changes
    this.categoryControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(category => {
      this.searchService.updateCategory(category || '');
    });
    
    // Price range with combineLatest
    combineLatest([
      this.priceMinControl.valueChanges.pipe(startWith(0)),
      this.priceMaxControl.valueChanges.pipe(startWith(10000))
    ]).pipe(
      debounceTime(200),
      distinctUntilChanged(([prevMin, prevMax], [currMin, currMax]) => 
        prevMin === currMin && prevMax === currMax
      ),
      takeUntil(this.destroy$)
    ).subscribe(([min, max]) => {
      this.searchService.updatePriceRange(min || 0, max || 10000);
    });
    
    // Rating changes
    this.ratingControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(rating => {
      this.searchService.updateRating(rating || 0);
    });
    
    // Availability changes
    this.availabilityControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(availability => {
      this.searchService.updateAvailability(availability !== false);
    });
  }

  private setupLiveDemonstrations(): void {
    // Debounce demonstration
    this.debounceDemo$.pipe(
      tap(value => console.log(`Debounce input: ${value}`)),
      debounceTime(500),
      tap(value => console.log(`Debounce output: ${value}`)),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.debounceResults.unshift(result);
      if (this.debounceResults.length > 10) {
        this.debounceResults = this.debounceResults.slice(0, 10);
      }
    });

    // Throttle demonstration
    this.throttleDemo$.pipe(
      tap(value => console.log(`Throttle input: ${value}`)),
      throttleTime(1000),
      tap(value => console.log(`Throttle output: ${value}`)),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.throttleResults.unshift(result);
      if (this.throttleResults.length > 10) {
        this.throttleResults = this.throttleResults.slice(0, 10);
      }
    });

    // Distinct demonstration
    this.distinctDemo$.pipe(
      tap(value => console.log(`Distinct input: ${value}`)),
      distinctUntilChanged(),
      tap(value => console.log(`Distinct output: ${value}`)),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.distinctResults.unshift(result);
      if (this.distinctResults.length > 10) {
        this.distinctResults = this.distinctResults.slice(0, 10);
      }
    });

    // SwitchMap demonstration
    this.switchMapDemo$.pipe(
      tap(value => console.log(`SwitchMap input: ${value}`)),
      switchMap(value => 
        timer(Math.random() * 2000).pipe(
          map(() => ({ input: value, timestamp: Date.now() })),
          tap(result => console.log(`SwitchMap output:`, result))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.switchMapResults.unshift(result);
      if (this.switchMapResults.length > 5) {
        this.switchMapResults = this.switchMapResults.slice(0, 5);
      }
    });

    // MergeMap demonstration
    this.mergeMapDemo$.pipe(
      tap(value => console.log(`MergeMap input: ${value}`)),
      mergeMap(value => 
        timer(Math.random() * 2000).pipe(
          map(() => ({ input: value, timestamp: Date.now() })),
          tap(result => console.log(`MergeMap output:`, result))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.mergeMapResults.unshift(result);
      if (this.mergeMapResults.length > 5) {
        this.mergeMapResults = this.mergeMapResults.slice(0, 5);
      }
    });

    // ConcatMap demonstration
    this.concatMapDemo$.pipe(
      tap(value => console.log(`ConcatMap input: ${value}`)),
      concatMap(value => 
        timer(1000).pipe(
          map(() => ({ input: value, timestamp: Date.now() })),
          tap(result => console.log(`ConcatMap output:`, result))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.concatMapResults.unshift(result);
      if (this.concatMapResults.length > 5) {
        this.concatMapResults = this.concatMapResults.slice(0, 5);
      }
    });

    // ExhaustMap demonstration
    this.exhaustMapDemo$.pipe(
      tap(value => console.log(`ExhaustMap input: ${value}`)),
      exhaustMap(value => 
        timer(2000).pipe(
          map(() => ({ input: value, timestamp: Date.now() })),
          tap(result => console.log(`ExhaustMap output:`, result))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.exhaustMapResults.unshift(result);
      if (this.exhaustMapResults.length > 5) {
        this.exhaustMapResults = this.exhaustMapResults.slice(0, 5);
      }
    });

    // Buffer demonstration
    this.bufferDemo$.pipe(
      buffer(interval(2000)), // Buffer emissions for 2 seconds
      takeUntil(this.destroy$)
    ).subscribe(buffered => {
      if (buffered.length > 0) {
        this.bufferResults.unshift(buffered);
        if (this.bufferResults.length > 5) {
          this.bufferResults = this.bufferResults.slice(0, 5);
        }
      }
    });

    // BufferTime demonstration
    this.bufferDemo$.pipe(
      bufferTime(1500), // Buffer for 1.5 seconds
      filter(buffered => buffered.length > 0),
      takeUntil(this.destroy$)
    ).subscribe(buffered => {
      this.bufferTimeResults.unshift(buffered);
      if (this.bufferTimeResults.length > 5) {
        this.bufferTimeResults = this.bufferTimeResults.slice(0, 5);
      }
    });

    // Scan demonstration
    interval(1000).pipe(
      take(10),
      scan((acc, curr) => acc + curr, 0),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.scanResults.push(result);
    });

    // CombineLatest demonstration
    const source1$ = interval(1000).pipe(map(x => `A${x}`), take(5));
    const source2$ = interval(1500).pipe(map(x => `B${x}`), take(5));
    const source3$ = interval(2000).pipe(map(x => `C${x}`), take(3));

    combineLatest([source1$, source2$, source3$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([a, b, c]) => {
      this.combineLatestResults.push({ a, b, c, timestamp: Date.now() });
    });
  }

  private initializeOperatorDemos(): void {
    this.operatorDemos = [
      {
        name: 'debounceTime',
        description: 'Emite el último valor después de un período de silencio',
        example: 'searchTerm$.pipe(debounceTime(300))',
        result: 'Usado en búsqueda para evitar requests excesivos',
        isRunning: false
      },
      {
        name: 'distinctUntilChanged',
        description: 'Solo emite cuando el valor cambia',
        example: 'category$.pipe(distinctUntilChanged())',
        result: 'Evita procesar el mismo filtro múltiples veces',
        isRunning: false
      },
      {
        name: 'switchMap',
        description: 'Cambia a una nueva observable, cancelando la anterior',
        example: 'searchTerm$.pipe(switchMap(term => searchAPI(term)))',
        result: 'Cancela búsquedas anteriores cuando cambia el término',
        isRunning: false
      },
      {
        name: 'combineLatest',
        description: 'Combina los últimos valores de múltiples observables',
        example: 'combineLatest([term$, category$, price$])',
        result: 'Combina todos los filtros para búsqueda avanzada',
        isRunning: false
      },
      {
        name: 'mergeMap',
        description: 'Proyecta cada valor a observable y aplana el resultado',
        example: 'terms$.pipe(mergeMap(term => getSuggestions(term)))',
        result: 'Procesa sugerencias en paralelo',
        isRunning: false
      },
      {
        name: 'throttleTime',
        description: 'Emite valor y ignora los siguientes por un tiempo',
        example: 'clicks$.pipe(throttleTime(1000))',
        result: 'Limita la frecuencia de actualizaciones',
        isRunning: false
      },
      {
        name: 'scan',
        description: 'Acumula valores a lo largo del tiempo',
        example: 'numbers$.pipe(scan((acc, curr) => acc + curr, 0))',
        result: 'Mantiene total acumulado',
        isRunning: false
      },
      {
        name: 'shareReplay',
        description: 'Comparte la suscripción y reproduce últimos valores',
        example: 'searchResults$.pipe(shareReplay(1))',
        result: 'Optimiza suscripciones múltiples',
        isRunning: false
      }
    ];
  }

  // Demo trigger methods
  triggerDebounceDemo(value: string): void {
    this.debounceDemo$.next(`${value}-${Date.now()}`);
  }

  triggerThrottleDemo(value: string): void {
    this.throttleDemo$.next(`${value}-${Date.now()}`);
  }

  triggerDistinctDemo(value: string): void {
    this.distinctDemo$.next(value);
  }

  triggerSwitchMapDemo(value: string): void {
    this.switchMapDemo$.next(`${value}-${Date.now()}`);
  }

  triggerMergeMapDemo(value: string): void {
    this.mergeMapDemo$.next(`${value}-${Date.now()}`);
  }

  triggerConcatMapDemo(value: string): void {
    this.concatMapDemo$.next(`${value}-${Date.now()}`);
  }

  triggerExhaustMapDemo(value: string): void {
    this.exhaustMapDemo$.next(`${value}-${Date.now()}`);
  }

  triggerBufferDemo(): void {
    this.bufferDemo$.next(Math.floor(Math.random() * 100));
  }

  // Search service method demonstrations
  demonstrateConcatMapSearch(): void {
    const terms = ['massage', 'facial', 'manicura'];
    this.searchService.searchWithConcatMap(terms).pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      console.log('ConcatMap search result:', result);
    });
  }

  demonstrateMergeMapSearch(): void {
    const terms = ['spa', 'therapy', 'beauty'];
    this.searchService.searchWithMergeMap(terms).pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      console.log('MergeMap search result:', result);
    });
  }

  demonstrateExhaustMapSearch(): void {
    this.searchService.searchWithExhaustMap('relaxation').pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      console.log('ExhaustMap search result:', result);
    });
  }

  // Utility methods
  clearResults(): void {
    this.debounceResults = [];
    this.throttleResults = [];
    this.distinctResults = [];
    this.switchMapResults = [];
    this.mergeMapResults = [];
    this.concatMapResults = [];
    this.exhaustMapResults = [];
    this.bufferResults = [];
    this.bufferTimeResults = [];
    this.scanResults = [];
    this.combineLatestResults = [];
  }

  resetSearch(): void {
    this.searchService.resetFilters();
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.priceMinControl.setValue(0);
    this.priceMaxControl.setValue(10000);
    this.ratingControl.setValue(0);
    this.availabilityControl.setValue(true);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  trackByIndex(index: number): number {
    return index;
  }
}