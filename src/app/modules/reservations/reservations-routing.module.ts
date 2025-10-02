import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReservationsScreenComponent } from '../../scripts/reservations-screen/reservations-screen.component';

const routes: Routes = [
  {
    path: '',
    component: ReservationsScreenComponent,
    data: { title: 'Reservas - Country SPA' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservationsRoutingModule { }