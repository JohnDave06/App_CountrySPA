import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, combineLatest } from 'rxjs';
import { map, catchError, tap, retry, shareReplay, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';

export interface SpaService {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: 'masajes' | 'faciales' | 'corporales' | 'relajacion' | 'deportivos' | 'especiales';
  duration: number; // minutos
  price: number;
  discountPrice?: number;
  images: string[];
  benefits: string[];
  includes: string[];
  requirements?: string[];
  contraindications?: string[];
  therapistRequired: boolean;
  maxGuests: number;
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isNew: boolean;
  isActive: boolean;
  availableSchedule: {
    days: string[]; // ['monday', 'tuesday', ...]
    startTime: string;
    endTime: string;
    breaks?: { start: string; end: string }[];
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  serviceCount: number;
  isActive: boolean;
}

export interface ServiceFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  duration?: number;
  isPopular?: boolean;
  isNew?: boolean;
  search?: string;
  tags?: string[];
  rating?: number;
}

export interface ServiceReview {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  date: string;
  verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SpaServicesService {
  private readonly apiUrl = 'https://api.countryspa.com/spa-services';
  private readonly categoriesUrl = 'https://api.countryspa.com/service-categories';
  private readonly reviewsUrl = 'https://api.countryspa.com/reviews';

  private servicesSubject = new BehaviorSubject<SpaService[]>([]);
  public services$ = this.servicesSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<ServiceCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private searchSubject = new BehaviorSubject<string>('');
  public search$ = this.searchSubject.asObservable();

  private filtersSubject = new BehaviorSubject<ServiceFilters>({});
  public filters$ = this.filtersSubject.asObservable();

  // Cache para mejorar rendimiento
  private servicesCache = new Map<string, { data: SpaService[]; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutos

  constructor(private http: HttpClient) {
    this.initializeData();
    this.setupFilteredServices();
  }

  /**
   * Servicios filtrados reactivamente
   */
  public filteredServices$ = combineLatest([
    this.services$,
    this.search$.pipe(debounceTime(300), distinctUntilChanged()),
    this.filters$
  ]).pipe(
    map(([services, searchTerm, filters]) => this.filterServices(services, searchTerm, filters)),
    shareReplay(1)
  );

  /**
   * Obtiene todos los servicios del spa
   */
  getServices(useCache = true): Observable<SpaService[]> {
    const cacheKey = 'all-services';
    
    if (useCache && this.servicesCache.has(cacheKey)) {
      const cached = this.servicesCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.servicesSubject.next(cached.data);
        return this.services$;
      }
    }

    this.loadingSubject.next(true);

    return this.http.get<{ data: SpaService[] }>(this.apiUrl).pipe(
      map(response => response.data),
      tap(services => {
        this.servicesSubject.next(services);
        this.servicesCache.set(cacheKey, { data: services, timestamp: Date.now() });
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this)),
      retry(2),
      shareReplay(1)
    );
  }

  /**
   * Obtiene un servicio por ID
   */
  getServiceById(id: string): Observable<SpaService> {
    return this.http.get<{ data: SpaService }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this)),
      retry(1)
    );
  }

  /**
   * Obtiene servicios por categoría
   */
  getServicesByCategory(categoryId: string, useCache = true): Observable<SpaService[]> {
    const cacheKey = `category-${categoryId}`;
    
    if (useCache && this.servicesCache.has(cacheKey)) {
      const cached = this.servicesCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return new BehaviorSubject(cached.data).asObservable();
      }
    }

    return this.http.get<{ data: SpaService[] }>(`${this.apiUrl}/category/${categoryId}`).pipe(
      map(response => response.data),
      tap(services => {
        this.servicesCache.set(cacheKey, { data: services, timestamp: Date.now() });
      }),
      catchError(this.handleError.bind(this)),
      retry(1),
      shareReplay(1)
    );
  }

  /**
   * Obtiene categorías de servicios
   */
  getCategories(): Observable<ServiceCategory[]> {
    return this.http.get<{ data: ServiceCategory[] }>(this.categoriesUrl).pipe(
      map(response => response.data),
      tap(categories => this.categoriesSubject.next(categories)),
      catchError(this.handleError.bind(this)),
      retry(1),
      shareReplay(1)
    );
  }

  /**
   * Obtiene servicios populares
   */
  getPopularServices(limit = 6): Observable<SpaService[]> {
    return this.services$.pipe(
      map(services => 
        services
          .filter(service => service.isPopular && service.isActive)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, limit)
      )
    );
  }

  /**
   * Obtiene servicios nuevos
   */
  getNewServices(limit = 4): Observable<SpaService[]> {
    return this.services$.pipe(
      map(services => 
        services
          .filter(service => service.isNew && service.isActive)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      )
    );
  }

  /**
   * Busca servicios con debounce
   */
  searchServices(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Actualiza filtros
   */
  updateFilters(filters: Partial<ServiceFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersSubject.next({});
    this.searchSubject.next('');
  }

  /**
   * Obtiene reseñas de un servicio
   */
  getServiceReviews(serviceId: string): Observable<ServiceReview[]> {
    return this.http.get<{ data: ServiceReview[] }>(`${this.reviewsUrl}/service/${serviceId}`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Agrega una reseña a un servicio
   */
  addServiceReview(serviceId: string, review: Omit<ServiceReview, 'id' | 'serviceId' | 'date' | 'verified'>): Observable<ServiceReview> {
    const reviewData = {
      ...review,
      serviceId,
      date: new Date().toISOString(),
      verified: false
    };

    return this.http.post<{ data: ServiceReview }>(`${this.reviewsUrl}`, reviewData).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene estadísticas de servicios
   */
  getServiceStats(): Observable<{
    totalServices: number;
    activeServices: number;
    popularServices: number;
    newServices: number;
    averageRating: number;
    totalReviews: number;
    categoriesCount: number;
  }> {
    return this.http.get<{
      data: {
        totalServices: number;
        activeServices: number;
        popularServices: number;
        newServices: number;
        averageRating: number;
        totalReviews: number;
        categoriesCount: number;
      }
    }>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Inicialización de datos
   */
  private initializeData(): void {
    this.getServices().subscribe({
      next: () => {
        // Servicios cargados exitosamente
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.loadMockServices();
      }
    });

    this.getCategories().subscribe({
      next: () => {
        // Categorías cargadas exitosamente
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loadMockCategories();
      }
    });
  }

  /**
   * Configuración de servicios filtrados
   */
  private setupFilteredServices(): void {
    // Los servicios filtrados se configuran mediante el observable filteredServices$
  }

  /**
   * Filtra servicios basado en criterios
   */
  private filterServices(services: SpaService[], searchTerm: string, filters: ServiceFilters): SpaService[] {
    let filtered = services.filter(service => service.isActive);

    // Búsqueda por texto
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(search) ||
        service.description.toLowerCase().includes(search) ||
        service.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(service => service.category === filters.category);
    }

    // Filtro por precio
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(service => service.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(service => service.price <= filters.priceMax!);
    }

    // Filtro por duración
    if (filters.duration) {
      filtered = filtered.filter(service => service.duration === filters.duration);
    }

    // Filtro por popularidad
    if (filters.isPopular) {
      filtered = filtered.filter(service => service.isPopular);
    }

    // Filtro por novedad
    if (filters.isNew) {
      filtered = filtered.filter(service => service.isNew);
    }

    // Filtro por rating
    if (filters.rating) {
      filtered = filtered.filter(service => service.rating >= filters.rating!);
    }

    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(service =>
        filters.tags!.some(tag => service.tags.includes(tag))
      );
    }

    return filtered.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Carga datos mock de servicios
   */
  private loadMockServices(): void {
    const mockServices: SpaService[] = [
      {
        id: 'spa-massage-001',
        name: 'Masaje Relajante Completo',
        description: 'Un masaje completo de cuerpo entero diseñado para liberar tensiones y promover la relajación profunda. Utilizamos aceites esenciales de alta calidad y técnicas tradicionales.',
        shortDescription: 'Masaje completo para relajación total',
        category: 'masajes',
        duration: 60,
        price: 80000,
        discountPrice: 70000,
        images: [
          '/assets/images/services/masaje-relajante-1.jpg',
          '/assets/images/services/masaje-relajante-2.jpg'
        ],
        benefits: [
          'Reduce el estrés y la ansiedad',
          'Mejora la circulación sanguínea',
          'Alivia dolores musculares',
          'Promueve el sueño reparador'
        ],
        includes: [
          'Sesión de masaje de 60 minutos',
          'Aceites aromáticos premium',
          'Música relajante',
          'Toallas calientes'
        ],
        requirements: [
          'Llegar 15 minutos antes',
          'Informar sobre alergias'
        ],
        contraindications: [
          'Embarazo primer trimestre',
          'Lesiones recientes'
        ],
        therapistRequired: true,
        maxGuests: 1,
        rating: 4.8,
        reviewCount: 127,
        isPopular: true,
        isNew: false,
        isActive: true,
        availableSchedule: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          startTime: '09:00',
          endTime: '18:00',
          breaks: [{ start: '12:00', end: '13:00' }]
        },
        tags: ['relajación', 'masaje', 'bienestar', 'anti-estrés'],
        createdAt: '2023-06-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'spa-facial-001',
        name: 'Tratamiento Facial Hidratante',
        description: 'Tratamiento facial especializado en hidratación profunda de la piel. Incluye limpieza, exfoliación, mascarilla nutritiva y hidratación intensiva.',
        shortDescription: 'Hidratación profunda para el rostro',
        category: 'faciales',
        duration: 90,
        price: 95000,
        images: [
          '/assets/images/services/facial-hidratante-1.jpg'
        ],
        benefits: [
          'Hidratación profunda',
          'Mejora textura de la piel',
          'Reduce signos de fatiga',
          'Efecto anti-edad'
        ],
        includes: [
          'Limpieza profunda',
          'Exfoliación suave',
          'Mascarilla hidratante',
          'Sérum nutritivo',
          'Crema hidratante premium'
        ],
        therapistRequired: true,
        maxGuests: 1,
        rating: 4.6,
        reviewCount: 89,
        isPopular: true,
        isNew: true,
        isActive: true,
        availableSchedule: {
          days: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          startTime: '10:00',
          endTime: '17:00'
        },
        tags: ['facial', 'hidratación', 'anti-edad', 'belleza'],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'spa-pool-001',
        name: 'Circuito de Aguas Termales',
        description: 'Disfruta de nuestro circuito completo de aguas termales con diferentes temperaturas y propiedades terapéuticas. Incluye jacuzzi, piscina templada y zona de relajación.',
        shortDescription: 'Circuito completo de aguas termales',
        category: 'relajacion',
        duration: 120,
        price: 45000,
        images: [
          '/assets/images/services/aguas-termales-1.jpg',
          '/assets/images/services/aguas-termales-2.jpg'
        ],
        benefits: [
          'Mejora circulación',
          'Relaja músculos',
          'Reduce inflamación',
          'Desintoxica el organismo'
        ],
        includes: [
          'Acceso a circuito completo',
          'Toallas',
          'Bata de baño',
          'Infusiones naturales'
        ],
        therapistRequired: false,
        maxGuests: 4,
        rating: 4.9,
        reviewCount: 203,
        isPopular: true,
        isNew: false,
        isActive: true,
        availableSchedule: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          startTime: '08:00',
          endTime: '20:00'
        },
        tags: ['aguas termales', 'relajación', 'termal', 'bienestar'],
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z'
      }
    ];

    this.servicesSubject.next(mockServices);
  }

  /**
   * Carga datos mock de categorías
   */
  private loadMockCategories(): void {
    const mockCategories: ServiceCategory[] = [
      {
        id: 'masajes',
        name: 'Masajes',
        description: 'Terapias de masaje para relajación y bienestar',
        icon: 'massage',
        image: '/assets/images/categories/masajes.jpg',
        serviceCount: 8,
        isActive: true
      },
      {
        id: 'faciales',
        name: 'Tratamientos Faciales',
        description: 'Cuidado especializado para la piel del rostro',
        icon: 'face',
        image: '/assets/images/categories/faciales.jpg',
        serviceCount: 6,
        isActive: true
      },
      {
        id: 'corporales',
        name: 'Tratamientos Corporales',
        description: 'Cuidado integral del cuerpo',
        icon: 'spa',
        image: '/assets/images/categories/corporales.jpg',
        serviceCount: 5,
        isActive: true
      },
      {
        id: 'relajacion',
        name: 'Relajación',
        description: 'Espacios y servicios para el descanso',
        icon: 'hot_tub',
        image: '/assets/images/categories/relajacion.jpg',
        serviceCount: 4,
        isActive: true
      }
    ];

    this.categoriesSubject.next(mockCategories);
  }

  /**
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud inválida';
          break;
        case 404:
          errorMessage = 'Servicio no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('SpaServicesService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Limpia caché
   */
  clearCache(): void {
    this.servicesCache.clear();
  }

  /**
   * Refresca datos
   */
  refresh(): void {
    this.clearCache();
    this.initializeData();
  }
}