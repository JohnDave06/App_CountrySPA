import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanDeactivate, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuth(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuth(childRoute, state);
  }

  private checkAuth(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    // Simular verificación de autenticación
    const isAuthenticated = localStorage.getItem('user-token') !== null;
    const requiresAuth = route.data?.['requiresAuth'] !== false;
    
    if (requiresAuth && !isAuthenticated) {
      console.warn(`AuthGuard: Access denied to ${state.url}. Redirecting to login.`);
      return of(this.router.createUrlTree(['/auth/login'], { 
        queryParams: { returnUrl: state.url } 
      }));
    }

    return of(true);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Simular verificación de rol de administrador
    const userRole = localStorage.getItem('user-role');
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      console.warn(`AdminGuard: Access denied to ${state.url}. User role: ${userRole}`);
      return of(this.router.createUrlTree(['/auth/unauthorized']));
    }

    return of(true);
  }
}

@Injectable({
  providedIn: 'root'
})
export class FeatureGuard implements CanLoad {
  constructor() {}

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Simular verificación de características habilitadas
    const enabledFeatures = JSON.parse(localStorage.getItem('enabled-features') || '[]');
    const requiredFeature = route.data?.['feature'];
    
    if (requiredFeature && !enabledFeatures.includes(requiredFeature)) {
      console.warn(`FeatureGuard: Feature '${requiredFeature}' is not enabled. Cannot load module.`);
      return of(false);
    }

    return of(true);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(
    component: CanComponentDeactivate,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (component.canDeactivate) {
      return component.canDeactivate();
    }
    
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class DataPreloadGuard implements CanActivate {
  constructor() {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Simular precarga de datos
    const preloadData = route.data?.['preload'];
    
    if (preloadData) {
      console.log(`DataPreloadGuard: Preloading data for ${state.url}`);
      return of(true).pipe(
        delay(500), // Simular tiempo de carga
        map(() => {
          console.log(`DataPreloadGuard: Data preloaded successfully for ${state.url}`);
          return true;
        }),
        catchError(error => {
          console.error(`DataPreloadGuard: Failed to preload data for ${state.url}:`, error);
          return of(false);
        })
      );
    }
    
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanActivateChild {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkPermissions(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkPermissions(childRoute, state);
  }

  private checkPermissions(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const requiredPermissions = route.data?.['permissions'] as string[] || [];
    const userPermissions = JSON.parse(localStorage.getItem('user-permissions') || '[]') as string[];
    
    if (requiredPermissions.length === 0) {
      return of(true);
    }
    
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission => 
        !userPermissions.includes(permission)
      );
      console.warn(`PermissionGuard: Missing permissions [${missingPermissions.join(', ')}] for ${state.url}`);
      return of(this.router.createUrlTree(['/auth/insufficient-permissions']));
    }
    
    return of(true);
  }
}

// Utility service for managing route guards
@Injectable({
  providedIn: 'root'
})
export class GuardUtilsService {
  constructor() {
    this.initializeDefaultPermissions();
  }

  private initializeDefaultPermissions(): void {
    // Set default permissions if none exist
    if (!localStorage.getItem('user-permissions')) {
      const defaultPermissions = [
        'view-services',
        'book-service',
        'view-cabins',
        'make-reservation',
        'view-profile'
      ];
      localStorage.setItem('user-permissions', JSON.stringify(defaultPermissions));
    }

    // Set default enabled features
    if (!localStorage.getItem('enabled-features')) {
      const defaultFeatures = [
        'services',
        'cabins',
        'reservations',
        'profile'
      ];
      localStorage.setItem('enabled-features', JSON.stringify(defaultFeatures));
    }
  }

  // Simulate login for testing
  simulateLogin(role: 'user' | 'admin' = 'user'): void {
    localStorage.setItem('user-token', 'fake-jwt-token-' + Date.now());
    localStorage.setItem('user-role', role);
    
    const permissions = role === 'admin' 
      ? [
          'view-services', 'manage-services', 'book-service',
          'view-cabins', 'manage-cabins', 'make-reservation', 'manage-reservations',
          'view-profile', 'manage-users', 'view-analytics', 'system-admin'
        ]
      : [
          'view-services', 'book-service',
          'view-cabins', 'make-reservation',
          'view-profile'
        ];
    
    localStorage.setItem('user-permissions', JSON.stringify(permissions));
    console.log(`Simulated login as ${role} with permissions:`, permissions);
  }

  // Simulate logout
  simulateLogout(): void {
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-role');
    localStorage.removeItem('user-permissions');
    console.log('Simulated logout');
  }

  // Get current user info
  getCurrentUser(): { isAuthenticated: boolean; role: string | null; permissions: string[] } {
    return {
      isAuthenticated: localStorage.getItem('user-token') !== null,
      role: localStorage.getItem('user-role'),
      permissions: JSON.parse(localStorage.getItem('user-permissions') || '[]')
    };
  }

  // Enable/disable features
  toggleFeature(feature: string, enabled: boolean): void {
    const features = JSON.parse(localStorage.getItem('enabled-features') || '[]');
    if (enabled && !features.includes(feature)) {
      features.push(feature);
    } else if (!enabled) {
      const index = features.indexOf(feature);
      if (index > -1) {
        features.splice(index, 1);
      }
    }
    localStorage.setItem('enabled-features', JSON.stringify(features));
    console.log(`Feature '${feature}' ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const userPermissions = JSON.parse(localStorage.getItem('user-permissions') || '[]');
    return userPermissions.includes(permission);
  }

  // Check if feature is enabled
  isFeatureEnabled(feature: string): boolean {
    const enabledFeatures = JSON.parse(localStorage.getItem('enabled-features') || '[]');
    return enabledFeatures.includes(feature);
  }
}