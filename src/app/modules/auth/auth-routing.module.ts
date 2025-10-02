import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginScreenComponent } from '../../scripts/login-screen/login-screen.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginScreenComponent,
    data: { title: 'Iniciar Sesión - Country SPA' }
  },
  // Futuras rutas de autenticación
  // {
  //   path: 'register',
  //   component: RegisterComponent,
  //   data: { title: 'Registro - Country SPA' }
  // },
  // {
  //   path: 'forgot-password',
  //   component: ForgotPasswordComponent,
  //   data: { title: 'Recuperar Contraseña - Country SPA' }
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
