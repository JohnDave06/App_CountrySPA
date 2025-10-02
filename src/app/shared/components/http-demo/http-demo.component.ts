import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpDemoService, ApiResponse, MockService } from '../../../core/services/http-demo.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-http-demo',
  templateUrl: './http-demo.component.html',
  styleUrls: ['./http-demo.component.css']
})
export class HttpDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading$ = this.loadingService.loading$;
  services: MockService[] = [];
  selectedService: MockService | null = null;
  lastResponse: any = null;
  
  // Demo state
  demoResults: { action: string; success: boolean; data?: any; error?: string }[] = [];

  constructor(
    private httpDemoService: HttpDemoService,
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadServices();
    
    // Listen for retry events from error interceptor
    this.notificationService.on('retry-request')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Retry requested from interceptor');
        this.loadServices();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Basic API calls
  loadServices(): void {
    this.addDemoResult('Loading Services', true);
    this.httpDemoService.getServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<MockService[]>) => {
          this.services = response.data;
          this.lastResponse = response;
          this.addDemoResult('Load Services', true, `Loaded ${response.data.length} services`);
        },
        error: (error) => {
          this.addDemoResult('Load Services', false, undefined, error.message);
        }
      });
  }

  getServiceById(id: string): void {
    this.addDemoResult(`Get Service ${id}`, true);
    this.httpDemoService.getServiceById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<MockService | null>) => {
          this.selectedService = response.data;
          this.lastResponse = response;
          this.addDemoResult(`Get Service ${id}`, true, response.message);
        },
        error: (error) => {
          this.addDemoResult(`Get Service ${id}`, false, undefined, error.message);
        }
      });
  }

  // Performance test
  triggerSlowRequest(): void {
    this.addDemoResult('Slow Request (3s)', true);
    this.httpDemoService.getSlowData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<any>) => {
          this.lastResponse = response;
          this.addDemoResult('Slow Request', true, 'Completed - check for performance warning toast');
        },
        error: (error) => {
          this.addDemoResult('Slow Request', false, undefined, error.message);
        }
      });
  }

  // Error scenarios
  triggerNetworkError(): void {
    this.addDemoResult('Network Error', true);
    this.httpDemoService.triggerNetworkError()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addDemoResult('Network Error', true, 'Unexpected success');
        },
        error: (error) => {
          this.addDemoResult('Network Error', false, undefined, 'Network error triggered');
        }
      });
  }

  trigger401Error(): void {
    this.addDemoResult('401 Unauthorized', true);
    this.httpDemoService.trigger401Error()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addDemoResult('401 Error', true, 'Unexpected success');
        },
        error: (error) => {
          this.addDemoResult('401 Error', false, undefined, 'Unauthorized error triggered');
        }
      });
  }

  trigger404Error(): void {
    this.addDemoResult('404 Not Found', true);
    this.httpDemoService.trigger404Error()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addDemoResult('404 Error', true, 'Unexpected success');
        },
        error: (error) => {
          this.addDemoResult('404 Error', false, undefined, 'Not found error triggered');
        }
      });
  }

  trigger500Error(): void {
    this.addDemoResult('500 Server Error', true);
    this.httpDemoService.trigger500Error()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addDemoResult('500 Error', true, 'Unexpected success');
        },
        error: (error) => {
          this.addDemoResult('500 Error', false, undefined, 'Server error triggered (with retry)');
        }
      });
  }

  triggerValidationError(): void {
    this.addDemoResult('422 Validation Error', true);
    this.httpDemoService.triggerValidationError()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addDemoResult('Validation Error', true, 'Unexpected success');
        },
        error: (error) => {
          this.addDemoResult('Validation Error', false, undefined, 'Validation error triggered');
        }
      });
  }

  // CRUD operations (trigger success notifications)
  createService(): void {
    const newService = {
      name: `Demo Service ${Date.now()}`,
      description: 'Created via HTTP demo',
      price: Math.floor(Math.random() * 1000) + 100,
      category: 'demo'
    };

    this.addDemoResult('Create Service', true);
    this.httpDemoService.createService(newService)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<MockService>) => {
          this.lastResponse = response;
          this.addDemoResult('Create Service', true, `Created service: ${response.data.name}`);
        },
        error: (error) => {
          this.addDemoResult('Create Service', false, undefined, error.message);
        }
      });
  }

  updateService(): void {
    if (!this.selectedService) {
      this.notificationService.warningToast('No Service Selected', 'Please select a service first');
      return;
    }

    const updates = {
      name: `${this.selectedService.name} (Updated)`,
      price: this.selectedService.price + 50
    };

    this.addDemoResult('Update Service', true);
    this.httpDemoService.updateService(this.selectedService.id, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<MockService | null>) => {
          this.lastResponse = response;
          this.addDemoResult('Update Service', true, `Updated service: ${response.data?.name}`);
        },
        error: (error) => {
          this.addDemoResult('Update Service', false, undefined, error.message);
        }
      });
  }

  deleteService(): void {
    if (!this.selectedService) {
      this.notificationService.warningToast('No Service Selected', 'Please select a service first');
      return;
    }

    this.addDemoResult('Delete Service', true);
    this.httpDemoService.deleteService(this.selectedService.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<null>) => {
          this.lastResponse = response;
          this.addDemoResult('Delete Service', true, `Deleted service: ${this.selectedService?.name}`);
          this.selectedService = null;
        },
        error: (error) => {
          this.addDemoResult('Delete Service', false, undefined, error.message);
        }
      });
  }

  // Test authenticated requests
  getProtectedData(): void {
    this.addDemoResult('Protected Request', true);
    this.httpDemoService.getProtectedData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<any>) => {
          this.lastResponse = response;
          this.addDemoResult('Protected Request', true, 'Protected data retrieved with auth headers');
        },
        error: (error) => {
          this.addDemoResult('Protected Request', false, undefined, error.message);
        }
      });
  }

  // Test skip loading requests
  getNotificationData(): void {
    this.addDemoResult('Skip Loading Request', true);
    this.httpDemoService.getNotificationData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<any>) => {
          this.lastResponse = response;
          this.addDemoResult('Skip Loading Request', true, 'Data retrieved without loading indicator');
        },
        error: (error) => {
          this.addDemoResult('Skip Loading Request', false, undefined, error.message);
        }
      });
  }

  // Real external API call
  getRealPosts(): void {
    this.addDemoResult('Real API Call', true);
    this.httpDemoService.getRealPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<any>) => {
          this.lastResponse = response;
          this.addDemoResult('Real API Call', true, `Retrieved ${response.data.length} posts from JSONPlaceholder`);
        },
        error: (error) => {
          this.addDemoResult('Real API Call', false, undefined, error.message);
        }
      });
  }

  // Utility methods
  clearResults(): void {
    this.demoResults = [];
    this.lastResponse = null;
    this.selectedService = null;
  }

  clearNotifications(): void {
    this.notificationService.clearAll();
  }

  // TrackBy functions for *ngFor optimization
  trackByIndex(index: number): number {
    return index;
  }

  trackByServiceId(index: number, service: MockService): string {
    return service.id;
  }

  private addDemoResult(action: string, success: boolean, data?: string, error?: string): void {
    this.demoResults.unshift({
      action,
      success,
      data,
      error,
    });
    
    // Keep only last 20 results
    if (this.demoResults.length > 20) {
      this.demoResults = this.demoResults.slice(0, 20);
    }
  }
}