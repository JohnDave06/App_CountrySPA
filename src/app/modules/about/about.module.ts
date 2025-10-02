import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutRoutingModule } from './about-routing.module';
import { AboutScreenComponent } from '../../scripts/about-screen/about-screen.component';

@NgModule({
  declarations: [
    AboutScreenComponent
  ],
  imports: [
    CommonModule,
    AboutRoutingModule
  ]
})
export class AboutModule { }