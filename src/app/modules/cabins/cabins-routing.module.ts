import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CabinsScreenComponent } from '../../scripts/cabins-screen/cabins-screen.component';

const routes: Routes = [
  {
    path: '',
    component: CabinsScreenComponent,
    data: { title: 'Cabañas - Country SPA' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CabinsRoutingModule { }
