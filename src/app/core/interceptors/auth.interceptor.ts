import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { StateManagementService } from '../../shared/services/state-management.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private stateService: StateManagementService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth for certain endpoints
    if (this.shouldSkipAuth(req)) {
      return next.handle(req);
    }

    return this.stateService.user$.pipe(
      take(1),
      switchMap(user => {
        let authReq = req;

        if (user) {
          // Add authorization header with simulated token
          const token = this.generateSimulatedToken(user);
          authReq = req.clone({
            setHeaders: {
              'Authorization': `Bearer ${token}`,
              'X-User-ID': user.id,
              'X-User-Role': (user as any).role || 'user'
            }
          });
        }

        // Add common headers
        authReq = authReq.clone({
          setHeaders: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-App-Version': '1.0.0',
            'X-Timestamp': new Date().toISOString(),
            ...authReq.headers
          }
        });

        return next.handle(authReq);
      })
    );
  }

  private shouldSkipAuth(req: HttpRequest<any>): boolean {
    const skipAuthUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/public/',
      '/assets/',
      '/config'
    ];

    return skipAuthUrls.some(url => req.url.includes(url)) || 
           req.headers.get('skip-auth') === 'true';
  }

  private generateSimulatedToken(user: any): string {
    // Simulate JWT token generation (for demo purposes)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: (user as any).role || 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    }));
    const signature = btoa('simulated-signature-' + Date.now());
    
    return `${header}.${payload}.${signature}`;
  }
}