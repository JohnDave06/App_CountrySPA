import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, combineLatest } from 'rxjs';
import { map, catchError, tap, retry, shareReplay, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface Cabin {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  type: 'standard' | 'premium' | 'luxury' | 'family' | 'romantic';
  capacity: {
    min: number;
    max: number;
    recommended: number;
  };
  pricePerNight: number;
  discountPrice?: number;
  area: number; // metros cuadrados
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  features: string[];
  location: {
    zone: string;
    viewType: 'mountain' | 'lake' | 'forest' | 'garden';
    distanceToSpa: number; // metros
    distanceToRestaurant: number;
  };
  availability: {
    isAvailable: boolean;
    nextAvailableDate?: string;
    blockedDates: string[];
    minimumStay: number; // noches mínimas
    maximumStay: number;
  };
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
    pets: boolean;
    smoking: boolean;
    events: boolean;
  };
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CabinFilters {
  type?: string;
  capacity?: number;
  priceMin?: number;
  priceMax?: number;
  checkIn?: string;
  checkOut?: string;
  viewType?: string;
  amenities?: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
  search?: string;
  rating?: number;
}

export interface CabinAvailability {
  cabinId: string;
  date: string;
  isAvailable: boolean;
  price: number;
  discountPrice?: number;
  minimumStay: number;
  reason?: string; // Si no está disponible
}

export interface CabinBooking {
  id: string;
  cabinId: string;
  cabinName: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  contactInfo: {
    email: string;
    phone: string;
    name: string;
  };
  services?: {
    serviceId: string;
    serviceName: string;
    price: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CabinReview {
  id: string;
  cabinId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  aspects: {
    cleanliness: number;
    comfort: number;
    location: number;
    amenities: number;
    value: number;
  };
  date: string;
  verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CabinsService {
  private readonly apiUrl = 'https://api.countryspa.com/cabins';
  private readonly availabilityUrl = 'https://api.countryspa.com/cabins/availability';
  private readonly bookingsUrl = 'https://api.countryspa.com/cabin-bookings';
  private readonly reviewsUrl = 'https://api.countryspa.com/cabin-reviews';

  private cabinsSubject = new BehaviorSubject<Cabin[]>([]);
  public cabins$ = this.cabinsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private searchSubject = new BehaviorSubject<string>('');
  public search$ = this.searchSubject.asObservable();

  private filtersSubject = new BehaviorSubject<CabinFilters>({});
  public filters$ = this.filtersSubject.asObservable();

  // Cache para mejorar rendimiento
  private cabinsCache = new Map<string, { data: Cabin[]; timestamp: number }>();
  private availabilityCache = new Map<string, { data: CabinAvailability[]; timestamp: number }>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutos

  constructor(private http: HttpClient) {
    this.initializeData();
  }

  /**
   * Cabañas filtradas reactivamente
   */
  public filteredCabins$ = combineLatest([
    this.cabins$,
    this.search$.pipe(debounceTime(300), distinctUntilChanged()),
    this.filters$
  ]).pipe(
    map(([cabins, searchTerm, filters]) => this.filterCabins(cabins, searchTerm, filters)),
    shareReplay(1)
  );

  /**
   * Obtiene todas las cabañas
   */
  getCabins(useCache = true): Observable<Cabin[]> {
    const cacheKey = 'all-cabins';
    
    if (useCache && this.cabinsCache.has(cacheKey)) {
      const cached = this.cabinsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.cabinsSubject.next(cached.data);
        return this.cabins$;
      }
    }

    this.loadingSubject.next(true);

    return this.http.get<{ data: Cabin[] }>(this.apiUrl).pipe(
      map(response => response.data),
      tap(cabins => {
        this.cabinsSubject.next(cabins);
        this.cabinsCache.set(cacheKey, { data: cabins, timestamp: Date.now() });
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this)),
      retry(2),
      shareReplay(1)
    );
  }

  /**
   * Obtiene una cabaña por ID
   */
  getCabinById(id: string): Observable<Cabin> {
    return this.http.get<{ data: Cabin }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this)),
      retry(1)
    );
  }

  /**
   * Obtiene cabañas por tipo
   */
  getCabinsByType(type: string): Observable<Cabin[]> {
    return this.cabins$.pipe(
      map(cabins => cabins.filter(cabin => cabin.type === type && cabin.isActive))
    );
  }

  /**
   * Obtiene cabañas destacadas
   */
  getFeaturedCabins(limit = 4): Observable<Cabin[]> {
    return this.cabins$.pipe(
      map(cabins => 
        cabins
          .filter(cabin => cabin.isFeatured && cabin.isActive)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, limit)
      )
    );
  }

  /**
   * Obtiene cabañas populares
   */
  getPopularCabins(limit = 6): Observable<Cabin[]> {
    return this.cabins$.pipe(
      map(cabins => 
        cabins
          .filter(cabin => cabin.isPopular && cabin.isActive)
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice(0, limit)
      )
    );
  }

  /**
   * Verifica disponibilidad de cabañas
   */
  checkAvailability(checkIn: string, checkOut: string, guests = 1): Observable<CabinAvailability[]> {
    const cacheKey = `availability-${checkIn}-${checkOut}-${guests}`;
    
    if (this.availabilityCache.has(cacheKey)) {
      const cached = this.availabilityCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return new BehaviorSubject(cached.data).asObservable();
      }
    }

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString()
    });

    return this.http.get<{ data: CabinAvailability[] }>(`${this.availabilityUrl}?${params}`).pipe(
      map(response => response.data),
      tap(availability => {
        this.availabilityCache.set(cacheKey, { data: availability, timestamp: Date.now() });
      }),
      catchError(this.handleError.bind(this)),
      retry(1),
      shareReplay(1)
    );
  }

  /**
   * Verifica disponibilidad de una cabaña específica
   */
  checkCabinAvailability(cabinId: string, checkIn: string, checkOut: string): Observable<boolean> {
    const params = new URLSearchParams({
      cabinId,
      checkIn,
      checkOut
    });

    return this.http.get<{ available: boolean }>(`${this.availabilityUrl}/check?${params}`).pipe(
      map(response => response.available),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Realiza una reserva de cabaña
   */
  bookCabin(bookingData: Omit<CabinBooking, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Observable<CabinBooking> {
    this.loadingSubject.next(true);

    return this.http.post<{ data: CabinBooking }>(this.bookingsUrl, bookingData).pipe(
      map(response => response.data),
      tap(() => this.loadingSubject.next(false)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene reservas de cabañas del usuario
   */
  getUserBookings(userId: string): Observable<CabinBooking[]> {
    return this.http.get<{ data: CabinBooking[] }>(`${this.bookingsUrl}/user/${userId}`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Cancela una reserva de cabaña
   */
  cancelBooking(bookingId: string, reason?: string): Observable<CabinBooking> {
    const cancelData = { 
      status: 'cancelled',
      cancellationReason: reason 
    };

    return this.http.patch<{ data: CabinBooking }>(`${this.bookingsUrl}/${bookingId}`, cancelData).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Busca cabañas con debounce
   */
  searchCabins(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Actualiza filtros
   */
  updateFilters(filters: Partial<CabinFilters>): void {
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
   * Obtiene reseñas de una cabaña
   */
  getCabinReviews(cabinId: string): Observable<CabinReview[]> {
    return this.http.get<{ data: CabinReview[] }>(`${this.reviewsUrl}/cabin/${cabinId}`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Agrega una reseña a una cabaña
   */
  addCabinReview(cabinId: string, review: Omit<CabinReview, 'id' | 'cabinId' | 'date' | 'verified'>): Observable<CabinReview> {
    const reviewData = {
      ...review,
      cabinId,
      date: new Date().toISOString(),
      verified: false
    };

    return this.http.post<{ data: CabinReview }>(this.reviewsUrl, reviewData).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene estadísticas de cabañas
   */
  getCabinStats(): Observable<{
    totalCabins: number;
    availableCabins: number;
    occupancyRate: number;
    averageRating: number;
    totalBookings: number;
    revenue: number;
    popularCabinType: string;
  }> {
    return this.http.get<{
      data: {
        totalCabins: number;
        availableCabins: number;
        occupancyRate: number;
        averageRating: number;
        totalBookings: number;
        revenue: number;
        popularCabinType: string;
      }
    }>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Calcula el precio total de una estadía
   */
  calculateTotalPrice(cabinId: string, checkIn: string, checkOut: string, services: string[] = []): Observable<{
    basePrice: number;
    servicesPrice: number;
    taxes: number;
    totalPrice: number;
    nights: number;
  }> {
    const requestData = {
      cabinId,
      checkIn,
      checkOut,
      services
    };

    return this.http.post<{
      data: {
        basePrice: number;
        servicesPrice: number;
        taxes: number;
        totalPrice: number;
        nights: number;
      }
    }>(`${this.apiUrl}/calculate-price`, requestData).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Inicialización de datos
   */
  private initializeData(): void {
    this.getCabins().subscribe({
      next: () => {
        // Cabañas cargadas exitosamente
      },
      error: (error) => {
        console.error('Error loading cabins:', error);
        this.loadMockCabins();
      }
    });
  }

  /**
   * Filtra cabañas basado en criterios
   */
  private filterCabins(cabins: Cabin[], searchTerm: string, filters: CabinFilters): Cabin[] {
    let filtered = cabins.filter(cabin => cabin.isActive && cabin.availability.isAvailable);

    // Búsqueda por texto
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(cabin =>
        cabin.name.toLowerCase().includes(search) ||
        cabin.description.toLowerCase().includes(search) ||
        cabin.tags.some(tag => tag.toLowerCase().includes(search)) ||
        cabin.amenities.some(amenity => amenity.toLowerCase().includes(search))
      );
    }

    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter(cabin => cabin.type === filters.type);
    }

    // Filtro por capacidad
    if (filters.capacity) {
      filtered = filtered.filter(cabin => 
        cabin.capacity.max >= filters.capacity! && cabin.capacity.min <= filters.capacity!
      );
    }

    // Filtro por precio
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(cabin => cabin.pricePerNight >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(cabin => cabin.pricePerNight <= filters.priceMax!);
    }

    // Filtro por vista
    if (filters.viewType) {
      filtered = filtered.filter(cabin => cabin.location.viewType === filters.viewType);
    }

    // Filtro por amenidades
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(cabin =>
        filters.amenities!.every(amenity => cabin.amenities.includes(amenity))
      );
    }

    // Filtro por popularidad
    if (filters.isPopular) {
      filtered = filtered.filter(cabin => cabin.isPopular);
    }

    // Filtro por destacado
    if (filters.isFeatured) {
      filtered = filtered.filter(cabin => cabin.isFeatured);
    }

    // Filtro por rating
    if (filters.rating) {
      filtered = filtered.filter(cabin => cabin.rating >= filters.rating!);
    }

    return filtered.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Carga datos mock de cabañas
   */
  private loadMockCabins(): void {
    const mockCabins: Cabin[] = [
      {
        id: 'cabin-luxury-001',
        name: 'Cabaña Premium Vista Montaña',
        description: 'Hermosa cabaña de lujo con vista panorámica a las montañas. Cuenta con todas las comodidades modernas y un diseño que combina rusticidad con elegancia.',
        shortDescription: 'Cabaña de lujo con vista a las montañas',
        type: 'luxury',
        capacity: {
          min: 2,
          max: 6,
          recommended: 4
        },
        pricePerNight: 350000,
        discountPrice: 315000,
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        images: [
          '/assets/images/cabins/luxury-001-1.jpg',
          '/assets/images/cabins/luxury-001-2.jpg',
          '/assets/images/cabins/luxury-001-3.jpg'
        ],
        amenities: [
          'WiFi gratuito',
          'Aire acondicionado',
          'Cocina equipada',
          'Chimenea',
          'Terraza privada',
          'Jacuzzi privado',
          'TV Smart',
          'Minibar',
          'Caja fuerte',
          'Servicio de limpieza diario'
        ],
        features: [
          'Vista panorámica a montañas',
          'Arquitectura rústica moderna',
          'Materiales naturales',
          'Decoración de lujo',
          'Iluminación LED',
          'Sistemas domóticos'
        ],
        location: {
          zone: 'Zona Premium',
          viewType: 'mountain',
          distanceToSpa: 150,
          distanceToRestaurant: 200
        },
        availability: {
          isAvailable: true,
          blockedDates: ['2024-02-14', '2024-02-15', '2024-02-16'],
          minimumStay: 2,
          maximumStay: 14
        },
        policies: {
          checkIn: '15:00',
          checkOut: '11:00',
          cancellation: 'Cancelación gratuita hasta 48 horas antes',
          pets: false,
          smoking: false,
          events: false
        },
        rating: 4.9,
        reviewCount: 87,
        isPopular: true,
        isFeatured: true,
        isNew: false,
        isActive: true,
        tags: ['lujo', 'montaña', 'vista', 'jacuzzi', 'premium'],
        createdAt: '2023-03-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'cabin-family-001',
        name: 'Cabaña Familiar del Bosque',
        description: 'Perfecta para familias que buscan tranquilidad en medio de la naturaleza. Amplia y cómoda con todas las facilidades para una estadía memorable.',
        shortDescription: 'Cabaña espaciosa ideal para familias',
        type: 'family',
        capacity: {
          min: 4,
          max: 8,
          recommended: 6
        },
        pricePerNight: 280000,
        area: 140,
        bedrooms: 4,
        bathrooms: 3,
        images: [
          '/assets/images/cabins/family-001-1.jpg',
          '/assets/images/cabins/family-001-2.jpg'
        ],
        amenities: [
          'WiFi gratuito',
          'Cocina completa',
          'Sala de estar amplia',
          'Comedor para 8 personas',
          'Terraza con asador',
          'Juegos para niños',
          'TV Smart en cada habitación',
          'Lavadora y secadora',
          'Parqueadero privado'
        ],
        features: [
          'Rodeada de naturaleza',
          'Ambiente familiar',
          'Espacios amplios',
          'Zona de juegos infantiles',
          'Área de BBQ'
        ],
        location: {
          zone: 'Zona Familiar',
          viewType: 'forest',
          distanceToSpa: 300,
          distanceToRestaurant: 250
        },
        availability: {
          isAvailable: true,
          blockedDates: [],
          minimumStay: 1,
          maximumStay: 10
        },
        policies: {
          checkIn: '15:00',
          checkOut: '11:00',
          cancellation: 'Cancelación gratuita hasta 24 horas antes',
          pets: true,
          smoking: false,
          events: true
        },
        rating: 4.7,
        reviewCount: 156,
        isPopular: true,
        isFeatured: false,
        isNew: false,
        isActive: true,
        tags: ['familia', 'bosque', 'niños', 'amplia', 'naturaleza'],
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z'
      },
      {
        id: 'cabin-romantic-001',
        name: 'Cabaña Romántica Lago Sereno',
        description: 'Íntima cabaña perfecta para parejas que buscan un escape romántico. Vista al lago, ambiente acogedor y todas las comodidades para una experiencia inolvidable.',
        shortDescription: 'Refugio romántico con vista al lago',
        type: 'romantic',
        capacity: {
          min: 2,
          max: 2,
          recommended: 2
        },
        pricePerNight: 250000,
        area: 65,
        bedrooms: 1,
        bathrooms: 1,
        images: [
          '/assets/images/cabins/romantic-001-1.jpg',
          '/assets/images/cabins/romantic-001-2.jpg'
        ],
        amenities: [
          'WiFi gratuito',
          'Cocina kitchenette',
          'Chimenea romántica',
          'Bañera de hidromasaje',
          'Terraza privada con vista al lago',
          'Cama king size',
          'TV Smart',
          'Minibar premium',
          'Servicio de habitaciones 24h',
          'Decoración romántica'
        ],
        features: [
          'Vista directa al lago',
          'Ambiente íntimo',
          'Decoración romántica',
          'Iluminación tenue',
          'Privacidad total'
        ],
        location: {
          zone: 'Zona Romántica',
          viewType: 'lake',
          distanceToSpa: 100,
          distanceToRestaurant: 150
        },
        availability: {
          isAvailable: true,
          blockedDates: ['2024-02-14', '2024-12-31'],
          minimumStay: 1,
          maximumStay: 7
        },
        policies: {
          checkIn: '15:00',
          checkOut: '12:00',
          cancellation: 'Cancelación gratuita hasta 24 horas antes',
          pets: false,
          smoking: false,
          events: false
        },
        rating: 4.8,
        reviewCount: 203,
        isPopular: true,
        isFeatured: true,
        isNew: true,
        isActive: true,
        tags: ['romántico', 'lago', 'parejas', 'íntimo', 'jacuzzi'],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      }
    ];

    this.cabinsSubject.next(mockCabins);
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
          errorMessage = 'Cabaña no encontrada';
          break;
        case 409:
          errorMessage = 'Las fechas seleccionadas no están disponibles';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('CabinsService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Limpia caché
   */
  clearCache(): void {
    this.cabinsCache.clear();
    this.availabilityCache.clear();
  }

  /**
   * Refresca datos
   */
  refresh(): void {
    this.clearCache();
    this.initializeData();
  }
}