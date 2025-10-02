import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminScreenComponent } from './scripts/admin-screen/admin-screen.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'services',
    loadChildren: () => import('./modules/services/services.module').then(m => m.ServicesModule)
  },
  {
    path: 'cabins',
    loadChildren: () => import('./modules/cabins/cabins.module').then(m => m.CabinsModule)
  },
  {
    path: 'reservations',
    loadChildren: () => import('./modules/reservations/reservations.module').then(m => m.ReservationsModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./modules/about/about.module').then(m => m.AboutModule)
  },
  {
    path: 'admin',
    component: AdminScreenComponent
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Enable for debugging
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
