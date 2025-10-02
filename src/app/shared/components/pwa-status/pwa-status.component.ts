import { Component, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PWAService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pwa-status-container">
      <!-- PWA Status Card -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-6">
            <span class="mr-2">📱</span>
            Estado PWA (Progressive Web App)
          </h2>

          <!-- Connection Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-2xl">
                {{ pwaService.isOnline() ? '🌐' : '📶' }}
              </div>
              <div class="stat-title">Conexión</div>
              <div class="stat-value text-lg" 
                   [class]="pwaService.isOnline() ? 'text-success' : 'text-warning'">
                {{ pwaService.connectionStatus() }}
              </div>
              <div class="stat-desc">
                {{ pwaService.isOnline() ? 'Todas las funciones disponibles' : 'Modo offline activo' }}
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-2xl">
                {{ pwaService.swEnabled() ? '⚙️' : '❌' }}
              </div>
              <div class="stat-title">Service Worker</div>
              <div class="stat-value text-lg"
                   [class]="pwaService.swEnabled() ? 'text-success' : 'text-error'">
                {{ pwaService.swEnabled() ? 'Activo' : 'Inactivo' }}
              </div>
              <div class="stat-desc">
                {{ pwaService.swEnabled() ? 'Caché y offline funcionando' : 'Funciones limitadas' }}
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-2xl">
                {{ pwaService.isInstalled() ? '✅' : (pwaService.isInstallable() ? '📥' : '🌐') }}
              </div>
              <div class="stat-title">Instalación</div>
              <div class="stat-value text-lg"
                   [class]="getInstallStatusClass()">
                {{ getInstallStatusText() }}
              </div>
              <div class="stat-desc">
                {{ getInstallStatusDescription() }}
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-2xl">
                {{ pwaService.updateAvailable() ? '🔄' : '✅' }}
              </div>
              <div class="stat-title">Actualización</div>
              <div class="stat-value text-lg"
                   [class]="pwaService.updateAvailable() ? 'text-warning' : 'text-success'">
                {{ pwaService.updateAvailable() ? 'Disponible' : 'Al día' }}
              </div>
              <div class="stat-desc">
                {{ pwaService.updateAvailable() ? 'Nueva versión lista' : 'Versión actual' }}
              </div>
            </div>
          </div>

          <!-- PWA Actions -->
          <div class="flex flex-wrap gap-4 mb-6">
            <!-- Install Button -->
            <button *ngIf="pwaService.isInstallable()" 
                    (click)="installApp()"
                    [disabled]="installing"
                    class="btn btn-primary btn-lg">
              <span *ngIf="!installing" class="mr-2">📱</span>
              <span *ngIf="installing" class="loading loading-spinner loading-sm mr-2"></span>
              {{ installing ? 'Instalando...' : 'Instalar App' }}
            </button>

            <!-- Update Button -->
            <button *ngIf="pwaService.updateAvailable()" 
                    (click)="updateApp()"
                    [disabled]="updating"
                    class="btn btn-warning btn-lg">
              <span *ngIf="!updating" class="mr-2">🔄</span>
              <span *ngIf="updating" class="loading loading-spinner loading-sm mr-2"></span>
              {{ updating ? 'Actualizando...' : 'Actualizar App' }}
            </button>

            <!-- Check Updates Button -->
            <button (click)="checkForUpdates()"
                    [disabled]="checkingUpdates"
                    class="btn btn-outline">
              <span *ngIf="!checkingUpdates" class="mr-2">🔍</span>
              <span *ngIf="checkingUpdates" class="loading loading-spinner loading-sm mr-2"></span>
              {{ checkingUpdates ? 'Verificando...' : 'Verificar Actualizaciones' }}
            </button>
          </div>

          <!-- Notifications Section -->
          <div class="card bg-base-200 mb-6">
            <div class="card-body">
              <h3 class="card-title">
                <span class="mr-2">🔔</span>
                Notificaciones Push
              </h3>
              
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="font-medium">Estado de permisos</p>
                  <p class="text-sm text-base-content/70">
                    {{ getNotificationStatusText() }}
                  </p>
                </div>
                <div class="badge" [class]="getNotificationBadgeClass()">
                  {{ notificationPermission }}
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <button *ngIf="notificationPermission === 'default'"
                        (click)="requestNotificationPermission()"
                        class="btn btn-sm btn-primary">
                  Habilitar Notificaciones
                </button>

                <button *ngIf="notificationPermission === 'granted'"
                        (click)="subscribeToPush()"
                        [disabled]="!!pushSubscription"
                        class="btn btn-sm btn-secondary">
                  {{ pushSubscription ? 'Suscrito a Push' : 'Suscribirse a Push' }}
                </button>

                <button *ngIf="pushSubscription"
                        (click)="unsubscribeFromPush()"
                        class="btn btn-sm btn-outline btn-error">
                  Desuscribir Push
                </button>

                <button (click)="testNotification()"
                        [disabled]="notificationPermission !== 'granted'"
                        class="btn btn-sm btn-outline">
                  Probar Notificación
                </button>
              </div>
            </div>
          </div>

          <!-- Cache Information -->
          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title">
                <span class="mr-2">💾</span>
                Gestión de Caché
              </h3>
              
              <div class="overflow-x-auto mb-4">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Cache</th>
                      <th>Elementos</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let cache of cacheInfo">
                      <td class="font-mono text-sm">{{ cache.name }}</td>
                      <td>{{ cache.size }}</td>
                      <td>
                        <div class="badge badge-success badge-sm">Activo</div>
                      </td>
                    </tr>
                    <tr *ngIf="cacheInfo.length === 0">
                      <td colspan="3" class="text-center text-base-content/60">
                        No hay información de caché disponible
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex flex-wrap gap-2">
                <button (click)="refreshCacheInfo()"
                        [disabled]="loadingCache"
                        class="btn btn-sm btn-primary">
                  <span *ngIf="!loadingCache" class="mr-2">🔄</span>
                  <span *ngIf="loadingCache" class="loading loading-spinner loading-xs mr-2"></span>
                  {{ loadingCache ? 'Cargando...' : 'Actualizar Info' }}
                </button>

                <button (click)="clearCache()"
                        [disabled]="clearingCache"
                        class="btn btn-sm btn-outline btn-warning">
                  <span *ngIf="!clearingCache" class="mr-2">🗑️</span>
                  <span *ngIf="clearingCache" class="loading loading-spinner loading-xs mr-2"></span>
                  {{ clearingCache ? 'Limpiando...' : 'Limpiar Caché' }}
                </button>
              </div>
            </div>
          </div>

          <!-- PWA Features Demo -->
          <div class="alert alert-info mt-6">
            <svg class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <h3 class="font-bold">Funcionalidades PWA Implementadas</h3>
              <div class="text-sm mt-2">
                ✅ <strong>Service Worker:</strong> Caché inteligente y funcionalidad offline<br>
                ✅ <strong>Instalación:</strong> Instalar como app nativa en dispositivos<br>
                ✅ <strong>Notificaciones:</strong> Push notifications y notificaciones locales<br>
                ✅ <strong>Actualizaciones:</strong> Detección y aplicación automática de actualizaciones<br>
                ✅ <strong>Offline-first:</strong> Funciona sin conexión a internet<br>
                ✅ <strong>Responsive:</strong> Optimizado para móviles y tablets
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pwa-status-container {
      padding: 1rem;
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .stat {
      transition: all 0.2s ease;
    }
    
    .stat:hover {
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
export class PWAStatusComponent implements OnInit {
  installing = false;
  updating = false;
  checkingUpdates = false;
  loadingCache = false;
  clearingCache = false;

  notificationPermission: NotificationPermission = 'default';
  pushSubscription: PushSubscription | null = null;
  cacheInfo: { name: string; size: number }[] = [];

  constructor(public pwaService: PWAService) {
    // Effect to react to PWA state changes
    effect(() => {
      if (this.pwaService.updateAvailable()) {
        this.showUpdateToast();
      }
    });
  }

  ngOnInit(): void {
    this.initializeSubscriptions();
    this.refreshCacheInfo();
  }

  private initializeSubscriptions(): void {
    // Subscribe to notification permission changes
    this.pwaService.notificationPermission$.subscribe(permission => {
      this.notificationPermission = permission;
    });

    // Subscribe to push subscription changes
    this.pwaService.pushSubscription$.subscribe(subscription => {
      this.pushSubscription = subscription;
    });
  }

  async installApp(): Promise<void> {
    if (!this.pwaService.isInstallable()) return;

    this.installing = true;
    try {
      const result = await this.pwaService.installApp();
      if (result?.outcome === 'accepted') {
        await this.pwaService.showNotification({
          title: '¡App instalada!',
          body: 'Country SPA se instaló correctamente',
          tag: 'installation-success'
        });
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      this.installing = false;
    }
  }

  async updateApp(): Promise<void> {
    this.updating = true;
    try {
      await this.pwaService.updateApp();
    } catch (error) {
      console.error('Error updating app:', error);
    } finally {
      this.updating = false;
    }
  }

  async checkForUpdates(): Promise<void> {
    this.checkingUpdates = true;
    try {
      const updateFound = await this.pwaService.checkForUpdates();
      if (!updateFound) {
        await this.pwaService.showNotification({
          title: 'App actualizada',
          body: 'Ya tienes la versión más reciente',
          tag: 'update-check'
        });
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      this.checkingUpdates = false;
    }
  }

  async requestNotificationPermission(): Promise<void> {
    await this.pwaService.requestNotificationPermission();
  }

  async subscribeToPush(): Promise<void> {
    await this.pwaService.subscribeToPush();
  }

  async unsubscribeFromPush(): Promise<void> {
    await this.pwaService.unsubscribeFromPush();
  }

  async testNotification(): Promise<void> {
    await this.pwaService.showNotification({
      title: 'Notificación de prueba',
      body: 'Las notificaciones están funcionando correctamente',
      tag: 'test-notification',
      vibrate: [200, 100, 200]
    });
  }

  async refreshCacheInfo(): Promise<void> {
    this.loadingCache = true;
    try {
      this.cacheInfo = await this.pwaService.getCacheInfo();
    } catch (error) {
      console.error('Error getting cache info:', error);
    } finally {
      this.loadingCache = false;
    }
  }

  async clearCache(): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas limpiar toda la caché? Esto puede afectar el rendimiento.')) {
      return;
    }

    this.clearingCache = true;
    try {
      await this.pwaService.clearCaches();
      await this.refreshCacheInfo();
      await this.pwaService.showNotification({
        title: 'Caché limpiado',
        body: 'Todos los archivos en caché han sido eliminados',
        tag: 'cache-cleared'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      this.clearingCache = false;
    }
  }

  // Helper methods for template
  getInstallStatusClass(): string {
    if (this.pwaService.isInstalled()) return 'text-success';
    if (this.pwaService.isInstallable()) return 'text-warning';
    return 'text-info';
  }

  getInstallStatusText(): string {
    if (this.pwaService.isInstalled()) return 'Instalada';
    if (this.pwaService.isInstallable()) return 'Disponible';
    return 'Navegador';
  }

  getInstallStatusDescription(): string {
    if (this.pwaService.isInstalled()) return 'App funcionando como nativa';
    if (this.pwaService.isInstallable()) return 'Lista para instalar';
    return 'Funciona en navegador';
  }

  getNotificationStatusText(): string {
    switch (this.notificationPermission) {
      case 'granted': return 'Notificaciones habilitadas';
      case 'denied': return 'Notificaciones bloqueadas';
      default: return 'Permisos no solicitados';
    }
  }

  getNotificationBadgeClass(): string {
    switch (this.notificationPermission) {
      case 'granted': return 'badge-success';
      case 'denied': return 'badge-error';
      default: return 'badge-warning';
    }
  }

  private showUpdateToast(): void {
    // Show a toast notification about available update
    console.log('🔄 Nueva actualización disponible');
  }
}