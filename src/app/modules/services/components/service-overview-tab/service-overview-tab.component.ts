import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-service-overview-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="service-overview-tab">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Service Information -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Información del Servicio</h3>
            
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="font-medium">Duración:</span>
                <span>{{ serviceData?.duration || 90 }} minutos</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Precio:</span>
                <span class="text-primary font-bold">\${{ serviceData?.price || 150 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Categoría:</span>
                <span class="badge badge-primary">{{ serviceData?.category || 'Masajes' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Calificación:</span>
                <div class="rating rating-sm">
                  <input type="radio" name="rating-overview" class="mask mask-star-2 bg-orange-400" 
                         [checked]="(serviceData?.rating || 4.8) >= 1" readonly />
                  <input type="radio" name="rating-overview" class="mask mask-star-2 bg-orange-400" 
                         [checked]="(serviceData?.rating || 4.8) >= 2" readonly />
                  <input type="radio" name="rating-overview" class="mask mask-star-2 bg-orange-400" 
                         [checked]="(serviceData?.rating || 4.8) >= 3" readonly />
                  <input type="radio" name="rating-overview" class="mask mask-star-2 bg-orange-400" 
                         [checked]="(serviceData?.rating || 4.8) >= 4" readonly />
                  <input type="radio" name="rating-overview" class="mask mask-star-2 bg-orange-400" 
                         [checked]="(serviceData?.rating || 4.8) >= 5" readonly />
                </div>
                <span class="text-sm text-base-content/70">{{ serviceData?.rating || 4.8 }}/5</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Disponibilidad:</span>
                <span class="badge" 
                      [class]="(serviceData?.availability !== false) ? 'badge-success' : 'badge-error'">
                  {{ (serviceData?.availability !== false) ? 'Disponible' : 'No Disponible' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Description -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Descripción</h3>
            <p class="text-base-content/80 leading-relaxed">
              {{ serviceData?.description || 'Un masaje corporal completo que combina técnicas de relajación profunda con aromaterapia para liberar tensiones y restaurar el equilibrio energético. Nuestros terapeutas especializados utilizan aceites esenciales naturales y técnicas tradicionales para brindar una experiencia única de bienestar.' }}
            </p>
          </div>
        </div>

        <!-- Benefits -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Beneficios</h3>
            <ul class="space-y-2">
              <li *ngFor="let benefit of getBenefits()" class="flex items-start">
                <span class="text-success mr-2">✓</span>
                <span>{{ benefit }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Requirements -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Requerimientos</h3>
            <ul class="space-y-2">
              <li *ngFor="let requirement of getRequirements()" class="flex items-start">
                <span class="text-warning mr-2">⚠️</span>
                <span class="text-sm">{{ requirement }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Route Information -->
      <div class="card bg-info text-info-content mt-6">
        <div class="card-body">
          <h3 class="card-title">Información de Ruta</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="font-medium">Ruta Actual:</span>
              <div class="font-mono">{{ getCurrentRoute() }}</div>
            </div>
            <div>
              <span class="font-medium">Parámetros:</span>
              <div class="font-mono">{{ getRouteParams() }}</div>
            </div>
            <div>
              <span class="font-medium">Tab Activo:</span>
              <div class="font-mono">{{ getActiveTab() }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-overview-tab {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .rating input[readonly] {
      pointer-events: none;
    }
  `]
})
export class ServiceOverviewTabComponent implements OnInit {
  serviceData: any;
  routeData: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get service data from parent route resolver
    this.serviceData = this.route.parent?.snapshot.data['service'];
    this.routeData = this.route.snapshot.data;
  }

  getBenefits(): string[] {
    return this.serviceData?.benefits || [
      'Reduce el estrés y la ansiedad',
      'Mejora la circulación sanguínea',
      'Alivia dolores musculares',
      'Promueve la relajación profunda',
      'Mejora la calidad del sueño'
    ];
  }

  getRequirements(): string[] {
    return this.serviceData?.requirements || [
      'No haber comido en las últimas 2 horas',
      'Informar sobre alergias o condiciones médicas',
      'Llegar 15 minutos antes de la cita',
      'Usar ropa cómoda y fácil de quitar'
    ];
  }

  getCurrentRoute(): string {
    return this.route.snapshot.url.map(segment => segment.path).join('/');
  }

  getRouteParams(): string {
    const params = this.route.parent?.snapshot.params;
    return params ? JSON.stringify(params) : '{}';
  }

  getActiveTab(): string {
    return this.routeData?.tab || 'overview';
  }
}