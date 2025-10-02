import { Component, OnInit, OnDestroy } from '@angular/core';
import { SpaServicesService, SpaService } from '../../services/spa-services/spa-services.service';
import { ServiceCardData, ServiceAction } from '../../shared/components/service-card/service-card.component';
import { FilterData } from '../../shared/components/service-filter/service-filter.component';
import { StateManagementService } from '../../shared/services/state-management.service';
import { NotificationService } from '../../shared/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-services-screen',
  templateUrl: './services-screen.component.html',
  styleUrls: ['./services-screen.component.css']
})
export class ServicesScreenComponent implements OnInit, OnDestroy {
  services: SpaService[] = [];
  filteredServices: ServiceCardData[] = [];
  loading = true;
  categories: string[] = [];
  favorites: Set<string> = new Set();
  priceRange = { min: 0, max: 500000 };

  private destroy$ = new Subject<void>();

  constructor(
    private spaServicesService: SpaServicesService,
    private stateService: StateManagementService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.stateService.setCurrentPage('services');
    this.initializeSubscriptions();
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSubscriptions(): void {
    // Subscribe to favorites from state service
    this.stateService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
      });

    // Subscribe to loading state
    this.stateService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    // Listen to notification events
    this.notificationService.on('service-booked')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('Service booked event received:', data);
      });
  }

  loadServices(): void {
    this.stateService.setLoading(true);
    
    this.spaServicesService.getServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (services: SpaService[]) => {
          this.services = services;
          this.categories = [...new Set(services.map(s => s.category))];
          this.priceRange = {
            min: Math.min(...services.map(s => s.price)),
            max: Math.max(...services.map(s => s.price))
          };
          this.updateFilteredServices(services);
          this.stateService.setLoading(false);
          
          this.notificationService.infoToast(
            'Servicios Cargados',
            `Se cargaron ${services.length} servicios disponibles`,
            { duration: 3000 }
          );
        },
        error: (error: any) => {
          console.error('Error loading services:', error);
          this.stateService.setLoading(false);
          this.stateService.setError('No se pudieron cargar los servicios');
          
          this.notificationService.errorToast(
            'Error de Carga',
            'No se pudieron cargar los servicios. Por favor intenta de nuevo.',
            {
              action: {
                label: 'Reintentar',
                handler: () => this.loadServices()
              }
            }
          );
        }
      });
  }

  private updateFilteredServices(services: SpaService[]): void {
    this.filteredServices = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      icon: this.getServiceIcon(service.category),
      rating: service.rating || this.generateRating(),
      reviews: service.reviewCount || this.generateReviews(),
      available: service.isActive && Math.random() > 0.2, // 80% available if active
      image: service.images && service.images.length > 0 ? service.images[0] : undefined
    }));
  }

  private getServiceIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'masajes': '💆‍♀️',
      'faciales': '✨',
      'corporales': '🧴',
      'relajacion': '🧘‍♀️',
      'deportivos': '🏃‍♀️',
      'especiales': '🌟'
    };
    return iconMap[category] || '🧘‍♀️';
  }

  private generateRating(): number {
    return Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 - 5.0
  }

  private generateReviews(): number {
    return Math.floor(Math.random() * 100) + 10; // 10 - 110 reviews
  }

  // Handler for filter changes from ServiceFilterComponent (@Output)
  onFilterChange(filterData: FilterData): void {
    let filtered = [...this.services];

    // Apply search filter
    if (filterData.searchTerm) {
      const term = filterData.searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (filterData.category && filterData.category !== 'all') {
      filtered = filtered.filter(service => service.category === filterData.category);
    }

    // Apply price range filter
    filtered = filtered.filter(service =>
      service.price >= filterData.priceRange.min &&
      service.price <= filterData.priceRange.max
    );

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filterData.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'rating':
          comparison = Math.random() - 0.5;
          break;
      }
      return filterData.sortOrder === 'desc' ? -comparison : comparison;
    });

    this.updateFilteredServices(filtered);
  }

  // Handler for individual search term changes (with debounce) (@Output)
  onSearchTermChange(searchTerm: string): void {
    console.log('Search term changed:', searchTerm);
    
    // Add to search history via state service
    if (searchTerm.trim()) {
      this.stateService.addToSearchHistory(searchTerm.trim());
    }
    
    // The filter component handles debouncing internally
  }

  // Handler for category changes (@Output)
  onCategoryChange(category: string): void {
    console.log('Category changed:', category);
  }

  // Handler for price range changes (@Output)
  onPriceRangeChange(priceRange: { min: number; max: number }): void {
    console.log('Price range changed:', priceRange);
  }

  // Handler for service card actions (@Output)
  onServiceAction(action: ServiceAction): void {
    console.log('Service action:', action);
    
    switch (action.type) {
      case 'book':
        this.bookService(action.service);
        break;
      case 'favorite':
        this.toggleFavorite(action.service.id);
        break;
      case 'share':
        this.shareService(action.service);
        break;
      case 'info':
        this.showServiceInfo(action.service);
        break;
    }
  }

  // Handler for favorite toggle (@Output)
  onFavoriteToggle(event: { serviceId: string; isFavorite: boolean }): void {
    if (event.isFavorite) {
      this.favorites.add(event.serviceId);
    } else {
      this.favorites.delete(event.serviceId);
    }
    console.log('Favorites updated:', Array.from(this.favorites));
  }

  // Handler for card clicks (@Output)
  onCardClick(service: ServiceCardData): void {
    console.log('Card clicked:', service);
    this.showServiceInfo(service);
  }

  private bookService(service: ServiceCardData): void {
    // Add to cart via state service
    this.stateService.addToCart({
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      duration: service.duration,
      quantity: 1
    });

    // Trigger notification
    this.notificationService.serviceBooked(service.name, `booking_${Date.now()}`);
    
    // Emit custom event for component communication
    this.notificationService.emit('add-to-cart', {
      service: service,
      timestamp: new Date()
    });
  }

  private toggleFavorite(serviceId: string): void {
    const service = this.filteredServices.find(s => s.id === serviceId);
    const serviceName = service ? service.name : 'Servicio';
    
    if (this.stateService.isFavorite(serviceId)) {
      this.stateService.removeFromFavorites(serviceId);
      this.notificationService.favoriteRemoved(serviceName);
    } else {
      this.stateService.addToFavorites(serviceId);
      this.notificationService.favoriteAdded(serviceName);
    }
  }

  private shareService(service: ServiceCardData): void {
    if (navigator.share) {
      navigator.share({
        title: `${service.name} - Country SPA`,
        text: service.description,
        url: window.location.href
      }).then(() => {
        this.notificationService.successToast(
          'Compartido',
          `${service.name} fue compartido exitosamente`,
          { duration: 2000 }
        );
      }).catch((error) => {
        console.error('Error sharing:', error);
        this.fallbackShareService(service);
      });
    } else {
      this.fallbackShareService(service);
    }
  }

  private fallbackShareService(service: ServiceCardData): void {
    const shareText = `${service.name}: ${service.description}\n\nPrecio: $${service.price.toLocaleString()}\nDuración: ${service.duration} min\n\n¡Visita Country SPA!`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      this.notificationService.successToast(
        'Copiado al Portapapeles',
        'La información del servicio fue copiada. ¡Compártela donde quieras!',
        { duration: 3000 }
      );
    }).catch(() => {
      this.notificationService.warningToast(
        'No se pudo copiar',
        'Información del servicio disponible para compartir manualmente',
        { duration: 4000 }
      );
    });
  }

  private showServiceInfo(service: ServiceCardData): void {
    alert(`Información del servicio:\n\n${service.name}\n\n${service.description}\n\nPrecio: $${service.price.toLocaleString()}\nDuración: ${service.duration} min\nCategoría: ${service.category}`);
  }

  isFavorite(serviceId: string): boolean {
    return this.stateService.isFavorite(serviceId);
  }

  trackByServiceId(index: number, service: ServiceCardData): string {
    return service.id;
  }
}