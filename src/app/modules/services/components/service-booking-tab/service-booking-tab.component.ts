import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-service-booking-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="service-booking-tab">
      <!-- Authentication Check -->
      <div *ngIf="!isAuthenticated" class="alert alert-warning mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 class="font-bold">Autenticación Requerida</h3>
          <div class="text-xs">Debes iniciar sesión para reservar este servicio.</div>
        </div>
        <div>
          <button class="btn btn-sm btn-primary" (click)="simulateLogin()">
            Iniciar Sesión de Prueba
          </button>
        </div>
      </div>

      <!-- Booking Form -->
      <div *ngIf="isAuthenticated" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Booking Details -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Detalles de la Reserva</h3>
            
            <form (ngSubmit)="onSubmitBooking()" class="space-y-4">
              <!-- Date Selection -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Fecha Preferida</span>
                </label>
                <input type="date" 
                       class="input input-bordered" 
                       [(ngModel)]="bookingForm.preferredDate"
                       name="preferredDate"
                       [min]="getMinDate()"
                       required>
              </div>

              <!-- Time Selection -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Hora Preferida</span>
                </label>
                <select class="select select-bordered" 
                        [(ngModel)]="bookingForm.preferredTime"
                        name="preferredTime"
                        required>
                  <option value="" disabled>Selecciona una hora</option>
                  <option *ngFor="let time of availableTimes" [value]="time">
                    {{ time }}
                  </option>
                </select>
              </div>

              <!-- Therapist Preference -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Preferencia de Terapeuta</span>
                </label>
                <select class="select select-bordered" 
                        [(ngModel)]="bookingForm.therapistPreference"
                        name="therapistPreference">
                  <option value="">Sin preferencia</option>
                  <option value="female">Preferencia femenina</option>
                  <option value="male">Preferencia masculina</option>
                  <option value="experienced">Más experimentado/a</option>
                </select>
              </div>

              <!-- Special Requests -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Solicitudes Especiales</span>
                </label>
                <textarea class="textarea textarea-bordered" 
                          [(ngModel)]="bookingForm.specialRequests"
                          name="specialRequests"
                          placeholder="Alergias, preferencias de aceites, áreas de enfoque, etc."
                          rows="3"></textarea>
              </div>

              <!-- Contact Information -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Teléfono de Contacto</span>
                </label>
                <input type="tel" 
                       class="input input-bordered" 
                       [(ngModel)]="bookingForm.contactPhone"
                       name="contactPhone"
                       placeholder="+52 555 123 4567"
                       required>
              </div>

              <!-- Agreement -->
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Acepto los términos y condiciones</span>
                  <input type="checkbox" 
                         class="checkbox checkbox-primary" 
                         [(ngModel)]="bookingForm.agreeToTerms"
                         name="agreeToTerms"
                         required>
                </label>
              </div>

              <!-- Submit Button -->
              <div class="form-control mt-6">
                <button type="submit" 
                        class="btn btn-primary"
                        [disabled]="!isFormValid()"
                        [class.loading]="isSubmitting">
                  {{ isSubmitting ? 'Procesando...' : 'Confirmar Reserva' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Booking Summary -->
        <div class="space-y-4">
          <!-- Service Summary -->
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body">
              <h3 class="card-title text-lg mb-4">Resumen del Servicio</h3>
              
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="font-medium">Servicio:</span>
                  <span>{{ serviceData?.name || 'Masaje Relajante' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Duración:</span>
                  <span>{{ serviceData?.duration || 90 }} min</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Precio Base:</span>
                  <span>\${{ serviceData?.price || 150 }}</span>
                </div>
                <div class="divider"></div>
                <div class="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span class="text-primary">\${{ calculateTotal() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Booking Policies -->
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body">
              <h3 class="card-title text-lg mb-4">Políticas de Reserva</h3>
              
              <ul class="space-y-2 text-sm">
                <li class="flex items-start">
                  <span class="text-info mr-2">ℹ️</span>
                  <span>Cancellación gratuita hasta 24 horas antes</span>
                </li>
                <li class="flex items-start">
                  <span class="text-warning mr-2">⚠️</span>
                  <span>Llegar 15 minutos antes de la cita</span>
                </li>
                <li class="flex items-start">
                  <span class="text-success mr-2">✓</span>
                  <span>Confirmación por SMS y email</span>
                </li>
                <li class="flex items-start">
                  <span class="text-error mr-2">❌</span>
                  <span>No-show: cargo del 50% del servicio</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Route Guard Demo -->
          <div class="card bg-warning text-warning-content">
            <div class="card-body">
              <h3 class="card-title text-sm">Demostración de Route Guard</h3>
              <p class="text-xs">
                Esta pestaña requiere autenticación y permisos específicos. 
                El guard "AuthGuard" y "PermissionGuard" verifican el acceso.
              </p>
              <div class="text-xs mt-2">
                <strong>Permisos requeridos:</strong> ['book-service']
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-booking-tab {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ServiceBookingTabComponent implements OnInit {
  serviceData: any;
  isAuthenticated = false;
  isSubmitting = false;

  bookingForm = {
    preferredDate: '',
    preferredTime: '',
    therapistPreference: '',
    specialRequests: '',
    contactPhone: '',
    agreeToTerms: false
  };

  availableTimes = [
    '09:00', '10:30', '12:00', '13:30', 
    '15:00', '16:30', '18:00', '19:30'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.serviceData = this.route.parent?.snapshot.data['service'];
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    this.isAuthenticated = localStorage.getItem('user-token') !== null;
  }

  simulateLogin(): void {
    localStorage.setItem('user-token', 'fake-token-' + Date.now());
    localStorage.setItem('user-role', 'user');
    localStorage.setItem('user-permissions', JSON.stringify(['book-service', 'view-services']));
    this.isAuthenticated = true;
  }

  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  isFormValid(): boolean {
    return !!(
      this.bookingForm.preferredDate &&
      this.bookingForm.preferredTime &&
      this.bookingForm.contactPhone &&
      this.bookingForm.agreeToTerms
    );
  }

  calculateTotal(): number {
    return this.serviceData?.price || 150;
  }

  onSubmitBooking(): void {
    if (!this.isFormValid()) return;

    this.isSubmitting = true;

    // Simulate booking process
    setTimeout(() => {
      this.isSubmitting = false;
      
      // Show success message (in real app, would use notification service)
      alert('¡Reserva confirmada! Recibirás un email de confirmación en breve.');
      
      // Navigate to booking list
      this.router.navigate(['/services/booking']);
    }, 2000);
  }
}