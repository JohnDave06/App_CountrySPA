import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { GuardUtilsService } from '../../../core/guards/route-guards.service';

export interface RouteInfo {
  path: string;
  title: string;
  description: string;
  requiresAuth: boolean;
  permissions?: string[];
  children?: RouteInfo[];
}

export interface NavigationHistory {
  path: string;
  title: string;
  timestamp: Date;
  params: any;
  queryParams: any;
}

@Component({
  selector: 'app-nested-routes-demo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="nested-routes-demo-container">
      <!-- Header -->
      <div class="card bg-primary text-primary-content mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-2">
            <span class="mr-2">🗺️</span>
            Nested Routes & Route Guards Demo
          </h2>
          <p class="text-base-content/80">
            Demonstrating advanced routing patterns with nested routes, route guards, and data resolution.
          </p>
          
          <div class="stats stats-horizontal bg-base-100 text-base-content mt-4">
            <div class="stat">
              <div class="stat-title">Current Route</div>
              <div class="stat-value text-primary text-sm">{{ currentRoute }}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Auth Status</div>
              <div class="stat-value" [class]="userInfo.isAuthenticated ? 'text-success' : 'text-error'">
                {{ userInfo.isAuthenticated ? 'Authenticated' : 'Guest' }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">User Role</div>
              <div class="stat-value text-secondary">{{ userInfo.role || 'None' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Route Navigation -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h3 class="card-title mb-4">Route Navigation</h3>
              
              <!-- Authentication Controls -->
              <div class="mb-4">
                <h4 class="font-semibold mb-2">Authentication</h4>
                <div class="flex gap-2 mb-2">
                  <button class="btn btn-sm btn-success" 
                          (click)="simulateLogin('user')"
                          [disabled]="userInfo.isAuthenticated">
                    Login as User
                  </button>
                  <button class="btn btn-sm btn-warning" 
                          (click)="simulateLogin('admin')"
                          [disabled]="userInfo.isAuthenticated">
                    Login as Admin
                  </button>
                </div>
                <button class="btn btn-sm btn-error w-full" 
                        (click)="simulateLogout()"
                        [disabled]="!userInfo.isAuthenticated">
                  Logout
                </button>
              </div>

              <div class="divider"></div>

              <!-- Route Tree -->
              <div class="space-y-2">
                <div *ngFor="let route of routeTree" class="space-y-1">
                  <div class="flex items-center justify-between p-2 rounded"
                       [class]="getRouteClass(route)">
                    <div class="flex-1">
                      <button class="btn btn-ghost btn-sm justify-start w-full" 
                              (click)="navigateToRoute(route.path)">
                        <span class="truncate">{{ route.title }}</span>
                      </button>
                    </div>
                    <div class="flex gap-1">
                      <span *ngIf="route.requiresAuth" 
                            class="badge badge-warning badge-xs" 
                            title="Requires Authentication">🔒</span>
                      <span *ngIf="route.permissions?.length" 
                            class="badge badge-info badge-xs" 
                            title="Requires Permissions">👮</span>
                    </div>
                  </div>
                  
                  <!-- Child Routes -->
                  <div *ngIf="route.children" class="ml-4 space-y-1">
                    <div *ngFor="let child of route.children" 
                         class="flex items-center justify-between p-1 rounded text-sm"
                         [class]="getRouteClass(child)">
                      <button class="btn btn-ghost btn-xs justify-start flex-1" 
                              (click)="navigateToRoute(child.path)">
                        <span class="truncate">{{ child.title }}</span>
                      </button>
                      <div class="flex gap-1">
                        <span *ngIf="child.requiresAuth" 
                              class="badge badge-warning badge-xs">🔒</span>
                        <span *ngIf="child.permissions?.length" 
                              class="badge badge-info badge-xs">👮</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User Permissions -->
          <div class="card bg-base-100 shadow-lg mt-4">
            <div class="card-body">
              <h3 class="card-title mb-4">User Permissions</h3>
              <div class="space-y-2">
                <div *ngFor="let permission of userInfo.permissions" 
                     class="badge badge-primary">
                  {{ permission }}
                </div>
                <div *ngIf="userInfo.permissions.length === 0" 
                     class="text-base-content/60 text-sm">
                  No permissions assigned
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="lg:col-span-2">
          <!-- Current Route Info -->
          <div class="card bg-base-100 shadow-lg mb-4">
            <div class="card-body">
              <h3 class="card-title">Current Route Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-medium text-base-content/70">Path</div>
                  <div class="font-mono text-sm">{{ currentRoute || '/' }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-base-content/70">Title</div>
                  <div>{{ routeData?.title || 'No title' }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-base-content/70">Parameters</div>
                  <div class="font-mono text-sm">{{ getRouteParams() }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-base-content/70">Query Params</div>
                  <div class="font-mono text-sm">{{ getQueryParams() }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Route Testing -->
          <div class="card bg-base-100 shadow-lg mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">Route Testing</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Quick Navigation -->
                <div>
                  <h4 class="font-semibold mb-2">Quick Navigation</h4>
                  <div class="space-y-2">
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateToRoute('/services')">
                      Services Home
                    </button>
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateToRoute('/services/category/masajes')">
                      Services by Category
                    </button>
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateToRoute('/services/detail/1')">
                      Service Detail
                    </button>
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateToRoute('/services/detail/1/booking')">
                      Service Booking (Auth Required)
                    </button>
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateToRoute('/services/management')">
                      Management (Admin Required)
                    </button>
                  </div>
                </div>

                <!-- Route Parameters Testing -->
                <div>
                  <h4 class="font-semibold mb-2">Parameter Testing</h4>
                  <div class="space-y-2">
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateWithParams()">
                      Navigate with Parameters
                    </button>
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateWithQuery()">
                      Navigate with Query Params
                    </button>
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="navigateWithFragment()">
                      Navigate with Fragment
                    </button>
                    <button class="btn btn-outline btn-sm w-full" 
                            (click)="testGuardBlocking()">
                      Test Guard Blocking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation History -->
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h3 class="card-title mb-4">Navigation History</h3>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div *ngFor="let entry of navigationHistory; let i = index" 
                     class="flex items-center justify-between p-2 bg-base-200 rounded">
                  <div class="flex-1">
                    <div class="font-medium">{{ entry.title }}</div>
                    <div class="text-sm text-base-content/70 font-mono">{{ entry.path }}</div>
                    <div class="text-xs text-base-content/50">
                      {{ formatDate(entry.timestamp) }}
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-xs" 
                          (click)="navigateToRoute(entry.path)">
                    Go
                  </button>
                </div>
                <div *ngIf="navigationHistory.length === 0" 
                     class="text-center text-base-content/60 py-4">
                  No navigation history yet
                </div>
              </div>
              <div class="card-actions justify-end mt-4">
                <button class="btn btn-sm btn-outline" 
                        (click)="clearHistory()">
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Nested Route Outlet -->
      <div class="mt-6 p-4 border-2 border-dashed border-base-300 rounded-lg">
        <h3 class="text-lg font-semibold mb-4">Nested Route Content</h3>
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .nested-routes-demo-container {
      padding: 1rem;
      min-height: 100vh;
      background-color: #f8fafc;
    }

    .route-active {
      background-color: rgb(var(--primary) / 0.1);
      border-left: 3px solid rgb(var(--primary));
    }

    .route-blocked {
      background-color: rgb(var(--error) / 0.1);
      border-left: 3px solid rgb(var(--error));
    }

    .route-available {
      background-color: rgb(var(--success) / 0.1);
      border-left: 3px solid rgb(var(--success));
    }
  `]
})
export class NestedRoutesDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentRoute = '';
  routeData: any = {};
  userInfo: any = {};
  navigationHistory: NavigationHistory[] = [];

  routeTree: RouteInfo[] = [
    {
      path: '/services',
      title: 'Services Home',
      description: 'Main services page',
      requiresAuth: false,
      children: [
        {
          path: '/services/category/masajes',
          title: 'Category: Masajes',
          description: 'Services filtered by category',
          requiresAuth: false,
          permissions: ['view-services']
        },
        {
          path: '/services/detail/1',
          title: 'Service Detail',
          description: 'Detailed service information',
          requiresAuth: false,
          children: [
            {
              path: '/services/detail/1/overview',
              title: 'Overview',
              description: 'Service overview',
              requiresAuth: false
            },
            {
              path: '/services/detail/1/booking',
              title: 'Booking',
              description: 'Book this service',
              requiresAuth: true,
              permissions: ['book-service']
            },
            {
              path: '/services/detail/1/reviews',
              title: 'Reviews',
              description: 'Service reviews',
              requiresAuth: false
            }
          ]
        }
      ]
    },
    {
      path: '/services/booking',
      title: 'My Bookings',
      description: 'Manage bookings',
      requiresAuth: true,
      permissions: ['view-bookings']
    },
    {
      path: '/services/management',
      title: 'Service Management',
      description: 'Admin panel for services',
      requiresAuth: true,
      permissions: ['manage-services'],
      children: [
        {
          path: '/services/management/create',
          title: 'Create Service',
          description: 'Create new service',
          requiresAuth: true,
          permissions: ['create-service']
        },
        {
          path: '/services/management/analytics',
          title: 'Analytics',
          description: 'Service analytics',
          requiresAuth: true,
          permissions: ['view-analytics']
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private guardUtils: GuardUtilsService
  ) {}

  ngOnInit(): void {
    this.updateUserInfo();
    this.subscribeToRouteChanges();
    this.loadNavigationHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToRouteChanges(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const navEvent = event as NavigationEnd;
        this.currentRoute = navEvent.url;
        this.routeData = this.route.snapshot.data;
        this.addToNavigationHistory(navEvent.url);
      });

    // Initial route
    this.currentRoute = this.router.url;
    this.routeData = this.route.snapshot.data;
  }

  private updateUserInfo(): void {
    this.userInfo = this.guardUtils.getCurrentUser();
  }

  simulateLogin(role: 'user' | 'admin'): void {
    this.guardUtils.simulateLogin(role);
    this.updateUserInfo();
  }

  simulateLogout(): void {
    this.guardUtils.simulateLogout();
    this.updateUserInfo();
  }

  navigateToRoute(path: string): void {
    this.router.navigate([path]).catch(error => {
      console.error('Navigation failed:', error);
    });
  }

  navigateWithParams(): void {
    this.router.navigate(['/services/detail', Math.floor(Math.random() * 5) + 1]);
  }

  navigateWithQuery(): void {
    this.router.navigate(['/services'], {
      queryParams: { 
        category: 'masajes',
        priceMin: 100,
        priceMax: 300,
        page: 1
      }
    });
  }

  navigateWithFragment(): void {
    this.router.navigate(['/services/detail/1'], {
      fragment: 'reviews'
    });
  }

  testGuardBlocking(): void {
    // Try to access admin route without proper permissions
    this.router.navigate(['/services/management']).catch(error => {
      console.error('Navigation blocked by guard:', error);
    });
  }

  getRouteClass(route: RouteInfo): string {
    const classes = [];
    
    if (this.currentRoute === route.path) {
      classes.push('route-active');
    } else if (this.canAccessRoute(route)) {
      classes.push('route-available');
    } else {
      classes.push('route-blocked');
    }
    
    return classes.join(' ');
  }

  private canAccessRoute(route: RouteInfo): boolean {
    if (route.requiresAuth && !this.userInfo.isAuthenticated) {
      return false;
    }

    if (route.permissions && route.permissions.length > 0) {
      return route.permissions.every(permission => 
        this.userInfo.permissions.includes(permission)
      );
    }

    return true;
  }

  getRouteParams(): string {
    const params = this.route.snapshot.params;
    return Object.keys(params).length > 0 ? JSON.stringify(params) : 'None';
  }

  getQueryParams(): string {
    const queryParams = this.route.snapshot.queryParams;
    return Object.keys(queryParams).length > 0 ? JSON.stringify(queryParams) : 'None';
  }

  private addToNavigationHistory(path: string): void {
    const entry: NavigationHistory = {
      path,
      title: this.routeData?.title || 'Unknown',
      timestamp: new Date(),
      params: { ...this.route.snapshot.params },
      queryParams: { ...this.route.snapshot.queryParams }
    };

    this.navigationHistory.unshift(entry);
    
    // Keep only last 10 entries
    if (this.navigationHistory.length > 10) {
      this.navigationHistory = this.navigationHistory.slice(0, 10);
    }

    this.saveNavigationHistory();
  }

  private loadNavigationHistory(): void {
    const saved = localStorage.getItem('navigation-history');
    if (saved) {
      try {
        this.navigationHistory = JSON.parse(saved).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      } catch (error) {
        console.warn('Failed to load navigation history:', error);
        this.navigationHistory = [];
      }
    }
  }

  private saveNavigationHistory(): void {
    localStorage.setItem('navigation-history', JSON.stringify(this.navigationHistory));
  }

  clearHistory(): void {
    this.navigationHistory = [];
    localStorage.removeItem('navigation-history');
  }

  formatDate(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}