import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export interface ServiceCardData {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  icon: string;
  image?: string;
  rating?: number;
  reviews?: number;
  available?: boolean;
}

export interface ServiceAction {
  type: 'book' | 'favorite' | 'share' | 'info';
  service: ServiceCardData;
}

@Component({
  selector: 'app-service-card',
  templateUrl: './service-card.component.html',
  styleUrls: ['./service-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceCardComponent {
  @Input() service!: ServiceCardData;
  @Input() showBookButton: boolean = true;
  @Input() showFavoriteButton: boolean = true;
  @Input() showRating: boolean = true;
  @Input() cardSize: 'small' | 'medium' | 'large' = 'medium';
  @Input() isFavorite: boolean = false;

  @Output() serviceAction = new EventEmitter<ServiceAction>();
  @Output() favoriteToggle = new EventEmitter<{ serviceId: string; isFavorite: boolean }>();
  @Output() cardClick = new EventEmitter<ServiceCardData>();

  onBook(): void {
    this.serviceAction.emit({
      type: 'book',
      service: this.service
    });
  }

  onToggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
    this.favoriteToggle.emit({
      serviceId: this.service.id,
      isFavorite: this.isFavorite
    });
    
    this.serviceAction.emit({
      type: 'favorite',
      service: this.service
    });
  }

  onShare(): void {
    this.serviceAction.emit({
      type: 'share',
      service: this.service
    });
  }

  onMoreInfo(): void {
    this.serviceAction.emit({
      type: 'info',
      service: this.service
    });
  }

  onCardClick(): void {
    this.cardClick.emit(this.service);
  }

  get cardClasses(): string {
    const baseClasses = 'card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer';
    const sizeClasses = {
      small: 'w-64',
      medium: 'w-80',
      large: 'w-96'
    };
    return `${baseClasses} ${sizeClasses[this.cardSize]}`;
  }

  get priceFormatted(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(this.service.price);
  }

  get durationFormatted(): string {
    if (this.service.duration < 60) {
      return `${this.service.duration} min`;
    }
    const hours = Math.floor(this.service.duration / 60);
    const minutes = this.service.duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
}