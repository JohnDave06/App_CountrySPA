import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CabinsRoutingModule } from './cabins-routing.module';
import { CabinsScreenComponent } from '../../scripts/cabins-screen/cabins-screen.component';

@NgModule({
  declarations: [
    CabinsScreenComponent
  ],
  imports: [
    CommonModule,
    CabinsRoutingModule,
    FormsModule
  ]
})
export class CabinsModule { }
