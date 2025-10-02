import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HomeRoutingModule } from './home-routing.module';
import { HomeScreenComponent } from '../../scripts/home-screen/home-screen.component';

@NgModule({
  declarations: [
    // HomeScreenComponent se mantiene en app.module.ts por compatibilidad
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    FormsModule
  ]
})
export class HomeModule { }
