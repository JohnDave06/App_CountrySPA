import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-gallery-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="service-gallery-tab">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let image of mockImages; let i = index" 
             class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
             (click)="openImageModal(i)">
          <figure class="aspect-square">
            <img [src]="image.url" 
                 [alt]="image.alt"
                 class="w-full h-full object-cover">
          </figure>
          <div class="card-body p-3">
            <h4 class="card-title text-sm">{{ image.title }}</h4>
            <p class="text-xs text-base-content/60">{{ image.description }}</p>
          </div>
        </div>
      </div>

      <div class="card bg-success text-success-content mt-6">
        <div class="card-body">
          <h4 class="card-title text-sm">Ruta Hija con Lazy Loading</h4>
          <p class="text-xs">
            Este componente se carga de forma perezosa (lazy loading) solo cuando se navega a esta pestaña.
            Esto mejora el rendimiento de la aplicación.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-gallery-tab {
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ServiceGalleryTabComponent {
  mockImages = [
    {
      url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
      title: 'Sala de Masajes Principal',
      alt: 'Sala de masajes',
      description: 'Ambiente relajante con iluminación tenue'
    },
    {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      title: 'Área de Relajación',
      alt: 'Área de relajación',
      description: 'Espacio para preparación pre-tratamiento'
    },
    {
      url: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=400',
      title: 'Productos Naturales',
      alt: 'Aceites esenciales',
      description: 'Aceites y productos orgánicos utilizados'
    },
    {
      url: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=400',
      title: 'Vista Exterior',
      alt: 'Exterior del spa',
      description: 'Entrada principal del centro de bienestar'
    },
    {
      url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400',
      title: 'Sala VIP',
      alt: 'Sala VIP',
      description: 'Suite premium para tratamientos exclusivos'
    },
    {
      url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
      title: 'Zona de Hidroterapia',
      alt: 'Hidroterapia',
      description: 'Instalaciones de terapia acuática'
    }
  ];

  openImageModal(index: number): void {
    // In a real app, this would open a modal or lightbox
    console.log('Opening image modal for index:', index);
    alert(`Abriendo imagen: ${this.mockImages[index].title}`);
  }
}