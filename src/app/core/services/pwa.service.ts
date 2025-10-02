import { Injectable, signal, computed } from '@angular/core';
import { SwUpdate, SwPush } from '@angular/service-worker';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith, distinctUntilChanged, catchError } from 'rxjs/operators';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PWAService {
  // Angular Signals for reactive state
  private _isOnline = signal(navigator.onLine);
  private _isInstallable = signal(false);
  private _isInstalled = signal(false);
  private _updateAvailable = signal(false);
  private _swEnabled = signal(false);

  // Computed signals
  readonly isOnline = computed(() => this._isOnline());
  readonly isInstallable = computed(() => this._isInstallable());
  readonly isInstalled = computed(() => this._isInstalled());
  readonly updateAvailable = computed(() => this._updateAvailable());
  readonly swEnabled = computed(() => this._swEnabled());
  readonly connectionStatus = computed(() => 
    this._isOnline() ? 'online' : 'offline'
  );

  // Behavioral subjects for complex state management
  private installPromptSubject = new BehaviorSubject<PWAInstallPrompt | null>(null);
  private notificationPermissionSubject = new BehaviorSubject<NotificationPermission>('default');
  private pushSubscriptionSubject = new BehaviorSubject<PushSubscription | null>(null);

  // Public observables
  readonly installPrompt$ = this.installPromptSubject.asObservable();
  readonly notificationPermission$ = this.notificationPermissionSubject.asObservable();
  readonly pushSubscription$ = this.pushSubscriptionSubject.asObservable();

  // Network status observable
  readonly online$: Observable<boolean> = merge(
    of(navigator.onLine),
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false))
  ).pipe(
    startWith(navigator.onLine),
    distinctUntilChanged()
  );

  private deferredPrompt: PWAInstallPrompt | null = null;

  constructor(
    private swUpdate: SwUpdate,
    private swPush: SwPush
  ) {
    this.initializePWA();
    this.setupNetworkMonitoring();
    this.setupServiceWorkerUpdates();
    this.setupInstallPrompt();
    this.checkInstallationStatus();
    this.initializeNotifications();
  }

  private initializePWA(): void {
    this._swEnabled.set(this.swUpdate.isEnabled);
    
    if (this.swUpdate.isEnabled) {
      console.log('✅ Service Worker habilitado');
      this.checkForUpdates();
    } else {
      console.log('❌ Service Worker no disponible');
    }
  }

  private setupNetworkMonitoring(): void {
    this.online$.subscribe(online => {
      this._isOnline.set(online);
      
      if (online) {
        this.handleOnlineStatus();
      } else {
        this.handleOfflineStatus();
      }
    });
  }

  private setupServiceWorkerUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    // Check for updates periodically
    this.swUpdate.checkForUpdate().then(updateFound => {
      if (updateFound) {
        this._updateAvailable.set(true);
        console.log('🔄 Nueva versión disponible');
      }
    });

    // Listen for available updates
    this.swUpdate.versionUpdates.subscribe(evt => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          console.log('🔍 Nueva versión detectada:', evt.version.hash);
          break;
        case 'VERSION_READY':
          console.log('✅ Nueva versión lista:', evt.currentVersion.hash);
          this._updateAvailable.set(true);
          this.notifyUpdateAvailable();
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.error('❌ Error instalando actualización:', evt.error);
          break;
      }
    });

    // Check for unrecoverable state
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('❌ SW en estado irrecuperable:', event.reason);
      this.notifyUnrecoverableState();
    });
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this._isInstallable.set(true);
      this.installPromptSubject.next(e);
      console.log('📱 PWA instalable detectada');
    });

    window.addEventListener('appinstalled', () => {
      this._isInstalled.set(true);
      this._isInstallable.set(false);
      console.log('✅ PWA instalada exitosamente');
      this.trackInstallationEvent();
    });
  }

  private checkInstallationStatus(): void {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');
    
    this._isInstalled.set(isStandalone);
  }

  private initializeNotifications(): void {
    if ('Notification' in window) {
      this.notificationPermissionSubject.next(Notification.permission);
    }

    if (this.swPush.isEnabled) {
      this.swPush.subscription.subscribe(subscription => {
        this.pushSubscriptionSubject.next(subscription);
      });
    }
  }

  // Public methods for PWA functionality

  async installApp(): Promise<{ outcome: 'accepted' | 'dismissed' } | null> {
    if (!this.deferredPrompt) {
      console.warn('⚠️ No hay prompt de instalación disponible');
      return null;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó la instalación');
      } else {
        console.log('❌ Usuario canceló la instalación');
      }

      this.deferredPrompt = null;
      this._isInstallable.set(false);
      this.installPromptSubject.next(null);

      return choiceResult;
    } catch (error) {
      console.error('❌ Error durante la instalación:', error);
      return null;
    }
  }

  async updateApp(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      console.warn('⚠️ Service Worker no habilitado');
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      this._updateAvailable.set(false);
      window.location.reload();
    } catch (error) {
      console.error('❌ Error actualizando la app:', error);
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) return false;

    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      console.log(updateFound ? '🔄 Actualización encontrada' : '✅ App actualizada');
      return updateFound;
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      return false;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notificaciones no soportadas');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.notificationPermissionSubject.next(permission);
    return permission;
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notificaciones no soportadas');
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Permisos de notificación denegados');
        return;
      }
    }

    const notificationOptions: any = {
      body: options.body,
      icon: options.icon || '/assets/icons/icon-192x192.png',
      badge: options.badge || '/assets/icons/icon-72x72.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      silent: options.silent
    };

    // Add vibrate and actions if supported
    if (options.vibrate && 'vibrate' in navigator) {
      notificationOptions.vibrate = options.vibrate;
    }
    if (options.actions) {
      notificationOptions.actions = options.actions;
    }

    const notification = new Notification(options.title, notificationOptions);

    // Auto-close after 5 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swPush.isEnabled) {
      console.warn('⚠️ Push notifications no soportadas');
      return null;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: 'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
      });
      
      this.pushSubscriptionSubject.next(subscription);
      console.log('✅ Suscrito a push notifications');
      return subscription;
    } catch (error) {
      console.error('❌ Error suscribiendo a push:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    const subscription = this.pushSubscriptionSubject.value;
    if (!subscription) return false;

    try {
      const unsubscribed = await subscription.unsubscribe();
      if (unsubscribed) {
        this.pushSubscriptionSubject.next(null);
        console.log('✅ Desuscrito de push notifications');
      }
      return unsubscribed;
    } catch (error) {
      console.error('❌ Error desuscribiendo de push:', error);
      return false;
    }
  }

  // Cache management methods
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('🗑️ Caché limpiado');
    }
  }

  async getCacheInfo(): Promise<{ name: string; size: number }[]> {
    if (!('caches' in window)) return [];

    const cacheNames = await caches.keys();
    const cacheInfo = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        return { name, size: keys.length };
      })
    );

    return cacheInfo;
  }

  // Private helper methods
  private handleOnlineStatus(): void {
    console.log('🌐 Conexión restaurada');
    this.showNotification({
      title: 'Conexión restaurada',
      body: 'Ya puedes acceder a todas las funcionalidades',
      tag: 'network-status'
    });
  }

  private handleOfflineStatus(): void {
    console.log('📶 Sin conexión - Modo offline');
    this.showNotification({
      title: 'Sin conexión',
      body: 'Algunas funciones pueden estar limitadas',
      tag: 'network-status'
    });
  }

  private notifyUpdateAvailable(): void {
    this.showNotification({
      title: 'Actualización disponible',
      body: 'Una nueva versión de Country SPA está lista',
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'Actualizar ahora' },
        { action: 'later', title: 'Más tarde' }
      ]
    });
  }

  private notifyUnrecoverableState(): void {
    this.showNotification({
      title: 'Actualización requerida',
      body: 'Por favor, recarga la aplicación',
      requireInteraction: true
    });
  }

  private trackInstallationEvent(): void {
    // Analytics tracking for PWA installation
    console.log('📊 PWA instalada - evento registrado');
  }

  // Storage management for offline functionality
  async storeOfflineData<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(`pwa_offline_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error(`❌ Error guardando datos offline (${key}):`, error);
    }
  }

  getOfflineData<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(`pwa_offline_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Error recuperando datos offline (${key}):`, error);
      return null;
    }
  }

  removeOfflineData(key: string): void {
    localStorage.removeItem(`pwa_offline_${key}`);
  }

  // Performance monitoring
  getPerformanceMetrics(): any {
    if ('performance' in window && performance.getEntriesByType) {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        resources: performance.getEntriesByType('resource'),
        measures: performance.getEntriesByType('measure')
      };
    }
    return null;
  }
}