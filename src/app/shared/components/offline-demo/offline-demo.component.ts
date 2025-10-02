import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineService, SyncQueueItem } from '../../../core/services/offline.service';
import { PWAService } from '../../../core/services/pwa.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-offline-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offline-demo-container">
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-6">
            <span class="mr-2">🔄</span>
            Demostración de Funcionalidad Offline
          </h2>

          <!-- Connection Status Banner -->
          <div class="alert mb-6" [class]="getConnectionAlertClass()">
            <div class="flex items-center">
              <span class="text-2xl mr-3">{{ pwaService.isOnline() ? '🌐' : '📶' }}</span>
              <div>
                <h3 class="font-bold">{{ getConnectionStatusTitle() }}</h3>
                <div class="text-sm">{{ getConnectionStatusDescription() }}</div>
              </div>
            </div>
          </div>

          <!-- Offline Storage Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-2xl">📦</div>
              <div class="stat-title">Datos Offline</div>
              <div class="stat-value text-lg text-primary">{{ storageInfo.totalItems }}</div>
              <div class="stat-desc">{{ formatBytes(storageInfo.totalSize) }} almacenados</div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-2xl">📤</div>
              <div class="stat-title">Cola de Sync</div>
              <div class="stat-value text-lg text-secondary">{{ offlineService.queueSize() }}</div>
              <div class="stat-desc">{{ getSyncStatusText() }}</div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-2xl">⏰</div>
              <div class="stat-title">Última Sync</div>
              <div class="stat-value text-sm text-accent">{{ getLastSyncText() }}</div>
              <div class="stat-desc">{{ getSyncProgressText() }}</div>
            </div>
          </div>

          <!-- Offline Data Management -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Store Data Section -->
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="card-title">
                  <span class="mr-2">💾</span>
                  Almacenar Datos Offline
                </h3>
                
                <div class="space-y-4">
                  <button (click)="storeServices()" 
                          [disabled]="loading"
                          class="btn btn-primary btn-block">
                    <span *ngIf="!loading" class="mr-2">📱</span>
                    <span *ngIf="loading" class="loading loading-spinner loading-sm mr-2"></span>
                    {{ loading ? 'Guardando...' : 'Guardar Servicios Offline' }}
                  </button>

                  <button (click)="storeUserData()"
                          [disabled]="loading"
                          class="btn btn-secondary btn-block">
                    <span class="mr-2">👤</span>
                    Guardar Datos de Usuario
                  </button>

                  <button (click)="storePreferences()"
                          [disabled]="loading"
                          class="btn btn-accent btn-block">
                    <span class="mr-2">⚙️</span>
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            </div>

            <!-- Sync Queue Section -->
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="card-title">
                  <span class="mr-2">🔄</span>
                  Cola de Sincronización
                </h3>
                
                <div class="space-y-4">
                  <button (click)="addBookingToQueue()"
                          class="btn btn-info btn-block">
                    <span class="mr-2">📅</span>
                    Simular Reserva Offline
                  </button>

                  <button (click)="addUpdateToQueue()"
                          class="btn btn-warning btn-block">
                    <span class="mr-2">✏️</span>
                    Simular Actualización
                  </button>

                  <button (click)="forceSyncNow()"
                          [disabled]="offlineService.syncInProgress() || !pwaService.isOnline()"
                          class="btn btn-success btn-block">
                    <span *ngIf="!offlineService.syncInProgress()" class="mr-2">⚡</span>
                    <span *ngIf="offlineService.syncInProgress()" class="loading loading-spinner loading-sm mr-2"></span>
                    {{ offlineService.syncInProgress() ? 'Sincronizando...' : 'Sincronizar Ahora' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Stored Data Display -->
          <div class="card bg-base-200 mb-6">
            <div class="card-body">
              <h3 class="card-title mb-4">
                <span class="mr-2">📋</span>
                Datos Almacenados Offline
              </h3>
              
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Clave</th>
                      <th>Tamaño</th>
                      <th>Edad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of storageInfo.items">
                      <td class="font-mono text-sm">{{ item.key }}</td>
                      <td>{{ formatBytes(item.size) }}</td>
                      <td>{{ formatAge(item.age) }}</td>
                      <td>
                        <button (click)="removeItem(item.key)" 
                                class="btn btn-ghost btn-xs text-error">
                          🗑️
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="storageInfo.items.length === 0">
                      <td colspan="4" class="text-center text-base-content/60">
                        No hay datos almacenados
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex justify-end mt-4 space-x-2">
                <button (click)="refreshStorageInfo()" 
                        class="btn btn-sm btn-primary">
                  🔄 Actualizar
                </button>
                <button (click)="clearAllOfflineData()" 
                        class="btn btn-sm btn-outline btn-error">
                  🗑️ Limpiar Todo
                </button>
              </div>
            </div>
          </div>

          <!-- Sync Queue Display -->
          <div class="card bg-base-200" *ngIf="syncQueueItems.length > 0">
            <div class="card-body">
              <h3 class="card-title mb-4">
                <span class="mr-2">📤</span>
                Cola de Sincronización ({{ syncQueueItems.length }} elementos)
              </h3>
              
              <div class="space-y-2">
                <div *ngFor="let item of syncQueueItems" 
                     class="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                  <div class="flex-1">
                    <div class="font-medium">{{ item.type | titlecase }} - {{ item.endpoint }}</div>
                    <div class="text-sm text-base-content/70">
                      Creado: {{ formatTimestamp(item.timestamp) }} | 
                      Intentos: {{ item.retries }}/{{ item.maxRetries }}
                    </div>
                  </div>
                  <div class="badge" [class]="getSyncItemBadgeClass(item)">
                    {{ item.retries === 0 ? 'Pendiente' : 'Reintentando' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Offline Features Demo -->
          <div class="alert alert-success mt-6">
            <svg class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <h3 class="font-bold">Funcionalidades Offline Implementadas</h3>
              <div class="text-sm mt-2">
                ✅ <strong>Almacenamiento Local:</strong> Datos persistentes en localStorage<br>
                ✅ <strong>Cola de Sincronización:</strong> Operaciones pendientes para cuando haya conexión<br>
                ✅ <strong>Offline-First:</strong> La app funciona completamente sin internet<br>
                ✅ <strong>Sync Automático:</strong> Sincronización automática al detectar conexión<br>
                ✅ <strong>Manejo de Errores:</strong> Reintentos automáticos con backoff<br>
                ✅ <strong>Gestión de Caché:</strong> Limpieza inteligente de datos antiguos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-demo-container {
      animation: slideInUp 0.5s ease-out;
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .stat {
      transition: all 0.3s ease;
    }
    
    .stat:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    
    .card {
      transition: all 0.2s ease;
    }
    
    .btn {
      transition: all 0.2s ease;
    }
    
    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }
  `]
})
export class OfflineDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = false;
  storageInfo = { totalItems: 0, totalSize: 0, items: [] as any[] };
  syncQueueItems: SyncQueueItem[] = [];

  constructor(
    public offlineService: OfflineService,
    public pwaService: PWAService
  ) {}

  ngOnInit(): void {
    this.refreshStorageInfo();
    this.setupSubscriptions();
    this.startPeriodicRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to sync queue changes
    this.offlineService.syncQueue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(queue => {
        this.syncQueueItems = queue;
      });
  }

  private startPeriodicRefresh(): void {
    // Refresh storage info every 10 seconds
    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshStorageInfo();
      });
  }

  // Connection status helpers
  getConnectionAlertClass(): string {
    return this.pwaService.isOnline() ? 'alert-success' : 'alert-warning';
  }

  getConnectionStatusTitle(): string {
    return this.pwaService.isOnline() ? 'Conectado' : 'Sin Conexión';
  }

  getConnectionStatusDescription(): string {
    if (this.pwaService.isOnline()) {
      return 'Todas las funcionalidades están disponibles. La sincronización está activa.';
    } else {
      return 'Funcionando en modo offline. Los datos se sincronizarán al recuperar la conexión.';
    }
  }

  // Storage management
  refreshStorageInfo(): void {
    this.storageInfo = this.offlineService.getStorageInfo();
  }

  async storeServices(): Promise<void> {
    this.loading = true;
    try {
      const mockServices = this.offlineService.getMockServices();
      this.offlineService.storeData('demo-services', mockServices, 3600000); // 1 hour
      await this.showSuccessMessage('Servicios guardados offline');
    } finally {
      this.loading = false;
      this.refreshStorageInfo();
    }
  }

  async storeUserData(): Promise<void> {
    const userData = {
      id: 'user-001',
      name: 'Usuario Demo',
      email: 'demo@countryspa.com',
      preferences: { theme: 'light', notifications: true },
      lastLogin: Date.now()
    };
    
    this.offlineService.storeData('user-profile', userData, 1800000); // 30 minutes
    await this.showSuccessMessage('Datos de usuario guardados');
    this.refreshStorageInfo();
  }

  async storePreferences(): Promise<void> {
    const preferences = {
      language: 'es',
      currency: 'COP',
      timezone: 'America/Bogota',
      notifications: {
        push: true,
        email: true,
        sms: false
      },
      theme: 'auto'
    };
    
    this.offlineService.storeData('user-preferences', preferences, 86400000); // 24 hours
    await this.showSuccessMessage('Preferencias guardadas');
    this.refreshStorageInfo();
  }

  removeItem(key: string): void {
    if (confirm(`¿Eliminar datos offline para "${key}"?`)) {
      this.offlineService.removeData(key);
      this.refreshStorageInfo();
    }
  }

  clearAllOfflineData(): void {
    if (confirm('¿Estás seguro de que deseas eliminar todos los datos offline?')) {
      this.offlineService.clearOfflineData();
      this.refreshStorageInfo();
    }
  }

  // Sync queue management
  addBookingToQueue(): void {
    this.offlineService.addToSyncQueue({
      type: 'create',
      endpoint: '/api/bookings',
      data: {
        serviceId: 'service-001',
        date: '2025-10-10',
        time: '14:00',
        userId: 'user-001'
      },
      maxRetries: 3
    });
  }

  addUpdateToQueue(): void {
    this.offlineService.addToSyncQueue({
      type: 'update',
      endpoint: '/api/user-profile',
      data: {
        preferences: { theme: 'dark' }
      },
      maxRetries: 3
    });
  }

  async forceSyncNow(): Promise<void> {
    // Force sync process (this would be handled automatically in real app)
    console.log('🔄 Forzando sincronización...');
    await this.showSuccessMessage('Sincronización iniciada');
  }

  // Helper methods
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatAge(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getSyncStatusText(): string {
    if (this.offlineService.syncInProgress()) return 'Sincronizando...';
    if (this.offlineService.queueSize() > 0) return 'Pendiente de sync';
    return 'Sin elementos';
  }

  getLastSyncText(): string {
    const lastSync = this.offlineService.lastSyncTime();
    if (!lastSync) return 'Nunca';
    return this.formatAge(Date.now() - lastSync);
  }

  getSyncProgressText(): string {
    if (this.offlineService.syncInProgress()) return 'En progreso...';
    return 'Automático cada 30s';
  }

  getSyncItemBadgeClass(item: SyncQueueItem): string {
    if (item.retries === 0) return 'badge-warning';
    if (item.retries >= item.maxRetries) return 'badge-error';
    return 'badge-info';
  }

  private async showSuccessMessage(message: string): Promise<void> {
    await this.pwaService.showNotification({
      title: 'Operación exitosa',
      body: message,
      tag: 'offline-demo'
    });
  }
}