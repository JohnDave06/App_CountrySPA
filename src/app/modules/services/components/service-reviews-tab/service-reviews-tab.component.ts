import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-reviews-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="service-reviews-tab">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Reviews List -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold mb-4">Reseñas de Clientes</h3>
          
          <div *ngFor="let review of mockReviews" class="card bg-base-100 border border-base-300">
            <div class="card-body">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <div class="avatar placeholder mr-3">
                    <div class="bg-neutral-focus text-neutral-content rounded-full w-10">
                      <span>{{ review.author.charAt(0) }}</span>
                    </div>  
                  </div>
                  <div>
                    <div class="font-medium">{{ review.author }}</div>
                    <div class="text-sm text-base-content/60">{{ review.date }}</div>
                  </div>
                </div>
                <div class="rating rating-sm">
                  <span *ngFor="let star of [1,2,3,4,5]" 
                        class="mask mask-star-2"
                        [class]="star <= review.rating ? 'bg-orange-400' : 'bg-gray-300'">
                  </span>
                </div>
              </div>
              <p class="text-sm">{{ review.comment }}</p>
            </div>
          </div>
        </div>

        <!-- Rating Summary -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold mb-4">Resumen de Calificaciones</h3>
          
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body text-center">
              <div class="text-4xl font-bold text-primary mb-2">4.8</div>
              <div class="rating rating-lg mb-2">
                <span class="mask mask-star-2 bg-orange-400"></span>
                <span class="mask mask-star-2 bg-orange-400"></span>
                <span class="mask mask-star-2 bg-orange-400"></span>
                <span class="mask mask-star-2 bg-orange-400"></span>
                <span class="mask mask-star-2 bg-orange-400"></span>
              </div>
              <div class="text-sm text-base-content/60">Basado en 127 reseñas</div>
            </div>
          </div>

          <div class="card bg-info text-info-content">
            <div class="card-body">
              <h4 class="card-title text-sm">Demostración de Ruta Hija</h4>
              <p class="text-xs">
                Esta es una pestaña de ruta hija (child route) que se carga dentro del contenedor padre.
                URL: /services/detail/:id/reviews
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-reviews-tab {
      animation: fadeIn 0.3s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ServiceReviewsTabComponent {
  mockReviews = [
    {
      author: 'María González',
      rating: 5,
      date: '15 Sep 2025',
      comment: 'Excelente servicio, muy relajante. La terapeuta fue muy profesional y el ambiente perfecto.'
    },
    {
      author: 'Carlos Mendoza',
      rating: 4,
      date: '12 Sep 2025',
      comment: 'Muy buena experiencia, solo mejoraría la temperatura del ambiente.'
    },
    {
      author: 'Ana Rodríguez',
      rating: 5,
      date: '10 Sep 2025',
      comment: 'Increíble masaje, definitivamente regresaré. Vale cada peso.'
    }
  ];
}