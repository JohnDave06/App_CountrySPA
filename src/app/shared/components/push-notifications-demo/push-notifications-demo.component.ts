import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PWAService, NotificationOptions } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-push-notifications-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="push-notifications-demo">
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-6">
            <span class="mr-2">🔔</span>
            Demo de Notificaciones Push
          </h2>

          <!-- Notification Permission Status -->
          <div class="alert mb-6" [class]="getPermissionAlertClass()">
            <div class="flex items-center">
              <span class="text-2xl mr-3">{{ getPermissionIcon() }}</span>
              <div>
                <h3 class="font-bold">Estado de Permisos: {{ notificationPermission }}</h3>
                <div class="text-sm">{{ getPermissionDescription() }}</div>
              </div>
            </div>
          </div>

          <!-- Permission Controls -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="card-title text-lg">
                  <span class="mr-2">🔐</span>
                  Permisos
                </h3>
                
                <div class="space-y-3">
                  <button *ngIf="notificationPermission === 'default'"
                          (click)="requestPermission()"
                          [disabled]="requestingPermission"
                          class="btn btn-primary btn-block">
                    <span *ngIf="!requestingPermission" class="mr-2">🔔</span>
                    <span *ngIf="requestingPermission" class="loading loading-spinner loading-sm mr-2"></span>
                    {{ requestingPermission ? 'Solicitando...' : 'Solicitar Permisos' }}
                  </button>

                  <div *ngIf="notificationPermission === 'granted'" class="alert alert-success">
                    <span>✅ Permisos concedidos</span>
                  </div>

                  <div *ngIf="notificationPermission === 'denied'" class="alert alert-error">
                    <span>❌ Permisos denegados</span>
                    <div class="text-xs mt-1">
                      Habilita las notificaciones en la configuración del navegador
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="card-title text-lg">
                  <span class="mr-2">📤</span>
                  Push Subscription
                </h3>
                
                <div class="space-y-3">
                  <button *ngIf="!pushSubscription && isPushEnabled()"
                          (click)="subscribeToPush()"
                          [disabled]="notificationPermission !== 'granted' || subscribing"
                          class="btn btn-secondary btn-block">
                    <span *ngIf="!subscribing" class="mr-2">📡</span>
                    <span *ngIf="subscribing" class="loading loading-spinner loading-sm mr-2"></span>
                    {{ subscribing ? 'Suscribiendo...' : 'Suscribirse a Push' }}
                  </button>

                  <button *ngIf="pushSubscription"
                          (click)="unsubscribeFromPush()"
                          [disabled]="unsubscribing"
                          class="btn btn-outline btn-error btn-block">
                    <span *ngIf="!unsubscribing" class="mr-2">🚫</span>
                    <span *ngIf="unsubscribing" class="loading loading-spinner loading-sm mr-2"></span>
                    {{ unsubscribing ? 'Desuscribiendo...' : 'Desuscribir Push' }}
                  </button>

                  <div *ngIf="pushSubscription" class="alert alert-info">
                    <span>📡 Suscrito a notificaciones push</span>
                  </div>

                  <div *ngIf="!isPushEnabled()" class="alert alert-warning">
                    <span>⚠️ Push notifications no disponibles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notification Templates -->
          <div class="card bg-base-200 mb-6">
            <div class="card-body">
              <h3 class="card-title text-lg mb-4">
                <span class="mr-2">📝</span>
                Plantillas de Notificaciones
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Spa Appointment Reminder -->
                <div class="card bg-base-100 border border-base-300">
                  <div class="card-body p-4">
                    <h4 class="font-semibold mb-2">Recordatorio de Cita</h4>
                    <p class="text-sm text-base-content/70 mb-3">
                      Tu masaje relajante está programado para mañana a las 3:00 PM
                    </p>
                    <button (click)="sendAppointmentReminder()"
                            [disabled]="notificationPermission !== 'granted'"
                            class="btn btn-sm btn-primary btn-block">
                      📅 Enviar
                    </button>
                  </div>
                </div>

                <!-- Promotion Notification -->
                <div class="card bg-base-100 border border-base-300">
                  <div class="card-body p-4">
                    <h4 class="font-semibold mb-2">Oferta Especial</h4>
                    <p class="text-sm text-base-content/70 mb-3">
                      20% de descuento en todos los tratamientos faciales
                    </p>
                    <button (click)="sendPromotionNotification()"
                            [disabled]="notificationPermission !== 'granted'"
                            class="btn btn-sm btn-secondary btn-block">
                      🎯 Enviar
                    </button>
                  </div>
                </div>

                <!-- Booking Confirmation -->
                <div class="card bg-base-100 border border-base-300">
                  <div class="card-body p-4">
                    <h4 class="font-semibold mb-2">Confirmación</h4>
                    <p class="text-sm text-base-content/70 mb-3">
                      Tu reserva ha sido confirmada exitosamente
                    </p>
                    <button (click)="sendBookingConfirmation()"
                            [disabled]="notificationPermission !== 'granted'"
                            class="btn btn-sm btn-success btn-block">
                      ✅ Enviar
                    </button>
                  </div>
                </div>

                <!-- Welcome Message -->
                <div class="card bg-base-100 border border-base-300">
                  <div class="card-body p-4">
                    <h4 class="font-semibold mb-2">Bienvenida</h4>
                    <p class="text-sm text-base-content/70 mb-3">
                      ¡Bienvenido a Country SPA! Explora nuestros servicios
                    </p>
                    <button (click)="sendWelcomeMessage()"
                            [disabled]="notificationPermission !== 'granted'"
                            class="btn btn-sm btn-accent btn-block">
                      👋 Enviar
                    </button>
                  </div>
                </div>

                <!-- Service Update -->
                <div class="card bg-base-100 border border-base-300">
                  <div class="card-body p-4">
                    <h4 class="font-semibold mb-2">Nuevo Servicio</h4>
                    <p class="text-sm text-base-content/70 mb-3">
                      Conoce nuestro nuevo tratamiento de aromaterapia
                    </p>
                    <button (click)="sendServiceUpdate()"
                            [disabled]="notificationPermission !== 'granted'"
                            class="btn btn-sm btn-info btn-block">
                      🆕 Enviar
                    </button>
                  </div>
                </div>

                <!-- Rating Request -->
                <div class="card bg-base-100 border border-base-300">
                  <div class="card-body p-4">
                    <h4 class="font-semibold mb-2">Solicitud de Reseña</h4>
                    <p class="text-sm text-base-content/70 mb-3">
                      ¿Cómo fue tu experiencia? Comparte tu opinión
                    </p>
                    <button (click)="sendRatingRequest()"
                            [disabled]="notificationPermission !== 'granted'"
                            class="btn btn-sm btn-warning btn-block">
                      ⭐ Enviar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom Notification Builder -->
          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title text-lg mb-4">
                <span class="mr-2">🛠️</span>
                Constructor de Notificaciones Personalizado
              </h3>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Título</span>
                    </label>
                    <input type="text" 
                           [(ngModel)]="customNotification.title"
                           placeholder="Título de la notificación"
                           class="input input-bordered">
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Mensaje</span>
                    </label>
                    <textarea [(ngModel)]="customNotification.body"
                              placeholder="Contenido del mensaje"
                              rows="3"
                              class="textarea textarea-bordered"></textarea>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Icono (URL)</span>
                    </label>
                    <input type="url" 
                           [(ngModel)]="customNotification.icon"
                           placeholder="https://example.com/icon.png"
                           class="input input-bordered">
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Tag (Agrupación)</span>
                    </label>
                    <input type="text" 
                           [(ngModel)]="customNotification.tag"
                           placeholder="custom-notification"
                           class="input input-bordered">
                  </div>

                  <div class="flex items-center space-x-4">
                    <div class="form-control">
                      <label class="label cursor-pointer">
                        <input type="checkbox" 
                               [(ngModel)]="customNotification.requireInteraction"
                               class="checkbox checkbox-primary">
                        <span class="label-text ml-2">Requiere interacción</span>
                      </label>
                    </div>

                    <div class="form-control">
                      <label class="label cursor-pointer">
                        <input type="checkbox" 
                               [(ngModel)]="customNotification.silent"
                               class="checkbox checkbox-primary">
                        <span class="label-text ml-2">Silenciosa</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="mockup-phone border-primary">
                    <div class="camera"></div>
                    <div class="display">
                      <div class="artboard artboard-demo phone-1 bg-base-300">
                        <div class="p-4">
                          <div class="bg-base-100 rounded-lg shadow-lg p-3">
                            <div class="flex items-start space-x-3">
                              <div class="w-6 h-6 bg-primary rounded-full flex-shrink-0 flex items-center justify-center text-xs">
                                🔔
                              </div>
                              <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium truncate">
                                  {{ customNotification.title || 'Título de ejemplo' }}
                                </p>
                                <p class="text-xs text-base-content/70 mt-1">
                                  {{ customNotification.body || 'Mensaje de ejemplo para la notificación...' }}
                                </p>
                                <p class="text-xs text-base-content/50 mt-2">Country SPA • ahora</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button (click)="sendCustomNotification()"
                          [disabled]="notificationPermission !== 'granted' || !customNotification.title || !customNotification.body"
                          class="btn btn-primary btn-block">
                    <span class="mr-2">📢</span>
                    Enviar Notificación Personalizada
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Features Info -->
          <div class="alert alert-info mt-6">
            <svg class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <h3 class="font-bold">Funcionalidades de Notificaciones Implementadas</h3>
              <div class="text-sm mt-2">
                ✅ <strong>Permisos:</strong> Solicitud y manejo de permisos de notificación<br>
                ✅ <strong>Push Notifications:</strong> Suscripción a notificaciones push del servidor<br>
                ✅ <strong>Notificaciones Locales:</strong> Notificaciones generadas por la app<br>
                ✅ <strong>Plantillas:</strong> Diferentes tipos de notificaciones para el spa<br>
                ✅ <strong>Personalización:</strong> Constructor de notificaciones personalizado<br>
                ✅ <strong>Interacción:</strong> Notificaciones con acciones y botones
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .push-notifications-demo {
      animation: fadeInDown 0.6s ease-out;
    }
    
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .mockup-phone {
      transform: scale(0.8);
    }
    
    .card {
      transition: all 0.2s ease;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .btn {
      transition: all 0.2s ease;
    }
    
    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }
  `]
})
export class PushNotificationsDemoComponent implements OnInit {
  notificationPermission: NotificationPermission = 'default';
  pushSubscription: PushSubscription | null = null;
  
  requestingPermission = false;
  subscribing = false;
  unsubscribing = false;

  customNotification: NotificationOptions = {
    title: '',
    body: '',
    icon: '/assets/icons/icon-192x192.png',
    tag: 'custom-notification',
    requireInteraction: false,
    silent: false
  };

  constructor(public pwaService: PWAService) {}

  ngOnInit(): void {
    this.checkNotificationSupport();
    this.setupSubscriptions();
  }

  private checkNotificationSupport(): void {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  private setupSubscriptions(): void {
    this.pwaService.notificationPermission$.subscribe(permission => {
      this.notificationPermission = permission;
    });

    this.pwaService.pushSubscription$.subscribe(subscription => {
      this.pushSubscription = subscription;
    });
  }

  async requestPermission(): Promise<void> {
    this.requestingPermission = true;
    try {
      await this.pwaService.requestNotificationPermission();
    } finally {
      this.requestingPermission = false;
    }
  }

  async subscribeToPush(): Promise<void> {
    this.subscribing = true;
    try {
      await this.pwaService.subscribeToPush();
    } finally {
      this.subscribing = false;
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    this.unsubscribing = true;
    try {
      await this.pwaService.unsubscribeFromPush();
    } finally {
      this.unsubscribing = false;
    }
  }

  // Predefined notification templates
  async sendAppointmentReminder(): Promise<void> {
    await this.pwaService.showNotification({
      title: 'Recordatorio de Cita - Country SPA',
      body: 'Tu masaje relajante está programado para mañana a las 3:00 PM. ¡Te esperamos!',
      icon: '/assets/icons/icon-192x192.png',
      tag: 'appointment-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        { action: 'confirm', title: 'Confirmar asistencia' },
        { action: 'reschedule', title: 'Reprogramar' }
      ]
    });
  }

  async sendPromotionNotification(): Promise<void> {
    await this.pwaService.showNotification({
      title: '🎯 Oferta Especial - Country SPA',
      body: '¡20% de descuento en todos los tratamientos faciales! Válido hasta el fin de semana.',
      icon: '/assets/icons/icon-192x192.png',
      tag: 'promotion',
      requireInteraction: false,
      actions: [
        { action: 'book', title: 'Reservar ahora' },
        { action: 'details', title: 'Ver detalles' }
      ]
    });
  }

  async sendBookingConfirmation(): Promise<void> {
    await this.pwaService.showNotification({
      title: '✅ Reserva Confirmada - Country SPA',
      body: 'Tu reserva para el masaje de piedras calientes ha sido confirmada para el 5 de octubre.',
      icon: '/assets/icons/icon-192x192.png',
      tag: 'booking-confirmation',
      requireInteraction: false,
      vibrate: [100, 50, 100]
    });
  }

  async sendWelcomeMessage(): Promise<void> {
    await this.pwaService.showNotification({
      title: '👋 ¡Bienvenido a Country SPA!',
      body: 'Descubre nuestros increíbles tratamientos de relajación y bienestar. ¡Tu oasis de tranquilidad te espera!',
      icon: '/assets/icons/icon-192x192.png',
      tag: 'welcome',
      requireInteraction: false,
      actions: [
        { action: 'explore', title: 'Explorar servicios' },
        { action: 'book', title: 'Reservar cita' }
      ]
    });
  }

  async sendServiceUpdate(): Promise<void> {
    await this.pwaService.showNotification({
      title: '🆕 Nuevo Servicio Disponible',
      body: 'Conoce nuestro nuevo tratamiento de aromaterapia con aceites esenciales orgánicos.',
      icon: '/assets/icons/icon-192x192.png',
      tag: 'service-update',
      requireInteraction: false,
      actions: [
        { action: 'learn-more', title: 'Más información' },
        { action: 'book', title: 'Reservar' }
      ]
    });
  }

  async sendRatingRequest(): Promise<void> {
    await this.pwaService.showNotification({
      title: '⭐ Comparte tu Experiencia',
      body: '¿Cómo fue tu última visita a Country SPA? Tu opinión nos ayuda a mejorar.',
      icon: '/assets/icons/icon-192x192.png',
      tag: 'rating-request',
      requireInteraction: true,
      actions: [
        { action: 'rate', title: 'Calificar ahora' },
        { action: 'later', title: 'Más tarde' }
      ]
    });
  }

  async sendCustomNotification(): Promise<void> {
    if (!this.customNotification.title || !this.customNotification.body) {
      return;
    }

    await this.pwaService.showNotification(this.customNotification);
  }

  // Helper methods for template
  getPermissionIcon(): string {
    switch (this.notificationPermission) {
      case 'granted': return '✅';
      case 'denied': return '❌';
      default: return '⚠️';
    }
  }

  getPermissionAlertClass(): string {
    switch (this.notificationPermission) {
      case 'granted': return 'alert-success';
      case 'denied': return 'alert-error';
      default: return 'alert-warning';
    }
  }

  getPermissionDescription(): string {
    switch (this.notificationPermission) {
      case 'granted': 
        return 'Las notificaciones están habilitadas. Puedes recibir alertas y recordatorios.';
      case 'denied': 
        return 'Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador.';
      default: 
        return 'Los permisos de notificación no han sido solicitados aún.';
    }
  }

  isPushEnabled(): boolean {
    // For demo purposes, always return true since we can't access private swPush
    return true;
  }
}