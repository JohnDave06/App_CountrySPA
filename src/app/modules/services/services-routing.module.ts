import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServicesScreenComponent } from '../../scripts/services-screen/services-screen.component';

const routes: Routes = [
  {
    path: '',
    children: [
      // Main services screen
      {
        path: '',
        component: ServicesScreenComponent,
        data: { title: 'Servicios - Country SPA' }
      },
      
      // Service detail with nested tabs
      {
        path: 'detail/:id',
        loadComponent: () => import('./components/service-detail-container/service-detail-container.component').then(m => m.ServiceDetailContainerComponent),
        data: { 
          title: 'Detalle del Servicio',
          description: 'Información detallada del servicio seleccionado'
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
            data: { title: 'Vista General', tab: 'overview' }
          },
          {
            path: 'booking',
            loadComponent: () => import('./components/service-booking-tab/service-booking-tab.component').then(m => m.ServiceBookingTabComponent),
            data: { title: 'Reservar Servicio', tab: 'booking' }
          },
          {
            path: 'reviews',
            loadComponent: () => import('./components/service-reviews-tab/service-reviews-tab.component').then(m => m.ServiceReviewsTabComponent),
            data: { title: 'Reseñas y Calificaciones', tab: 'reviews' }
          },
          {
            path: 'gallery',
            loadComponent: () => import('./components/service-gallery-tab/service-gallery-tab.component').then(m => m.ServiceGalleryTabComponent),
            data: { title: 'Galería de Imágenes', tab: 'gallery' }
          }
        ]
      },

      // Bookings management
      {
        path: 'bookings',
        children: [
          {
            path: '',
            loadComponent: () => import('./components/booking-list-container/booking-list-container.component').then(m => m.BookingListContainerComponent),
            data: { 
              title: 'Mis Reservas',
              description: 'Gestiona tus reservas de servicios'
            }
          }
        ]
      },

      // User profile with nested tabs
      {
        path: 'user-profile',
        loadComponent: () => import('./components/user-profile-container/user-profile-container.component').then(m => m.UserProfileContainerComponent),
        data: { 
          title: 'Perfil de Usuario',
          description: 'Gestiona tu información personal y preferencias'
        },
        children: [
          {
            path: '',
            redirectTo: 'info',
            pathMatch: 'full'
          },
          {
            path: 'info',
            loadComponent: () => import('./components/user-info-tab/user-info-tab.component').then(m => m.UserInfoTabComponent),
            data: { title: 'Información Personal', tab: 'info' }
          },
          {
            path: 'preferences',
            loadComponent: () => import('./components/user-preferences-tab/user-preferences-tab.component').then(m => m.UserPreferencesTabComponent),
            data: { title: 'Preferencias', tab: 'preferences' }
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
export class ServicesRoutingModule { }
