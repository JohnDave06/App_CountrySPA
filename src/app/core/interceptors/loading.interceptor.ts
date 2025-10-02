import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  
  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Don't show loading for certain endpoints
    const skipLoading = req.url.includes('notifications') || 
                       req.headers.get('skip-loading') === 'true';

    if (!skipLoading) {
      this.loadingService.setLoading(true);
    }

    const startTime = Date.now();

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          
          // Log performance metrics
          if (duration > 2000) {
            this.notificationService.warningToast(
              'Slow Request',
              `Request to ${req.url} took ${duration}ms`,
              { duration: 3000 }
            );
          }

          // Success notification for important requests
          if (req.method !== 'GET' && !skipLoading) {
            this.notificationService.successToast(
              'Success',
              'Request completed successfully',
              { duration: 2000 }
            );
          }
        }
      }),
      finalize(() => {
        if (!skipLoading) {
          // Minimum loading time for better UX
          setTimeout(() => {
            this.loadingService.setLoading(false);
          }, 300);
        }
      })
    );
  }
}