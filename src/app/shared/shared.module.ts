import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ServiceCardComponent } from './components/service-card/service-card.component';
import { ServiceFilterComponent } from './components/service-filter/service-filter.component';
import { SignalsDemoComponent } from './components/signals-demo/signals-demo.component';
import { HttpDemoComponent } from './components/http-demo/http-demo.component';
import { RxjsDemoComponent } from './components/rxjs-demo/rxjs-demo.component';
import { CacheDemoComponent } from './components/cache-demo/cache-demo.component';
import { QueryParamsDemoComponent } from './components/query-params-demo/query-params-demo.component';
import { NestedRoutesDemoComponent } from './components/nested-routes-demo/nested-routes-demo.component';
import { PWAStatusComponent } from './components/pwa-status/pwa-status.component';
import { OfflineDemoComponent } from './components/offline-demo/offline-demo.component';
import { PushNotificationsDemoComponent } from './components/push-notifications-demo/push-notifications-demo.component';

@NgModule({
  declarations: [
    ServiceCardComponent,
    ServiceFilterComponent,
    SignalsDemoComponent,
    HttpDemoComponent,
    RxjsDemoComponent,
    CacheDemoComponent,
    QueryParamsDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NestedRoutesDemoComponent,
    PWAStatusComponent,
    OfflineDemoComponent,
    PushNotificationsDemoComponent
  ],
  exports: [
    ServiceCardComponent,
    ServiceFilterComponent,
    SignalsDemoComponent,
    HttpDemoComponent,
    RxjsDemoComponent,
    CacheDemoComponent,
    QueryParamsDemoComponent,
    NestedRoutesDemoComponent,
    PWAStatusComponent,
    OfflineDemoComponent,
    PushNotificationsDemoComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class SharedModule { }