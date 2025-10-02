import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { NavbarComponent } from './partials/navbar/navbar.component';
import { FooterComponent } from './partials/footer/footer.component';
import { PageHeaderComponent } from './partials/page-header/page-header.component';
import { SidenavComponent } from './partials/sidenav/sidenav.component';
import { HomeScreenComponent } from './scripts/home-screen/home-screen.component';
import { LoginScreenComponent } from './scripts/login-screen/login-screen.component';
import { AdminModule } from './scripts/admin-screen/admin.module';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    PageHeaderComponent,
    SidenavComponent,
    HomeScreenComponent,
    LoginScreenComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CoreModule,
    AdminModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
