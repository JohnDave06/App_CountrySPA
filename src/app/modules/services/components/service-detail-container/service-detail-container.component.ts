import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-service-detail-container',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="service-detail-container">
      <div class="card bg-base-100 shadow-lg mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            <span class="mr-2">🛁</span>
            {{ serviceData?.name || 'Servicio de Spa' }}
          </h2>
          
          <div class="tabs tabs-bordered mb-6">
            <a routerLink="overview" 
               routerLinkActive="tab-active" 
               class="tab tab-bordered">
              Vista General
            </a>
            <a routerLink="booking" 
               routerLinkActive="tab-active" 
               class="tab tab-bordered">
              Reservar
            </a>
            <a routerLink="reviews" 
               routerLinkActive="tab-active" 
               class="tab tab-bordered">
              Reseñas
            </a>
            <a routerLink="gallery" 
               routerLinkActive="tab-active" 
               class="tab tab-bordered">
              Galería
            </a>
          </div>

          <div class="service-detail-content">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-detail-container {
      padding: 1rem;
    }

    .tab-active {
      background-color: rgb(var(--primary));
      color: rgb(var(--primary-content));
    }

    .service-detail-content {
      min-height: 300px;
    }
  `]
})
export class ServiceDetailContainerComponent implements OnInit {
  serviceData: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.serviceData = this.route.snapshot.data['service'];
  }
}