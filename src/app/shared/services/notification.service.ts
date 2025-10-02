import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 = permanent
  action?: {
    label: string;
    handler: () => void;
  };
  timestamp: Date;
}

export interface Toast extends Notification {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  private eventSubject = new Subject<{ type: string; data: any }>();

  public readonly notifications$ = this.notificationsSubject.asObservable();
  public readonly toasts$ = this.toastsSubject.asObservable();
  public readonly events$ = this.eventSubject.asObservable();

  private readonly DEFAULT_DURATION = 5000; // 5 seconds
  private readonly MAX_NOTIFICATIONS = 50;
  private readonly MAX_TOASTS = 5;

  constructor() {}

  // Notification methods
  showNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? this.DEFAULT_DURATION
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [fullNotification, ...currentNotifications]
      .slice(0, this.MAX_NOTIFICATIONS);
    
    this.notificationsSubject.next(updatedNotifications);

    // Auto-remove if duration is set
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, fullNotification.duration);
    }

    return id;
  }

  showToast(toast: Omit<Toast, 'id' | 'timestamp'> & { position?: Toast['position'] }): string {
    const id = this.generateId();
    const fullToast: Toast = {
      ...toast,
      id,
      timestamp: new Date(),
      duration: toast.duration ?? this.DEFAULT_DURATION,
      position: toast.position ?? 'top-right'
    };

    const currentToasts = this.toastsSubject.value;
    const updatedToasts = [fullToast, ...currentToasts]
      .slice(0, this.MAX_TOASTS);
    
    this.toastsSubject.next(updatedToasts);

    // Auto-remove if duration is set
    if (fullToast.duration && fullToast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, fullToast.duration);
    }

    return id;
  }

  // Convenience methods for different notification types
  success(title: string, message: string, options?: Partial<Notification>): string {
    return this.showNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  }

  error(title: string, message: string, options?: Partial<Notification>): string {
    return this.showNotification({
      type: 'error',
      title,
      message,
      duration: 0, // Error notifications stay until dismissed
      ...options
    });
  }

  warning(title: string, message: string, options?: Partial<Notification>): string {
    return this.showNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  }

  info(title: string, message: string, options?: Partial<Notification>): string {
    return this.showNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }

  // Toast convenience methods
  successToast(title: string, message: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title' | 'message'>>): string {
    return this.showToast({
      type: 'success',
      title,
      message,
      position: 'top-right',
      ...options
    });
  }

  errorToast(title: string, message: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title' | 'message'>>): string {
    return this.showToast({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer duration for errors
      position: 'top-right',
      ...options
    });
  }

  warningToast(title: string, message: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title' | 'message'>>): string {
    return this.showToast({
      type: 'warning',
      title,
      message,
      position: 'top-right',
      ...options
    });
  }

  infoToast(title: string, message: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title' | 'message'>>): string {
    return this.showToast({
      type: 'info',
      title,
      message,
      position: 'top-right',
      ...options
    });
  }

  // Removal methods
  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const updatedToasts = currentToasts.filter(t => t.id !== id);
    this.toastsSubject.next(updatedToasts);
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }

  clearAllToasts(): void {
    this.toastsSubject.next([]);
  }

  clearAll(): void {
    this.clearAllNotifications();
    this.clearAllToasts();
  }

  // Event system for component communication
  emit(type: string, data?: any): void {
    this.eventSubject.next({ type, data });
  }

  on(type: string): Observable<any> {
    return this.events$.pipe(
      filter(event => event.type === type),
      map(event => event.data)
    );
  }

  // Specific business events
  serviceBooked(serviceName: string, bookingId: string): void {
    this.successToast(
      'Reserva Confirmada',
      `Tu reserva para ${serviceName} ha sido confirmada.`,
      {
        action: {
          label: 'Ver Detalles',
          handler: () => this.emit('navigate-to-booking', bookingId)
        }
      }
    );
    this.emit('service-booked', { serviceName, bookingId });
  }

  favoriteAdded(serviceName: string): void {
    this.infoToast(
      'Agregado a Favoritos',
      `${serviceName} se agregó a tus favoritos.`,
      { duration: 3000 }
    );
    this.emit('favorite-added', serviceName);
  }

  favoriteRemoved(serviceName: string): void {
    this.infoToast(
      'Eliminado de Favoritos',
      `${serviceName} se eliminó de tus favoritos.`,
      { duration: 3000 }
    );
    this.emit('favorite-removed', serviceName);
  }

  userLoggedIn(userName: string): void {
    this.successToast(
      'Bienvenido',
      `¡Hola ${userName}! Has iniciado sesión correctamente.`
    );
    this.emit('user-logged-in', userName);
  }

  userLoggedOut(): void {
    this.infoToast(
      'Sesión Cerrada',
      'Has cerrado sesión correctamente.'
    );
    this.emit('user-logged-out');
  }

  networkError(): void {
    this.errorToast(
      'Error de Conexión',
      'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      {
        action: {
          label: 'Reintentar',
          handler: () => this.emit('retry-request')
        }
      }
    );
    this.emit('network-error');
  }

  // Utility methods
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get filtered observables
  getNotificationsByType(type: Notification['type']): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === type))
    );
  }

  getToastsByPosition(position: Toast['position']): Observable<Toast[]> {
    return this.toasts$.pipe(
      map(toasts => toasts.filter(t => t.position === position))
    );
  }

  // Statistics
  getNotificationCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.length)
    );
  }

  getUnreadNotificationCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === 'error' || n.type === 'warning').length)
    );
  }
}