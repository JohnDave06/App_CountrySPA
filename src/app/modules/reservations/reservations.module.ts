import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ReservationsRoutingModule } from './reservations-routing.module';
import { ReservationsScreenComponent } from '../../scripts/reservations-screen/reservations-screen.component';

@NgModule({
  declarations: [
    ReservationsScreenComponent
  ],
  imports: [
    CommonModule,
    ReservationsRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ReservationsModule { }