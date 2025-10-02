import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReservationService, Reservation } from '../../services/reservation/reservation.service';
import { SpaServicesService, SpaService } from '../../services/spa-services/spa-services.service';
import { CabinsService, Cabin } from '../../services/cabins/cabins.service';

@Component({
  selector: 'app-reservations-screen',
  templateUrl: './reservations-screen.component.html',
  styleUrls: ['./reservations-screen.component.css']
})
export class ReservationsScreenComponent implements OnInit {
  reservations: Reservation[] = [];
  services: SpaService[] = [];
  cabins: Cabin[] = [];
  loading = true;
  showNewReservationForm = false;
  
  newReservationForm: FormGroup;
  reservationType: 'service' | 'cabin' = 'service';

  constructor(
    private reservationService: ReservationService,
    private spaServicesService: SpaServicesService,
    private cabinsService: CabinsService,
    private formBuilder: FormBuilder
  ) {
    this.newReservationForm = this.createReservationForm();
  }

  ngOnInit(): void {
    this.loadReservations();
    this.loadServices();
    this.loadCabins();
  }

  createReservationForm(): FormGroup {
    return this.formBuilder.group({
      type: ['service', Validators.required],
      serviceId: [''],
      cabinId: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      specialRequests: [''],
      contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', Validators.required]
    });
  }

  loadReservations(): void {
    // In a real app, this would load user-specific reservations
    this.reservationService.getReservations().subscribe({
      next: (reservations: Reservation[]) => {
        this.reservations = reservations;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading reservations:', error);
        this.loading = false;
      }
    });
  }

  loadServices(): void {
    this.spaServicesService.getServices().subscribe({
      next: (services: SpaService[]) => {
        this.services = services.filter(s => s.isActive);
      },
      error: (error: any) => {
        console.error('Error loading services:', error);
      }
    });
  }

  loadCabins(): void {
    this.cabinsService.getCabins().subscribe({
      next: (cabins: Cabin[]) => {
        this.cabins = cabins.filter(c => c.isActive && c.availability.isAvailable);
      },
      error: (error: any) => {
        console.error('Error loading cabins:', error);
      }
    });
  }

  onReservationTypeChange(type: 'service' | 'cabin'): void {
    this.reservationType = type;
    this.newReservationForm.patchValue({ type });
    
    // Clear the other field
    if (type === 'service') {
      this.newReservationForm.patchValue({ cabinId: '' });
    } else {
      this.newReservationForm.patchValue({ serviceId: '' });
    }
  }

  onSubmitReservation(): void {
    if (this.newReservationForm.valid) {
      const formData = this.newReservationForm.value;
      
      // Simulate reservation creation
      const newReservation: Partial<Reservation> = {
        serviceType: formData.type === 'service' ? 'spa' : 'cabin',
        serviceId: formData.serviceId || formData.cabinId || '',
        serviceName: formData.type === 'service' 
          ? this.getServiceName(formData.serviceId) 
          : this.getCabinName(formData.cabinId),
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
        specialRequests: formData.specialRequests,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        status: 'pending'
      };

      // For demo purposes, just show success message
      alert('¡Reserva enviada exitosamente! Te contactaremos pronto para confirmar los detalles.');
      
      this.newReservationForm.reset();
      this.newReservationForm.patchValue({ type: 'service', guests: 1 });
      this.showNewReservationForm = false;
      
      // In a real app, you would call:
      // this.reservationService.createReservation(newReservation).subscribe(...)
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.newReservationForm.controls).forEach(key => {
        this.newReservationForm.get(key)?.markAsTouched();
      });
    }
  }

  cancelReservation(reservationId: string): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      this.reservationService.cancelReservation(reservationId).subscribe({
        next: () => {
          alert('Reserva cancelada exitosamente.');
          this.loadReservations();
        },
        error: (error: any) => {
          console.error('Error canceling reservation:', error);
          alert('Error al cancelar la reserva. Inténtalo de nuevo.');
        }
      });
    }
  }

  getServiceName(serviceId: string): string {
    const service = this.services.find(s => s.id === serviceId);
    return service ? service.name : 'Servicio no encontrado';
  }

  getCabinName(cabinId: string): string {
    const cabin = this.cabins.find(c => c.id === cabinId);
    return cabin ? cabin.name : 'Cabaña no encontrada';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-error';
      case 'completed':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return 'Desconocido';
    }
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.newReservationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.newReservationForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['email']) return 'Ingresa un email válido';
      if (field.errors['min']) return 'Valor mínimo no alcanzado';
      if (field.errors['max']) return 'Valor máximo excedido';
    }
    return '';
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}