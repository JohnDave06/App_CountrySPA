import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdminScreenComponent } from './admin-screen.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    AdminScreenComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    AdminScreenComponent
  ]
})
export class AdminModule { }