import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';

export interface ServiceDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  rating: number;
  availability: boolean;
  images: string[];
  benefits: string[];
  requirements: string[];
}

export interface CabinDetails {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  location: string;
  rating: number;
  availability: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences: string[];
  bookingHistory: any[];
  loyaltyPoints: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceResolver implements Resolve<ServiceDetails> {
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<ServiceDetails> {
    const serviceId = route.paramMap.get('id') || '1';
    
    // Simular carga de datos del servicio
    return of(this.getMockServiceDetails(serviceId)).pipe(
      delay(300), // Simular latencia de red
      catchError(error => {
        console.error('Error loading service details:', error);
        return of(this.getDefaultServiceDetails());
      })
    );
  }

  private getMockServiceDetails(id: string): ServiceDetails {
    const services: ServiceDetails[] = [
      {
        id: '1',
        name: 'Masaje Relajante Completo',
        description: 'Un masaje corporal completo que combina técnicas de relajación profunda con aromaterapia para liberar tensiones y restaurar el equilibrio energético.',
        price: 150,
        duration: 90,
        category: 'Masajes',
        rating: 4.8,
        availability: true,
        images: ['/assets/images/service-massage-1.jpg', '/assets/images/service-massage-2.jpg'],
        benefits: [
          'Reduce el estrés y la ansiedad',
          'Mejora la circulación sanguínea',
          'Alivia dolores musculares',
          'Promueve la relajación profunda'
        ],
        requirements: [
          'No haber comido en las últimas 2 horas',
          'Informar sobre alergias o condiciones médicas',
          'Llegar 15 minutos antes de la cita'
        ]
      },
      {
        id: '2',
        name: 'Facial Rejuvenecedor Premium',
        description: 'Tratamiento facial avanzado con tecnología de última generación y productos naturales orgánicos para rejuvenecer y revitalizar la piel.',
        price: 200,
        duration: 120,
        category: 'Faciales',
        rating: 4.9,
        availability: true,
        images: ['/assets/images/service-facial-1.jpg', '/assets/images/service-facial-2.jpg'],
        benefits: [
          'Rejuvenece la piel',
          'Reduce líneas de expresión',
          'Hidratación profunda',
          'Luminosidad natural'
        ],
        requirements: [
          'No usar retinoides 7 días antes',
          'Informar sobre alergias cutáneas',
          'Evitar exposición solar 24h después'
        ]
      }
    ];

    return services.find(s => s.id === id) || services[0];
  }

  private getDefaultServiceDetails(): ServiceDetails {
    return {
      id: 'default',
      name: 'Servicio No Disponible',
      description: 'El servicio solicitado no está disponible en este momento.',
      price: 0,
      duration: 0,
      category: 'N/A',
      rating: 0,
      availability: false,
      images: [],
      benefits: [],
      requirements: []
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class CabinResolver implements Resolve<CabinDetails> {
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<CabinDetails> {
    const cabinId = route.paramMap.get('id') || '1';
    
    return of(this.getMockCabinDetails(cabinId)).pipe(
      delay(400),
      catchError(error => {
        console.error('Error loading cabin details:', error);
        return of(this.getDefaultCabinDetails());
      })
    );
  }

  private getMockCabinDetails(id: string): CabinDetails {
    const cabins: CabinDetails[] = [
      {
        id: '1',
        name: 'Cabaña del Lago Serenidad',
        description: 'Una hermosa cabaña frente al lago con vista panorámica, perfecta para una escapada romántica o familiar rodeada de naturaleza.',
        capacity: 4,
        pricePerNight: 180,
        amenities: [
          'Vista al lago',
          'Chimenea',
          'Cocina completa',
          'WiFi',
          'Aire acondicionado',
          'Terraza privada',
          'Jacuzzi exterior'
        ],
        images: ['/assets/images/cabin-lake-1.jpg', '/assets/images/cabin-lake-2.jpg'],
        location: 'Zona del Lago, Área Natural Protegida',
        rating: 4.7,
        availability: true
      },
      {
        id: '2',
        name: 'Cabaña Montaña Mística',
        description: 'Ubicada en lo alto de la montaña, esta cabaña ofrece vistas espectaculares y un ambiente de tranquilidad absoluta.',
        capacity: 6,
        pricePerNight: 220,
        amenities: [
          'Vista panorámica de montaña',
          'Chimenea de leña',
          'Sauna privada',
          'Cocina gourmet',
          'Balcón con hamacas',
          'Parrilla exterior'
        ],
        images: ['/assets/images/cabin-mountain-1.jpg', '/assets/images/cabin-mountain-2.jpg'],
        location: 'Cima de la Montaña, Reserva Natural',
        rating: 4.9,
        availability: true
      }
    ];

    return cabins.find(c => c.id === id) || cabins[0];
  }

  private getDefaultCabinDetails(): CabinDetails {
    return {
      id: 'default',
      name: 'Cabaña No Disponible',
      description: 'La cabaña solicitada no está disponible en este momento.',
      capacity: 0,
      pricePerNight: 0,
      amenities: [],
      images: [],
      location: 'N/A',
      rating: 0,
      availability: false
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileResolver implements Resolve<UserProfile> {
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<UserProfile> {
    const userId = route.paramMap.get('userId') || 'current';
    
    return of(this.getMockUserProfile(userId)).pipe(
      delay(250),
      catchError(error => {
        console.error('Error loading user profile:', error);
        return of(this.getDefaultUserProfile());
      })
    );
  }

  private getMockUserProfile(id: string): UserProfile {
    return {
      id: id,
      name: 'María García Rodríguez',
      email: 'maria.garcia@email.com',
      phone: '+52 555 123 4567',
      preferences: ['Masajes', 'Tratamientos faciales', 'Aromaterapia'],
      bookingHistory: [
        {
          id: 'book-001',
          service: 'Masaje Relajante',
          date: '2025-09-15',
          status: 'Completado',
          rating: 5
        },
        {
          id: 'book-002',
          cabin: 'Cabaña del Lago',
          dates: '2025-08-20 - 2025-08-22',
          status: 'Completado',
          rating: 4
        }
      ],
      loyaltyPoints: 1250
    };
  }

  private getDefaultUserProfile(): UserProfile {
    return {
      id: 'default',
      name: 'Usuario Invitado',
      email: 'guest@example.com',
      phone: '',
      preferences: [],
      bookingHistory: [],
      loyaltyPoints: 0
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class DashboardDataResolver implements Resolve<any> {
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    // Resolver complejo que carga múltiples fuentes de datos
    return forkJoin({
      services: this.loadServices(),
      cabins: this.loadCabins(),
      userStats: this.loadUserStats(),
      recommendations: this.loadRecommendations()
    }).pipe(
      delay(600),
      catchError(error => {
        console.error('Error loading dashboard data:', error);
        return of(this.getDefaultDashboardData());
      })
    );
  }

  private loadServices(): Observable<ServiceDetails[]> {
    return of([
      {
        id: '1',
        name: 'Masaje Relajante',
        description: 'Masaje corporal completo',
        price: 150,
        duration: 90,
        category: 'Masajes',
        rating: 4.8,
        availability: true,
        images: [],
        benefits: [],
        requirements: []
      },
      {
        id: '2',
        name: 'Facial Premium',
        description: 'Tratamiento facial avanzado',
        price: 200,
        duration: 120,
        category: 'Faciales',
        rating: 4.9,
        availability: true,
        images: [],
        benefits: [],
        requirements: []
      }
    ]);
  }

  private loadCabins(): Observable<CabinDetails[]> {
    return of([
      {
        id: '1',
        name: 'Cabaña del Lago',
        description: 'Vista panorámica al lago',
        capacity: 4,
        pricePerNight: 180,
        amenities: ['Vista al lago', 'Chimenea'],
        images: [],
        location: 'Zona del Lago',
        rating: 4.7,
        availability: true
      }
    ]);
  }

  private loadUserStats(): Observable<any> {
    return of({
      totalBookings: 15,
      favoriteServices: 8,
      loyaltyPoints: 1250,
      lastVisit: '2025-09-28'
    });
  }

  private loadRecommendations(): Observable<any[]> {
    return of([
      {
        type: 'service',
        id: '3',
        name: 'Aromaterapia Especial',
        reason: 'Basado en tus preferencias'
      },
      {
        type: 'cabin',
        id: '3',
        name: 'Cabaña Bosque Encantado',
        reason: 'Nueva disponibilidad'
      }
    ]);
  }

  private getDefaultDashboardData(): any {
    return {
      services: [],
      cabins: [],
      userStats: {
        totalBookings: 0,
        favoriteServices: 0,
        loyaltyPoints: 0,
        lastVisit: null
      },
      recommendations: []
    };
  }
}

// Servicio utilitario para manejar resolvers
@Injectable({
  providedIn: 'root'
})
export class ResolverUtilsService {
  constructor() {}

  // Simular carga lenta para testing
  simulateSlowLoading<T>(data: T, delayMs: number = 2000): Observable<T> {
    console.log(`Simulating slow loading with ${delayMs}ms delay...`);
    return of(data).pipe(
      delay(delayMs),
      map((result: T) => {
        console.log('Data loaded successfully:', result);
        return result;
      })
    );
  }

  // Simular error para testing
  simulateError<T>(errorMessage: string = 'Simulated resolver error'): Observable<T> {
    console.error(`Simulating resolver error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}