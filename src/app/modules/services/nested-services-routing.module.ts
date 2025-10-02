import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, AdminGuard, PermissionGuard, DataPreloadGuard } from '../../core/guards/route-guards.service';
import { ServiceResolver, DashboardDataResolver } from '../../core/resolvers/data-resolvers.service';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('../../scripts/services-screen/services-screen.component').then(m => m.ServicesScreenComponent),
        data: { 
          title: 'Servicios de Spa',
          description: 'Explora nuestros servicios de relajación y bienestar',
          requiresAuth: false,
          preload: true
        },
        canActivate: [DataPreloadGuard],
        resolve: {
          dashboardData: DashboardDataResolver
        }
      },
      {
        path: 'category/:category',
        loadComponent: () => import('../../scripts/services-screen/services-screen.component').then(m => m.ServicesScreenComponent),
        data: { 
          title: 'Servicios por Categoría',
          description: 'Servicios filtrados por categoría específica',
          requiresAuth: false,
          permissions: ['view-services']
        },
        canActivate: [PermissionGuard]
      },
      {
        path: 'detail/:id',
        loadComponent: () => import('./components/service-detail-container/service-detail-container.component').then(m => m.ServiceDetailContainerComponent),
        data: { 
          title: 'Detalle del Servicio',
          description: 'Información detallada del servicio seleccionado',
          requiresAuth: false
        },
        resolve: {
          service: ServiceResolver
        },
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            loadComponent: () => import('./components/service-overview-tab/service-overview-tab.component').then(m => m.ServiceOverviewTabComponent),
            data: { 
              title: 'Vista General',
              tab: 'overview'
            }
          },
          {
            path: 'booking',
            loadComponent: () => import('./components/service-booking-tab/service-booking-tab.component').then(m => m.ServiceBookingTabComponent),
            data: { 
              title: 'Reservar Servicio',
              tab: 'booking',
              requiresAuth: true,
              permissions: ['book-service']
            },
            canActivate: [AuthGuard, PermissionGuard]
          },
          {
            path: 'reviews',
            loadComponent: () => import('./components/service-reviews-tab/service-reviews-tab.component').then(m => m.ServiceReviewsTabComponent),
            data: { 
              title: 'Reseñas y Calificaciones',
              tab: 'reviews'
            }
          },
          {
            path: 'gallery',
            loadComponent: () => import('./components/service-gallery-tab/service-gallery-tab.component').then(m => m.ServiceGalleryTabComponent),
            data: { 
              title: 'Galería de Imágenes',
              tab: 'gallery'
            }
          }
        ]
      },
      {
        path: 'booking',
        children: [
          {
            path: '',
            loadComponent: () => import('./components/booking-list-container/booking-list-container.component').then(m => m.BookingListContainerComponent),
            data: { 
              title: 'Mis Reservas',
              description: 'Gestiona tus reservas de servicios',
              requiresAuth: true,
              permissions: ['view-bookings']
            },
            canActivate: [AuthGuard, PermissionGuard]
          },
          {
            path: 'new/:serviceId',
            loadComponent: () => import('./components/new-booking-container/new-booking-container.component').then(m => m.NewBookingContainerComponent),
            data: { 
              title: 'Nueva Reserva',
              description: 'Crear una nueva reserva de servicio',
              requiresAuth: true,
              permissions: ['book-service']
            },
            canActivate: [AuthGuard, PermissionGuard],
            resolve: {
              service: ServiceResolver
            }
          }
        ]
      },
      {
        path: 'management',
        data: { 
          title: 'Gestión de Servicios',
          description: 'Panel de administración de servicios',
          requiresAuth: true
        },
        canActivate: [AuthGuard, AdminGuard],
        canActivateChild: [AdminGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./components/management-dashboard/management-dashboard.component').then(m => m.ManagementDashboardComponent),
            data: { 
              title: 'Panel de Gestión',
              permissions: ['manage-services']
            }
          },
          {
            path: 'analytics',
            loadComponent: () => import('./components/management-analytics/management-analytics.component').then(m => m.ManagementAnalyticsComponent),
            data: { 
              title: 'Analíticas de Servicios',
              permissions: ['view-analytics']
            },
            canActivate: [PermissionGuard],
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./components/analytics-overview-tab/analytics-overview-tab.component').then(m => m.AnalyticsOverviewTabComponent),
                data: { title: 'Vista General de Analíticas' }
              },
              {
                path: 'bookings',
                loadComponent: () => import('./components/analytics-bookings-tab/analytics-bookings-tab.component').then(m => m.AnalyticsBookingsTabComponent),
                data: { title: 'Analíticas de Reservas' }
              },
              {
                path: 'revenue',
                loadComponent: () => import('./components/analytics-revenue-tab/analytics-revenue-tab.component').then(m => m.AnalyticsRevenueTabComponent),
                data: { title: 'Analíticas de Ingresos' }
              }
            ]
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NestedServicesRoutingModule { }