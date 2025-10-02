import { Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { PWAService } from './pwa.service';

export interface OfflineData<T> {
  data: T;
  timestamp: number;
  expires?: number;
  version: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private readonly STORAGE_PREFIX = 'offline_';
  private readonly SYNC_QUEUE_KEY = 'sync_queue';
  private readonly MAX_RETRIES = 3;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds

  // Signals for reactive state
  private _syncInProgress = signal(false);
  private _queueSize = signal(0);
  private _lastSyncTime = signal<number | null>(null);

  // Computed signals
  readonly syncInProgress = computed(() => this._syncInProgress());
  readonly queueSize = computed(() => this._queueSize());
  readonly lastSyncTime = computed(() => this._lastSyncTime());
  readonly hasPendingSync = computed(() => this._queueSize() > 0);

  // Sync queue management
  private syncQueue: SyncQueueItem[] = [];
  private syncQueueSubject = new BehaviorSubject<SyncQueueItem[]>([]);
  readonly syncQueue$ = this.syncQueueSubject.asObservable();

  private syncIntervalId?: number;

  constructor(private pwaService: PWAService) {
    this.initializeOfflineService();
    this.startPeriodicSync();
  }

  private initializeOfflineService(): void {
    this.loadSyncQueue();
    
    // Listen to online/offline events
    this.pwaService.online$.subscribe(online => {
      if (online && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    });
  }

  private startPeriodicSync(): void {
    this.syncIntervalId = window.setInterval(() => {
      if (this.pwaService.isOnline() && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, this.SYNC_INTERVAL);
  }

  // Data storage methods
  storeData<T>(key: string, data: T, expiration?: number): void {
    const offlineData: OfflineData<T> = {
      data,
      timestamp: Date.now(),
      expires: expiration ? Date.now() + expiration : undefined,
      version: '1.0.0'
    };

    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(offlineData));
      console.log(`📦 Datos almacenados offline: ${key}`);
    } catch (error) {
      console.error(`❌ Error almacenando datos offline (${key}):`, error);
      this.handleStorageError(error, key);
    }
  }

  getData<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (!stored) return null;

      const offlineData: OfflineData<T> = JSON.parse(stored);
      
      // Check if data has expired
      if (offlineData.expires && Date.now() > offlineData.expires) {
        this.removeData(key);
        return null;
      }

      console.log(`📦 Datos recuperados offline: ${key}`);
      return offlineData.data;
    } catch (error) {
      console.error(`❌ Error recuperando datos offline (${key}):`, error);
      return null;
    }
  }

  removeData(key: string): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    console.log(`🗑️ Datos offline eliminados: ${key}`);
  }

  hasData(key: string): boolean {
    return this.getData(key) !== null;
  }

  getDataAge(key: string): number | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (!stored) return null;

      const offlineData: OfflineData<any> = JSON.parse(stored);
      return Date.now() - offlineData.timestamp;
    } catch (error) {
      return null;
    }
  }

  // Sync queue management
  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): void {
    const syncItem: SyncQueueItem = {
      ...item,
      id: this.generateSyncId(),
      timestamp: Date.now(),
      retries: 0
    };

    this.syncQueue.push(syncItem);
    this._queueSize.set(this.syncQueue.length);
    this.saveSyncQueue();

    console.log(`📤 Elemento agregado a cola de sincronización: ${syncItem.type} ${syncItem.endpoint}`);

    // Try to sync immediately if online
    if (this.pwaService.isOnline()) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this._syncInProgress() || this.syncQueue.length === 0 || !this.pwaService.isOnline()) {
      return;
    }

    this._syncInProgress.set(true);
    console.log(`🔄 Procesando cola de sincronización (${this.syncQueue.length} elementos)`);

    const itemsToProcess = [...this.syncQueue];
    const failedItems: SyncQueueItem[] = [];

    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item);
        console.log(`✅ Sincronizado: ${item.type} ${item.endpoint}`);
        
        // Remove from queue
        this.syncQueue = this.syncQueue.filter(queueItem => queueItem.id !== item.id);
      } catch (error) {
        console.error(`❌ Error sincronizando: ${item.type} ${item.endpoint}`, error);
        
        item.retries++;
        if (item.retries < item.maxRetries) {
          failedItems.push(item);
        } else {
          console.error(`❌ Elemento descartado tras ${item.maxRetries} intentos: ${item.id}`);
        }
      }
    }

    // Update queue with failed items
    this.syncQueue = failedItems;
    this._queueSize.set(this.syncQueue.length);
    this._lastSyncTime.set(Date.now());
    this.saveSyncQueue();
    this.syncQueueSubject.next([...this.syncQueue]);

    this._syncInProgress.set(false);
    console.log(`✅ Sincronización completada. Elementos restantes: ${this.syncQueue.length}`);
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // Simulate API call - in real app, use HttpClient
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        if (Math.random() > 0.2) {
          resolve();
        } else {
          reject(new Error('Simulated sync error'));
        }
      }, 1000);
    });
  }

  // Offline-first data fetching
  getDataOfflineFirst<T>(
    key: string,
    fetchFn: () => Observable<T>,
    cacheTime: number = 300000 // 5 minutes default
  ): Observable<T> {
    // Try to get cached data first
    const cachedData = this.getData<T>(key);
    const dataAge = this.getDataAge(key);

    // If we have fresh cached data, return it
    if (cachedData && dataAge !== null && dataAge < cacheTime) {
      console.log(`📦 Usando datos en caché: ${key} (edad: ${Math.round(dataAge / 1000)}s)`);
      return of(cachedData);
    }

    // If offline, return cached data if available
    if (!this.pwaService.isOnline()) {
      if (cachedData) {
        console.log(`📶 Offline: usando datos en caché: ${key}`);
        return of(cachedData);
      } else {
        console.log(`❌ Offline: sin datos en caché para: ${key}`);
        return throwError(() => new Error('Sin conexión y sin datos en caché'));
      }
    }

    // If online, fetch fresh data
    return fetchFn().pipe(
      tap(data => {
        this.storeData(key, data, cacheTime);
        console.log(`🌐 Datos actualizados desde red: ${key}`);
      }),
      catchError(error => {
        // If network fails, fallback to cached data
        if (cachedData) {
          console.log(`⚠️ Error de red, usando caché: ${key}`);
          return of(cachedData);
        }
        return throwError(() => error);
      })
    );
  }

  // Optimistic updates
  optimisticUpdate<T>(
    key: string,
    updateFn: (current: T | null) => T,
    syncEndpoint: string,
    syncData?: any
  ): T {
    const currentData = this.getData<T>(key);
    const updatedData = updateFn(currentData);

    // Store updated data immediately
    this.storeData(key, updatedData);

    // Add to sync queue for later
    this.addToSyncQueue({
      type: 'update',
      endpoint: syncEndpoint,
      data: syncData || updatedData,
      maxRetries: this.MAX_RETRIES
    });

    return updatedData;
  }

  // Storage management
  clearOfflineData(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.STORAGE_PREFIX)
    );

    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ ${keys.length} elementos de datos offline eliminados`);
  }

  getStorageInfo(): {
    totalItems: number;
    totalSize: number;
    items: Array<{ key: string; size: number; age: number }>;
  } {
    const items: Array<{ key: string; size: number; age: number }> = [];
    let totalSize = 0;

    Object.keys(localStorage).forEach(fullKey => {
      if (fullKey.startsWith(this.STORAGE_PREFIX)) {
        const value = localStorage.getItem(fullKey);
        const size = value ? value.length : 0;
        const key = fullKey.replace(this.STORAGE_PREFIX, '');
        const age = this.getDataAge(key) || 0;

        items.push({ key, size, age });
        totalSize += size;
      }
    });

    return {
      totalItems: items.length,
      totalSize,
      items: items.sort((a, b) => b.size - a.size)
    };
  }

  // Utility methods
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem(this.SYNC_QUEUE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        this._queueSize.set(this.syncQueue.length);
        this.syncQueueSubject.next([...this.syncQueue]);
        console.log(`📤 Cola de sincronización cargada: ${this.syncQueue.length} elementos`);
      }
    } catch (error) {
      console.error('❌ Error cargando cola de sincronización:', error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('❌ Error guardando cola de sincronización:', error);
      this.handleStorageError(error, this.SYNC_QUEUE_KEY);
    }
  }

  private handleStorageError(error: any, key: string): void {
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ Almacenamiento lleno, limpiando datos antiguos...');
      this.cleanupOldData();
    }
  }

  private cleanupOldData(): void {
    const storageInfo = this.getStorageInfo();
    const oldItems = storageInfo.items
      .filter(item => item.age > 86400000) // Older than 1 day
      .slice(0, Math.ceil(storageInfo.items.length * 0.3)); // Remove 30% of items

    oldItems.forEach(item => this.removeData(item.key));
    console.log(`🗑️ ${oldItems.length} elementos antiguos eliminados`);
  }

  // Mock data for offline functionality
  getMockServices(): any[] {
    return [
      {
        id: 'service-offline-1',
        name: 'Masaje Relajante (Offline)',
        description: 'Disponible sin conexión',
        price: 120,
        duration: 60,
        category: 'Masajes',
        rating: 4.8,
        image: '/assets/images/massage-1.jpg',
        offline: true
      },
      {
        id: 'service-offline-2',
        name: 'Facial Hidratante (Offline)',
        description: 'Cached para uso offline',
        price: 90,
        duration: 45,
        category: 'Faciales',
        rating: 4.7,
        image: '/assets/images/facial-1.jpg',
        offline: true
      }
    ];
  }

  getMockBookings(): any[] {
    return [
      {
        id: 'booking-offline-1',
        serviceName: 'Masaje Offline',
        date: '2025-10-05',
        time: '14:00',
        status: 'Confirmada',
        offline: true
      }
    ];
  }

  // Cleanup on destroy
  destroy(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
  }
}