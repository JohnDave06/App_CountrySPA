import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutScreenComponent } from '../../scripts/about-screen/about-screen.component';

const routes: Routes = [
  {
    path: '',
    component: AboutScreenComponent,
    data: { title: 'Nosotros - Country SPA' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AboutRoutingModule { }