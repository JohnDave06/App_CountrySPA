import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, AdminGuard, PermissionGuard, DataPreloadGuard } from '../../core/guards/route-guards.service';
import { ServiceResolver, DashboardDataResolver } from '../../core/resolvers/data-resolvers.service';

// Lazy load child components
const ServicesScreenComponent = () => import('../../scripts/services-screen/services-screen.component').then(m => m.ServicesScreenComponent);
const ServiceDetailComponent = () => import('./components/service-detail/service-detail.component').then(m => m.ServiceDetailComponent);
const ServiceBookingComponent = () => import('./components/service-booking/service-booking.component').then(m => m.ServiceBookingComponent);
const ServiceManagementComponent = () => import('./components/service-management/service-management.component').then(m => m.ServiceManagementComponent);
const ServiceAnalyticsComponent = () => import('./components/service-analytics/service-analytics.component').then(m => m.ServiceAnalyticsComponent);

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: ServicesScreenComponent,
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
        loadComponent: ServicesScreenComponent,
        data: { 
          title: 'Servicios por Categoría',
          description: 'Servicios filtrados por categoría específica',
          requiresAuth: false
        },
        canActivate: [PermissionGuard],
        data: {
          permissions: ['view-services']
        }
      },
      {
        path: 'detail/:id',
        loadComponent: ServiceDetailComponent,
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
            loadComponent: () => import('./components/service-overview/service-overview.component').then(m => m.ServiceOverviewComponent),
            data: { 
              title: 'Vista General',
              tab: 'overview'
            }
          },
          {
            path: 'booking',
            loadComponent: ServiceBookingComponent,
            data: { 
              title: 'Reservar Servicio',
              tab: 'booking',
              requiresAuth: true
            },
            canActivate: [AuthGuard, PermissionGuard],
            data: {
              permissions: ['book-service']
            }
          },
          {
            path: 'reviews',
            loadComponent: () => import('./components/service-reviews/service-reviews.component').then(m => m.ServiceReviewsComponent),
            data: { 
              title: 'Reseñas y Calificaciones',
              tab: 'reviews'
            }
          },
          {
            path: 'gallery',
            loadComponent: () => import('./components/service-gallery/service-gallery.component').then(m => m.ServiceGalleryComponent),
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
            loadComponent: () => import('./components/booking-list/booking-list.component').then(m => m.BookingListComponent),
            data: { 
              title: 'Mis Reservas',
              description: 'Gestiona tus reservas de servicios',
              requiresAuth: true
            },
            canActivate: [AuthGuard, PermissionGuard],
            data: {
              permissions: ['view-bookings']
            }
          },
          {
            path: 'new/:serviceId',
            loadComponent: ServiceBookingComponent,
            data: { 
              title: 'Nueva Reserva',
              description: 'Crear una nueva reserva de servicio',
              requiresAuth: true
            },
            canActivate: [AuthGuard, PermissionGuard],
            resolve: {
              service: ServiceResolver
            },
            data: {
              permissions: ['book-service']
            }
          },
          {
            path: 'details/:bookingId',
            loadComponent: () => import('./components/booking-details/booking-details.component').then(m => m.BookingDetailsComponent),
            data: { 
              title: 'Detalles de Reserva',
              description: 'Ver detalles completos de la reserva',
              requiresAuth: true
            },
            canActivate: [AuthGuard]
          },
          {
            path: 'modify/:bookingId',
            loadComponent: () => import('./components/booking-modify/booking-modify.component').then(m => m.BookingModifyComponent),
            data: { 
              title: 'Modificar Reserva',
              description: 'Modificar una reserva existente',
              requiresAuth: true
            },
            canActivate: [AuthGuard, PermissionGuard],
            data: {
              permissions: ['modify-booking']
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
            loadComponent: ServiceManagementComponent,
            data: { 
              title: 'Panel de Gestión',
              permissions: ['manage-services']
            }
          },
          {
            path: 'create',
            loadComponent: () => import('./components/service-create/service-create.component').then(m => m.ServiceCreateComponent),
            data: { 
              title: 'Crear Nuevo Servicio',
              permissions: ['create-service']
            },
            canActivate: [PermissionGuard]
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./components/service-edit/service-edit.component').then(m => m.ServiceEditComponent),
            data: { 
              title: 'Editar Servicio',
              permissions: ['edit-service']
            },
            canActivate: [PermissionGuard],
            resolve: {
              service: ServiceResolver
            }
          },
          {
            path: 'analytics',
            loadComponent: ServiceAnalyticsComponent,
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
                loadComponent: () => import('./components/analytics-overview/analytics-overview.component').then(m => m.AnalyticsOverviewComponent),
                data: { title: 'Vista General de Analíticas' }
              },
              {
                path: 'bookings',
                loadComponent: () => import('./components/analytics-bookings/analytics-bookings.component').then(m => m.AnalyticsBookingsComponent),
                data: { title: 'Analíticas de Reservas' }
              },
              {
                path: 'revenue',
                loadComponent: () => import('./components/analytics-revenue/analytics-revenue.component').then(m => m.AnalyticsRevenueComponent),
                data: { title: 'Analíticas de Ingresos' }
              }
            ]
          },
          {
            path: 'settings',
            loadComponent: () => import('./components/service-settings/service-settings.component').then(m => m.ServiceSettingsComponent),
            data: { 
              title: 'Configuración de Servicios',
              permissions: ['manage-settings']
            },
            canActivate: [PermissionGuard]
          }
        ]
      },
      {
        path: 'search',
        children: [
          {
            path: '',
            loadComponent: () => import('./components/service-search/service-search.component').then(m => m.ServiceSearchComponent),
            data: { 
              title: 'Buscar Servicios',
              description: 'Encuentra el servicio perfecto para ti'
            }
          },
          {
            path: 'results',
            loadComponent: () => import('./components/search-results/search-results.component').then(m => m.SearchResultsComponent),
            data: { 
              title: 'Resultados de Búsqueda',
              description: 'Servicios encontrados según tu búsqueda'
            }
          },
          {
            path: 'advanced',
            loadComponent: () => import('./components/advanced-search/advanced-search.component').then(m => m.AdvancedSearchComponent),
            data: { 
              title: 'Búsqueda Avanzada',
              description: 'Opciones avanzadas de filtrado y búsqueda'
            }
          }
        ]
      },
      {
        path: 'favorites',
        loadComponent: () => import('./components/favorite-services/favorite-services.component').then(m => m.FavoriteServicesComponent),
        data: { 
          title: 'Servicios Favoritos',
          description: 'Tus servicios preferidos guardados',
          requiresAuth: true
        },
        canActivate: [AuthGuard]
      },
      {
        path: 'comparison',
        loadComponent: () => import('./components/service-comparison/service-comparison.component').then(m => m.ServiceComparisonComponent),
        data: { 
          title: 'Comparar Servicios',
          description: 'Compara diferentes servicios lado a lado'
        }
      },
      {
        path: 'packages',
        children: [
          {
            path: '',
            loadComponent: () => import('./components/service-packages/service-packages.component').then(m => m.ServicePackagesComponent),
            data: { 
              title: 'Paquetes de Servicios',
              description: 'Paquetes combinados con descuentos especiales'
            }
          },
          {
            path: 'detail/:packageId',
            loadComponent: () => import('./components/package-detail/package-detail.component').then(m => m.PackageDetailComponent),
            data: { 
              title: 'Detalle del Paquete',
              description: 'Información completa del paquete seleccionado'
            }
          },
          {
            path: 'customize',
            loadComponent: () => import('./components/package-customize/package-customize.component').then(m => m.PackageCustomizeComponent),
            data: { 
              title: 'Personalizar Paquete',
              description: 'Crea tu paquete personalizado de servicios',
              requiresAuth: true
            },
            canActivate: [AuthGuard]
          }
        ]
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('../../shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    data: { 
      title: 'Página No Encontrada',
      description: 'La página que buscas no existe'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule { }