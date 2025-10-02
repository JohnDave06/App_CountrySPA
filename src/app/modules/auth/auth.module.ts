import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginScreenComponent } from '../../scripts/login-screen/login-screen.component';

@NgModule({
  declarations: [
    // LoginScreenComponent se mantiene en app.module.ts por compatibilidad
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }
