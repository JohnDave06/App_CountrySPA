import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Breadcrumb {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
  @Input() title: string = 'Bienvenido al Country SPA';
  @Input() subtitle?: string;
  @Input() breadcrumbs?: Breadcrumb[];
  @Input() showAction: boolean = false;
  @Input() actionText: string = 'Reservar Ahora';
  @Output() actionClick = new EventEmitter<void>();

  onAction(): void {
    this.actionClick.emit();
  }
}
