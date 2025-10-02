import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeScreenComponent } from '../../scripts/home-screen/home-screen.component';

const routes: Routes = [
  {
    path: '',
    component: HomeScreenComponent,
    data: { title: 'Inicio - Country SPA' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
