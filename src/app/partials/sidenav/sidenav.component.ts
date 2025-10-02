import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ServiceCategory {
  name: string;
  code: string;
  icon: string;
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {
  @Input() isOpen: boolean = false;
  @Output() closeNav = new EventEmitter<void>();

  serviceCategories: ServiceCategory[] = [
    { name: 'Masajes', code: 'massage', icon: '💆‍♀️' },
    { name: 'Tratamientos Faciales', code: 'facial', icon: '✨' },
    { name: 'Piscinas', code: 'pools', icon: '🏊‍♀️' },
    { name: 'Deportes', code: 'sports', icon: '⚽' },
    { name: 'Actividades', code: 'activities', icon: '🎯' }
  ];

  closeSidenav(): void {
    this.closeNav.emit();
  }
}
