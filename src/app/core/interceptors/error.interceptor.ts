import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, concatMap, take } from 'rxjs/operators';
import { NotificationService } from '../../shared/services/notification.service';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retryWhen(errors => 
        errors.pipe(
          concatMap((error: HttpErrorResponse, index) => {
            // Only retry for network errors or 5xx errors, max 2 retries
            if ((error.status === 0 || error.status >= 500) && index < 2) {
              console.log(`Retrying request (${index + 1}/2)...`);
              return timer(1000 * (index + 1)); // Exponential backoff
            }
            return throwError(() => error);
          }),
          take(3) // Original + 2 retries
        )
      ),
      catchError((error: HttpErrorResponse) => {
        this.loadingService.setLoading(false);
        this.handleError(error, req);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    let errorMessage = 'An unexpected error occurred';
    let errorTitle = 'Error';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
      errorTitle = 'Client Error';
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorTitle = 'Network Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          this.notificationService.networkError();
          return;
          
        case 400:
          errorTitle = 'Bad Request';
          errorMessage = error.error?.message || 'The request was invalid.';
          break;
          
        case 401:
          errorTitle = 'Unauthorized';
          errorMessage = 'You are not authorized to perform this action. Please log in again.';
          this.notificationService.emit('unauthorized');
          break;
          
        case 403:
          errorTitle = 'Forbidden';
          errorMessage = 'You do not have permission to access this resource.';
          break;
          
        case 404:
          errorTitle = 'Not Found';
          errorMessage = 'The requested resource was not found.';
          break;
          
        case 422:
          errorTitle = 'Validation Error';
          errorMessage = this.extractValidationErrors(error.error);
          break;
          
        case 429:
          errorTitle = 'Too Many Requests';
          errorMessage = 'Too many requests. Please try again later.';
          break;
          
        case 500:
          errorTitle = 'Server Error';
          errorMessage = 'Internal server error. Please try again later.';
          break;
          
        case 502:
          errorTitle = 'Bad Gateway';
          errorMessage = 'The server is temporarily unavailable. Please try again later.';
          break;
          
        case 503:
          errorTitle = 'Service Unavailable';
          errorMessage = 'The service is temporarily unavailable. Please try again later.';
          break;
          
        default:
          errorTitle = `HTTP ${error.status}`;
          errorMessage = error.error?.message || `An error occurred while processing your request.`;
      }
    }

    // Show error notification
    this.notificationService.errorToast(
      errorTitle,
      errorMessage,
      {
        action: error.status >= 500 ? {
          label: 'Retry',
          handler: () => this.notificationService.emit('retry-request', req)
        } : undefined
      }
    );

    // Log error for debugging
    console.error('HTTP Error:', {
      url: req.url,
      method: req.method,
      status: error.status,
      message: errorMessage,
      error: error.error
    });
  }

  private extractValidationErrors(errorBody: any): string {
    if (!errorBody) {
      return 'Validation failed';
    }

    if (typeof errorBody === 'string') {
      return errorBody;
    }

    if (errorBody.errors) {
      // Handle Laravel-style validation errors
      const errors = Object.values(errorBody.errors).flat();
      return errors.join(', ');
    }

    if (errorBody.message) {
      return errorBody.message;
    }

    if (Array.isArray(errorBody)) {
      return errorBody.join(', ');
    }

    return 'Validation failed';
  }
}