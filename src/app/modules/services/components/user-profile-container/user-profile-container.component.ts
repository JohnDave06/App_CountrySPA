import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-profile-container',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="user-profile-container">
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <!-- Profile Header -->
          <div class="flex items-center space-x-6 mb-8">
            <div class="avatar">
              <div class="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-content text-2xl font-bold">
                {{ userProfile?.name?.charAt(0) || 'U' }}
              </div>
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold">{{ userProfile?.name || 'Usuario' }}</h1>
              <p class="text-lg text-base-content/70">{{ userProfile?.email || 'email@ejemplo.com' }}</p>
              <div class="badge badge-primary mt-2">{{ userProfile?.membershipType || 'Premium' }}</div>
            </div>
            <button class="btn btn-outline">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Editar Perfil
            </button>
          </div>

          <!-- Navigation Tabs -->
          <div class="tabs tabs-boxed mb-6">
            <a routerLink="info" 
               routerLinkActive="tab-active" 
               class="tab">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Información Personal
            </a>
            <a routerLink="preferences" 
               routerLinkActive="tab-active" 
               class="tab">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Preferencias
            </a>
            <a routerLink="history" 
               routerLinkActive="tab-active" 
               class="tab">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Historial
            </a>
            <a routerLink="membership" 
               routerLinkActive="tab-active" 
               class="tab">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              Membresía
            </a>
          </div>

          <!-- Child Route Content -->
          <div class="nested-content">
            <router-outlet></router-outlet>
          </div>

          <!-- Data Resolver Demo -->
          <div class="card bg-info text-info-content mt-6" *ngIf="userProfile">
            <div class="card-body">
              <h3 class="card-title text-sm">Demostración de Data Resolver</h3>
              <p class="text-xs">
                Los datos del perfil se cargaron usando UserProfileResolver antes de mostrar el componente.
              </p>
              <div class="text-xs mt-2">
                <strong>Resolver:</strong> UserProfileResolver<br>
                <strong>Datos cargados:</strong> {{ ObjectKeys(userProfile || {}).length }} propiedades<br>
                <strong>Tiempo de carga:</strong> Instantáneo (datos pre-cargados)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-profile-container {
      padding: 1rem;
      animation: slideIn 0.5s ease-out;
    }
    
    .nested-content {
      min-height: 300px;
      border-radius: 0.5rem;
      background: var(--fallback-b2, oklch(var(--b2)));
      padding: 1.5rem;
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0; 
        transform: translateY(-20px);
      }
      to { 
        opacity: 1; 
        transform: translateY(0);
      }
    }
    
    .tab {
      transition: all 0.2s ease;
    }
    
    .tab:hover {
      transform: translateY(-1px);
    }
  `]
})
export class UserProfileContainerComponent implements OnInit {
  userProfile: any = null;

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get resolved data from route
    this.userProfile = this.route.snapshot.data['userProfile'];
    
    // If no resolved data, use mock data
    if (!this.userProfile) {
      this.userProfile = {
        id: 'user-001',
        name: 'Ana García',
        email: 'ana.garcia@email.com',
        phone: '+52 55 1234-5678',
        membershipType: 'Premium',
        joinDate: '2023-01-15',
        totalVisits: 42,
        favoriteServices: ['Masaje Relajante', 'Facial Premium'],
        preferences: {
          notifications: true,
          newsletter: true,
          language: 'es'
        }
      };
    }
  }

  // Helper method for template
  get ObjectKeys() {
    return Object.keys;
  }
}