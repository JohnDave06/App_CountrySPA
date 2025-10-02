import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, retry, shareReplay } from 'rxjs/operators';

export interface Reservation {
  id: string;
  userId: string;
  serviceType: 'spa' | 'cabin' | 'treatment' | 'activity';
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number; // en minutos
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  serviceType: 'spa' | 'cabin' | 'treatment' | 'activity';
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  guests: number;
  specialRequests?: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ReservationFilters {
  status?: string;
  serviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly apiUrl = 'https://api.countryspa.com/reservations'; // URL de la API (mock)
  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  public reservations$ = this.reservationsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadReservations();
  }

  /**
   * Obtiene todas las reservas con filtros opcionales
   */
  getReservations(filters?: ReservationFilters): Observable<Reservation[]> {
    this.loadingSubject.next(true);
    
    let url = this.apiUrl;
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return this.http.get<{ data: Reservation[] }>(url).pipe(
      map(response => response.data),
      tap(reservations => {
        this.reservationsSubject.next(reservations);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this)),
      retry(2),
      shareReplay(1)
    );
  }

  /**
   * Obtiene una reserva específica por ID
   */
  getReservationById(id: string): Observable<Reservation> {
    return this.http.get<{ data: Reservation }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this)),
      retry(1)
    );
  }

  /**
   * Crea una nueva reserva
   */
  createReservation(reservationData: CreateReservationRequest): Observable<Reservation> {
    this.loadingSubject.next(true);

    return this.http.post<{ data: Reservation }>(this.apiUrl, reservationData).pipe(
      map(response => response.data),
      tap(newReservation => {
        const currentReservations = this.reservationsSubject.value;
        this.reservationsSubject.next([...currentReservations, newReservation]);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Actualiza una reserva existente
   */
  updateReservation(id: string, updates: Partial<Reservation>): Observable<Reservation> {
    this.loadingSubject.next(true);

    return this.http.patch<{ data: Reservation }>(`${this.apiUrl}/${id}`, updates).pipe(
      map(response => response.data),
      tap(updatedReservation => {
        const currentReservations = this.reservationsSubject.value;
        const index = currentReservations.findIndex(r => r.id === id);
        if (index !== -1) {
          currentReservations[index] = updatedReservation;
          this.reservationsSubject.next([...currentReservations]);
        }
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Cancela una reserva
   */
  cancelReservation(id: string, reason?: string): Observable<Reservation> {
    return this.updateReservation(id, { 
      status: 'cancelled',
      specialRequests: reason ? `Cancelada: ${reason}` : 'Cancelada por el usuario'
    });
  }

  /**
   * Confirma una reserva
   */
  confirmReservation(id: string): Observable<Reservation> {
    return this.updateReservation(id, { status: 'confirmed' });
  }

  /**
   * Elimina una reserva
   */
  deleteReservation(id: string): Observable<void> {
    this.loadingSubject.next(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentReservations = this.reservationsSubject.value;
        const filteredReservations = currentReservations.filter(r => r.id !== id);
        this.reservationsSubject.next(filteredReservations);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene reservas por fecha específica
   */
  getReservationsByDate(date: string): Observable<Reservation[]> {
    return this.getReservations({ dateFrom: date, dateTo: date });
  }

  /**
   * Obtiene reservas del usuario actual
   */
  getUserReservations(userId: string): Observable<Reservation[]> {
    return this.getReservations({ userId });
  }

  /**
   * Verifica disponibilidad para una fecha y hora específica
   */
  checkAvailability(serviceId: string, date: string, time: string, duration: number): Observable<boolean> {
    const params = new URLSearchParams({
      serviceId,
      date,
      time,
      duration: duration.toString()
    });

    return this.http.get<{ available: boolean }>(`${this.apiUrl}/availability?${params}`).pipe(
      map(response => response.available),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene estadísticas de reservas
   */
  getReservationStats(): Observable<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    thisMonth: number;
    revenue: number;
  }> {
    return this.http.get<{
      data: {
        total: number;
        pending: number;
        confirmed: number;
        cancelled: number;
        completed: number;
        thisMonth: number;
        revenue: number;
      }
    }>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Carga inicial de reservas
   */
  private loadReservations(): void {
    this.getReservations().subscribe({
      next: () => {
        // Reservas cargadas exitosamente
      },
      error: (error) => {
        console.error('Error loading initial reservations:', error);
        // En caso de error, usar datos mock
        this.loadMockReservations();
      }
    });
  }

  /**
   * Carga datos de reservas mock para desarrollo
   */
  private loadMockReservations(): void {
    const mockReservations: Reservation[] = [
      {
        id: '1',
        userId: 'user-123',
        serviceType: 'spa',
        serviceId: 'spa-massage-001',
        serviceName: 'Masaje Relajante',
        date: '2024-01-15',
        time: '10:00',
        duration: 60,
        guests: 1,
        totalPrice: 80000,
        status: 'confirmed',
        contactEmail: 'usuario@example.com',
        contactPhone: '+57 300 123 4567',
        createdAt: '2024-01-10T09:30:00Z',
        updatedAt: '2024-01-10T09:30:00Z'
      },
      {
        id: '2',
        userId: 'user-456',
        serviceType: 'cabin',
        serviceId: 'cabin-luxury-001',
        serviceName: 'Cabaña Premium',
        date: '2024-01-20',
        time: '15:00',
        duration: 1440, // 24 horas
        guests: 4,
        totalPrice: 350000,
        status: 'pending',
        specialRequests: 'Llegada temprana solicitada',
        contactEmail: 'familia@example.com',
        contactPhone: '+57 310 987 6543',
        createdAt: '2024-01-12T14:20:00Z',
        updatedAt: '2024-01-12T14:20:00Z'
      }
    ];

    this.reservationsSubject.next(mockReservations);
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Datos de reserva inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor, inicie sesión';
          break;
        case 403:
          errorMessage = 'No tiene permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Reserva no encontrada';
          break;
        case 409:
          errorMessage = 'El horario seleccionado ya no está disponible';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intente más tarde';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('ReservationService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Limpia el estado del servicio
   */
  clearCache(): void {
    this.reservationsSubject.next([]);
  }

  /**
   * Refresca las reservas
   */
  refresh(): void {
    this.loadReservations();
  }
}