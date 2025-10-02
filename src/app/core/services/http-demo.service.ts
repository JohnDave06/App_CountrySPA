import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface MockService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  availability: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HttpDemoService {
  private readonly baseUrl = 'https://jsonplaceholder.typicode.com';
  private readonly mockServices: MockService[] = [
    {
      id: '1',
      name: 'Web Development',
      description: 'Custom web development services',
      price: 1500,
      category: 'technology',
      rating: 4.8,
      availability: true
    },
    {
      id: '2',
      name: 'Digital Marketing',
      description: 'Complete digital marketing strategy',
      price: 800,
      category: 'marketing',
      rating: 4.6,
      availability: true
    },
    {
      id: '3',
      name: 'Graphic Design',
      description: 'Professional graphic design services',
      price: 600,
      category: 'design',
      rating: 4.9,
      availability: false
    }
  ];

  constructor(private http: HttpClient) {}

  // Simulate successful API calls
  getServices(): Observable<ApiResponse<MockService[]>> {
    return of({
      data: this.mockServices,
      message: 'Services retrieved successfully',
      status: 'success' as const,
      timestamp: new Date().toISOString()
    }).pipe(
      delay(1500) // Simulate network delay
    );
  }

  getServiceById(id: string): Observable<ApiResponse<MockService | null>> {
    const service = this.mockServices.find(s => s.id === id);
    const response: ApiResponse<MockService | null> = {
      data: service || null,
      message: service ? 'Service found' : 'Service not found',
      status: service ? 'success' : 'error',
      timestamp: new Date().toISOString()
    };
    return of(response).pipe(
      delay(800)
    );
  }

  // Simulate slow request (triggers performance warning)
  getSlowData(): Observable<ApiResponse<any>> {
    const response: ApiResponse<any> = {
      data: { message: 'This was a slow request' },
      message: 'Slow data retrieved',
      status: 'success',
      timestamp: new Date().toISOString()
    };
    return of(response).pipe(
      delay(3000) // 3 seconds delay
    );
  }

  // Simulate different error scenarios
  triggerNetworkError(): Observable<any> {
    return throwError(() => new Error('Network error simulation'));
  }

  trigger401Error(): Observable<any> {
    return this.http.get(`${this.baseUrl}/nonexistent-auth-endpoint`).pipe(
      switchMap(() => throwError(() => ({ status: 401, error: { message: 'Unauthorized access' } })))
    );
  }

  trigger404Error(): Observable<any> {
    return this.http.get(`${this.baseUrl}/nonexistent-endpoint-12345`);
  }

  trigger500Error(): Observable<any> {
    return of(null).pipe(
      delay(500),
      switchMap(() => throwError(() => ({ 
        status: 500, 
        error: { message: 'Internal server error simulation' } 
      })))
    );
  }

  triggerValidationError(): Observable<any> {
    return of(null).pipe(
      delay(300),
      switchMap(() => throwError(() => ({ 
        status: 422, 
        error: { 
          message: 'Validation failed',
          errors: {
            name: ['Name is required'],
            email: ['Email must be valid', 'Email is already taken']
          }
        } 
      })))
    );
  }

  // Test authenticated requests
  getProtectedData(): Observable<ApiResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/posts/1`).pipe(
      map(data => ({
        data,
        message: 'Protected data retrieved successfully',
        status: 'success' as const,
        timestamp: new Date().toISOString()
      })),
      delay(1000)
    );
  }

  // Test skip loading requests
  getNotificationData(): Observable<ApiResponse<any>> {
    const headers = new HttpHeaders({ 'skip-loading': 'true' });
    return this.http.get<any>(`${this.baseUrl}/posts/2`, { headers }).pipe(
      map(data => ({
        data,
        message: 'Notification data retrieved',
        status: 'success' as const,
        timestamp: new Date().toISOString()
      })),
      delay(500)
    );
  }

  // Simulate POST request with success notification
  createService(service: Partial<MockService>): Observable<ApiResponse<MockService>> {
    const newService: MockService = {
      id: Date.now().toString(),
      name: service.name || 'New Service',
      description: service.description || 'New service description',
      price: service.price || 0,
      category: service.category || 'general',
      rating: 0,
      availability: true
    };

    const response: ApiResponse<MockService> = {
      data: newService,
      message: 'Service created successfully',
      status: 'success',
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(
      delay(1200)
    );
  }

  // Simulate PUT request
  updateService(id: string, updates: Partial<MockService>): Observable<ApiResponse<MockService | null>> {
    const serviceIndex = this.mockServices.findIndex(s => s.id === id);
    
    if (serviceIndex === -1) {
      return throwError(() => ({ 
        status: 404, 
        error: { message: 'Service not found' } 
      }));
    }

    const updatedService = { ...this.mockServices[serviceIndex], ...updates };
    const response: ApiResponse<MockService> = {
      data: updatedService,
      message: 'Service updated successfully',
      status: 'success',
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(
      delay(1000)
    );
  }

  // Simulate DELETE request
  deleteService(id: string): Observable<ApiResponse<null>> {
    const serviceExists = this.mockServices.some(s => s.id === id);
    
    if (!serviceExists) {
      return throwError(() => ({ 
        status: 404, 
        error: { message: 'Service not found' } 
      }));
    }

    const response: ApiResponse<null> = {
      data: null,
      message: 'Service deleted successfully',
      status: 'success',
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(
      delay(800)
    );
  }

  // Real external API call (for testing interceptors with actual HTTP)
  getRealPosts(): Observable<any> {
    return this.http.get<any[]>(`${this.baseUrl}/posts`).pipe(
      map(posts => ({
        data: posts.slice(0, 5), // Only first 5 posts
        message: 'Posts retrieved from external API',
        status: 'success',
        timestamp: new Date().toISOString()
      }))
    );
  }
}