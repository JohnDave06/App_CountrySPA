import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Observable, BehaviorSubject, fromEvent, EMPTY } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

export interface UpdateAvailable {
  current: string;
  available: string;
  type: 'UPDATE_AVAILABLE';
}

export interface UpdateActivated {
  current: string;
  previous: string;
  type: 'UPDATE_ACTIVATED';
}

export interface PwaInstallEvent {
  platforms: string[];
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private updateAvailableSubject = new BehaviorSubject<boolean>(false);
  public updateAvailable$ = this.updateAvailableSubject.asObservable();

  private installPromptSubject = new BehaviorSubject<PwaInstallEvent | null>(null);
  public installPrompt$ = this.installPromptSubject.asObservable();

  private isInstalledSubject = new BehaviorSubject<boolean>(false);
  public isInstalled$ = this.isInstalledSubject.asObservable();

  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();

  private updateInfo: UpdateAvailable | null = null;
  private installPromptEvent: any = null;

  constructor(private swUpdate: SwUpdate) {
    this.initializeServiceWorker();
    this.initializeInstallPrompt();
    this.initializeOnlineStatus();
    this.checkIfInstalled();
  }

  /**
   * Verifica si hay actualizaciones disponibles
   */
  checkForUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().catch(error => {
        console.error('Error checking for updates:', error);
      });
    }
  }

  /**
   * Aplica la actualización disponible
   */
  applyUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false);
    }

    return this.swUpdate.activateUpdate().then(() => {
      window.location.reload();
      return true;
    }).catch(error => {
      console.error('Error applying update:', error);
      return false;
    });
  }

  /**
   * Obtiene información de la actualización disponible
   */
  getUpdateInfo(): UpdateAvailable | null {
    return this.updateInfo;
  }

  /**
   * Verifica si la aplicación puede ser instalada
   */
  canInstall(): boolean {
    return this.installPromptEvent !== null;
  }

  /**
   * Muestra el prompt de instalación
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      return false;
    }

    try {
      this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.installPromptEvent = null;
        this.installPromptSubject.next(null);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during install prompt:', error);
      return false;
    }
  }

  /**
   * Verifica si la app está instalada
   */
  isAppInstalled(): boolean {
    return this.isInstalledSubject.value;
  }

  /**
   * Verifica el estado de conexión
   */
  isAppOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  /**
   * Obtiene información del Service Worker
   */
  getServiceWorkerStatus(): Observable<boolean> {
    if (!this.swUpdate.isEnabled) {
      return new BehaviorSubject(false).asObservable();
    }

    return new BehaviorSubject(true).asObservable();
  }

  /**
   * Limpia el caché del Service Worker
   */
  async clearCache(): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
      await Promise.all(deletePromises);
      console.log('All caches cleared');
      return true;
    } catch (error) {
      console.error('Error clearing caches:', error);
      return false;
    }
  }

  /**
   * Obtiene el tamaño del caché
   */
  async getCacheSize(): Promise<number> {
    if (!('caches' in window) || !('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Fuerza la recarga sin caché
   */
  forceReload(): void {
    window.location.reload();
  }

  /**
   * Obtiene información de la aplicación
   */
  getAppInfo(): {
    version: string;
    isInstalled: boolean;
    isOnline: boolean;
    canInstall: boolean;
    hasUpdate: boolean;
    serviceWorkerEnabled: boolean;
  } {
    return {
      version: '1.0.0', // Debería obtenerse del package.json o build
      isInstalled: this.isAppInstalled(),
      isOnline: this.isAppOnline(),
      canInstall: this.canInstall(),
      hasUpdate: this.updateAvailableSubject.value,
      serviceWorkerEnabled: this.swUpdate.isEnabled
    };
  }

  /**
   * Inicializa el Service Worker
   */
  private initializeServiceWorker(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker is not enabled');
      return;
    }

    // Escuchar actualizaciones disponibles
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(evt => {
        this.updateInfo = {
          current: evt.currentVersion.hash,
          available: evt.latestVersion.hash,
          type: 'UPDATE_AVAILABLE'
        };
        this.updateAvailableSubject.next(true);
        console.log('Update available:', this.updateInfo);
      });

    // Escuchar cuando una nueva versión es detectada
    this.swUpdate.versionUpdates
      .pipe(filter(evt => evt.type === 'VERSION_DETECTED'))
      .subscribe(evt => {
        console.log('New version detected, will be ready soon');
      });

    // Error en el Service Worker
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('Service Worker error:', event.reason);
      // Notificar al usuario que necesita recargar
      this.notifyUnrecoverableState();
    });

    // Verificar actualizaciones cada 6 horas
    setInterval(() => {
      this.checkForUpdate();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Inicializa el prompt de instalación
   */
  private initializeInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.installPromptEvent = event;
      this.installPromptSubject.next(event);
      console.log('Install prompt ready');
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalledSubject.next(true);
      this.installPromptEvent = null;
      this.installPromptSubject.next(null);
      console.log('App installed');
    });
  }

  /**
   * Inicializa el estado de conexión
   */
  private initializeOnlineStatus(): void {
    window.addEventListener('online', () => {
      this.isOnlineSubject.next(true);
      console.log('App back online');
    });

    window.addEventListener('offline', () => {
      this.isOnlineSubject.next(false);
      console.log('App went offline');
    });
  }

  /**
   * Verifica si la app ya está instalada
   */
  private checkIfInstalled(): void {
    // Detectar si se ejecuta como PWA instalada
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone) {
      this.isInstalledSubject.next(true);
    }

    // Detectar cambios en el display mode
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
      this.isInstalledSubject.next(evt.matches);
    });
  }

  /**
   * Notifica estado irrecuperable del Service Worker
   */
  private notifyUnrecoverableState(): void {
    // En una aplicación real, mostrarías una notificación toast o modal
    if (confirm('La aplicación necesita recargarse para funcionar correctamente. ¿Desea recargar ahora?')) {
      window.location.reload();
    }
  }
}