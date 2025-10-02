import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-screen',
  templateUrl: './admin-screen.component.html',
  styleUrls: ['./admin-screen.component.css']
})
export class AdminScreenComponent implements OnInit {
  currentSection = 'overview';
  
  sections = [
    { id: 'overview', name: 'Vista General', icon: '◦' },
    { id: 'communication', name: 'Comunicación Componentes', icon: '↻' },
    { id: 'services', name: 'Servicios Compartidos', icon: '⚙' },
    { id: 'signals', name: 'Angular Signals', icon: '⚡' },
    { id: 'http', name: 'HTTP Interceptors', icon: '⌘' },
    { id: 'rxjs', name: 'RxJS Operators', icon: '∞' },
    { id: 'cache', name: 'Sistema de Caché', icon: '∎' },
    { id: 'query', name: 'Query Parameters', icon: '⌕' },
    { id: 'routes', name: 'Rutas Anidadas', icon: '≡' },
    { id: 'pwa', name: 'PWA Features', icon: '▣' },
    { id: 'offline', name: 'Funcionalidad Offline', icon: '◐' },
    { id: 'notifications', name: 'Notificaciones Push', icon: '◉' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  setActiveSection(sectionId: string): void {
    this.currentSection = sectionId;
  }
}