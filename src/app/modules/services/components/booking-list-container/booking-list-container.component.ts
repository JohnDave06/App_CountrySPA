import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-list-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="booking-list-container">
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-6">
            <span class="mr-2">📋</span>
            Mis Reservas
          </h2>

          <div class="space-y-4">
            <div *ngFor="let booking of mockBookings" 
                 class="card bg-base-200 border border-base-300">
              <div class="card-body">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg">{{ booking.serviceName }}</h3>
                    <p class="text-sm text-base-content/70 mb-2">{{ booking.description }}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="font-medium">Fecha:</span> {{ booking.date }}
                      </div>
                      <div>
                        <span class="font-medium">Hora:</span> {{ booking.time }}
                      </div>
                      <div>
                        <span class="font-medium">Duración:</span> {{ booking.duration }} min
                      </div>
                      <div>
                        <span class="font-medium">Precio:</span> \${{ booking.price }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex flex-col items-end space-y-2">
                    <div class="badge" 
                         [class]="getStatusClass(booking.status)">
                      {{ booking.status }}
                    </div>
                    <div class="dropdown dropdown-end">
                      <label tabindex="0" class="btn btn-ghost btn-sm">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                        </svg>
                      </label>
                      <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li><a (click)="viewBooking(booking.id)">Ver Detalles</a></li>
                        <li *ngIf="booking.status === 'Confirmada'">
                          <a (click)="modifyBooking(booking.id)">Modificar</a>
                        </li>
                        <li *ngIf="booking.status === 'Confirmada'">
                          <a (click)="cancelBooking(booking.id)" class="text-error">Cancelar</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="mockBookings.length === 0" 
               class="text-center py-12 text-base-content/60">
            <div class="text-6xl mb-4">📅</div>
            <h3 class="text-xl font-semibold mb-2">No tienes reservas</h3>
            <p class="mb-4">¡Reserva tu primer servicio de spa!</p>
            <button class="btn btn-primary">Explorar Servicios</button>
          </div>

          <!-- Route Guard Demo -->
          <div class="card bg-warning text-warning-content mt-6">
            <div class="card-body">
              <h3 class="card-title text-sm">Demostración de Route Guards</h3>
              <p class="text-xs">
                Esta ruta está protegida por AuthGuard y PermissionGuard.
                Requiere autenticación y el permiso 'view-bookings'.
              </p>
              <div class="text-xs mt-2">
                <strong>Guards activos:</strong> AuthGuard, PermissionGuard<br>
                <strong>Permisos requeridos:</strong> ['view-bookings']
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booking-list-container {
      padding: 1rem;
      animation: fadeIn 0.4s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class BookingListContainerComponent {
  mockBookings = [
    {
      id: 'book-001',
      serviceName: 'Masaje Relajante Completo',
      description: 'Masaje corporal de 90 minutos con aromaterapia',
      date: '25 Oct 2025',
      time: '15:00',
      duration: 90,
      price: 150,
      status: 'Confirmada'
    },
    {
      id: 'book-002',
      serviceName: 'Facial Rejuvenecedor Premium',
      description: 'Tratamiento facial avanzado con productos orgánicos',
      date: '28 Oct 2025',
      time: '11:00',
      duration: 120,
      price: 200,
      status: 'Pendiente'
    },
    {
      id: 'book-003',
      serviceName: 'Masaje de Piedras Calientes',
      description: 'Terapia con piedras volcánicas para relajación profunda',
      date: '20 Oct 2025',
      time: '16:00',
      duration: 75,
      price: 180,
      status: 'Completada'
    }
  ];

  getStatusClass(status: string): string {
    switch (status) {
      case 'Confirmada':
        return 'badge-success';
      case 'Pendiente':
        return 'badge-warning';
      case 'Completada':
        return 'badge-info';
      case 'Cancelada':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  viewBooking(id: string): void {
    console.log('Viewing booking:', id);
    alert(`Ver detalles de la reserva: ${id}`);
  }

  modifyBooking(id: string): void {
    console.log('Modifying booking:', id);
    alert(`Modificar reserva: ${id}`);
  }

  cancelBooking(id: string): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      console.log('Cancelling booking:', id);
      // In real app, would update the booking status
      alert(`Reserva ${id} cancelada`);
    }
  }
}