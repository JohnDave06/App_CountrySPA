import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

interface FeaturedService {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

interface Stat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.css']
})
export class HomeScreenComponent {
  @Output() reserveClick = new EventEmitter<void>();
  @Output() serviceClick = new EventEmitter<FeaturedService>();

  emailSubscription: string = '';

  featuredServices: FeaturedService[] = [
    {
      id: 'spa-relax',
      name: 'Spa & Relajación',
      description: 'Masajes terapéuticos y tratamientos de relajación',
      category: 'Spa',
      icon: '💆‍♀️'
    },
    {
      id: 'cabins',
      name: 'Cabañas Premium',
      description: 'Alojamiento cómodo en medio de la naturaleza',
      category: 'Alojamiento',
      icon: '🏡'
    },
    {
      id: 'pools',
      name: 'Piscinas Naturales',
      description: 'Disfruta de nuestras piscinas con agua termal',
      category: 'Recreación',
      icon: '🏊‍♀️'
    },
    {
      id: 'restaurant',
      name: 'Restaurante Gourmet',
      description: 'Gastronomía local con ingredientes frescos',
      category: 'Gastronomía',
      icon: '🍽️'
    },
    {
      id: 'activities',
      name: 'Actividades',
      description: 'Senderismo, yoga y actividades al aire libre',
      category: 'Recreación',
      icon: '🧘‍♀️'
    },
    {
      id: 'events',
      name: 'Eventos Especiales',
      description: 'Espacios para celebraciones y eventos corporativos',
      category: 'Eventos',
      icon: '🎉'
    }
  ];

  stats: Stat[] = [
    { value: '500+', label: 'Huéspedes Felices' },
    { value: '15', label: 'Años de Experiencia' },
    { value: '24/7', label: 'Atención al Cliente' },
    { value: '4.9★', label: 'Calificación Promedio' }
  ];

  constructor(private router: Router) {}

  onReserveNow(): void {
    this.reserveClick.emit();
    this.router.navigate(['/reservations']);
  }

  onExploreServices(): void {
    this.router.navigate(['/services']);
  }

  onServiceClick(service: FeaturedService): void {
    this.serviceClick.emit(service);
    this.router.navigate(['/services', service.id]);
  }

  onSubscribe(): void {
    if (this.emailSubscription && this.emailSubscription.includes('@')) {
      // Simulamos el envío del email
      alert(`¡Gracias por suscribirte! Hemos enviado un email de confirmación a ${this.emailSubscription}`);
      this.emailSubscription = '';
    } else {
      alert('Por favor ingresa un email válido');
    }
  }
}
