import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-preferences-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-preferences-tab">
      <h2 class="text-xl font-bold mb-6">Preferencias de Usuario</h2>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Notification Preferences -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z"/>
              </svg>
              Notificaciones
            </h3>
            
            <div class="space-y-4">
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Recordatorios de citas</span>
                  <input type="checkbox" 
                         class="toggle toggle-primary" 
                         checked>
                </label>
                <div class="text-xs text-base-content/60 ml-0">
                  Recibe recordatorios 24h y 2h antes de tu cita
                </div>
              </div>
              
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Ofertas especiales</span>
                  <input type="checkbox" 
                         class="toggle toggle-primary" 
                         checked>
                </label>
                <div class="text-xs text-base-content/60 ml-0">
                  Notificaciones sobre promociones y descuentos
                </div>
              </div>
              
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Nuevos servicios</span>
                  <input type="checkbox" 
                         class="toggle toggle-primary">
                </label>
                <div class="text-xs text-base-content/60 ml-0">
                  Información sobre nuevos tratamientos disponibles
                </div>
              </div>
              
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Newsletter mensual</span>
                  <input type="checkbox" 
                         class="toggle toggle-primary" 
                         checked>
                </label>
                <div class="text-xs text-base-content/60 ml-0">
                  Tips de bienestar y novedades del spa
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Booking Preferences -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Preferencias de Reserva
            </h3>
            
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Horario preferido</span>
                </label>
                <select class="select select-bordered">
                  <option value="morning">Mañana (9:00 - 12:00)</option>
                  <option value="afternoon" selected>Tarde (13:00 - 17:00)</option>
                  <option value="evening">Noche (18:00 - 21:00)</option>
                </select>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Duración preferida</span>
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <label class="label cursor-pointer">
                    <input type="radio" 
                           name="duration" 
                           class="radio radio-primary" 
                           value="60">
                    <span class="label-text text-sm">60 min</span>
                  </label>
                  <label class="label cursor-pointer">
                    <input type="radio" 
                           name="duration" 
                           class="radio radio-primary" 
                           value="90" 
                           checked>
                    <span class="label-text text-sm">90 min</span>
                  </label>
                  <label class="label cursor-pointer">
                    <input type="radio" 
                           name="duration" 
                           class="radio radio-primary" 
                           value="120">
                    <span class="label-text text-sm">120 min</span>
                  </label>
                </div>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Terapeuta preferido</span>
                </label>
                <select class="select select-bordered">
                  <option value="">Sin preferencia</option>
                  <option value="maria" selected>María González</option>
                  <option value="carmen">Carmen López</option>
                  <option value="lucia">Lucía Martínez</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Treatment Preferences -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              Preferencias de Tratamiento
            </h3>
            
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Intensidad de presión</span>
                </label>
                <div class="range range-primary">
                  <input type="range" 
                         min="1" 
                         max="5" 
                         value="3" 
                         class="range">
                </div>
                <div class="w-full flex justify-between text-xs px-2">
                  <span>Suave</span>
                  <span>Medio</span>
                  <span>Fuerte</span>
                </div>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Temperatura ambiente</span>
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <label class="label cursor-pointer">
                    <input type="radio" 
                           name="temperature" 
                           class="radio radio-primary" 
                           value="cool">
                    <span class="label-text text-sm">Fresca</span>
                  </label>
                  <label class="label cursor-pointer">
                    <input type="radio" 
                           name="temperature" 
                           class="radio radio-primary" 
                           value="warm" 
                           checked>
                    <span class="label-text text-sm">Cálida</span>
                  </label>
                  <label class="label cursor-pointer">
                    <input type="radio" 
                           name="temperature" 
                           class="radio radio-primary" 
                           value="hot">
                    <span class="label-text text-sm">Caliente</span>
                  </label>
                </div>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Aromas favoritos</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  <div class="badge badge-primary cursor-pointer">Lavanda</div>
                  <div class="badge badge-outline cursor-pointer">Eucalipto</div>
                  <div class="badge badge-primary cursor-pointer">Menta</div>
                  <div class="badge badge-outline cursor-pointer">Naranja</div>
                  <div class="badge badge-outline cursor-pointer">Ylang-ylang</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy & Security -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Privacidad y Seguridad
            </h3>
            
            <div class="space-y-4">
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Perfil público</span>
                  <input type="checkbox" 
                         class="toggle toggle-primary">
                </label>
                <div class="text-xs text-base-content/60 ml-0">
                  Permite que otros usuarios vean tu perfil
                </div>
              </div>
              
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Compartir estadísticas</span>
                  <input type="checkbox" 
                         class="toggle toggle-primary" 
                         checked>
                </label>
                <div class="text-xs text-base-content/60 ml-0">
                  Ayuda a mejorar nuestros servicios
                </div>
              </div>
              
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Autenticación de dos factores</span>
                  <input type="checkbox" 
                         class="toggle toggle-primary">
                </label>
                <div class="text-xs text-base-content/60 ml-0">
                  Seguridad adicional para tu cuenta
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end mt-6">
        <button class="btn btn-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Guardar Preferencias
        </button>
      </div>

      <!-- Nested Route Demo -->
      <div class="alert alert-success mt-6">
        <svg class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
          <h3 class="font-bold">Configuración Personalizada</h3>
          <div class="text-xs">
            Pestaña de preferencias con configuración avanzada del usuario.<br>
            <strong>Ruta:</strong> /services/user-profile/preferences<br>
            <strong>Funcionalidad:</strong> Personalización completa de la experiencia
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-preferences-tab {
      animation: fadeInLeft 0.4s ease-out;
    }
    
    @keyframes fadeInLeft {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .badge {
      transition: all 0.2s ease;
    }
    
    .badge:hover {
      transform: scale(1.05);
    }
    
    .range {
      appearance: none;
    }
  `]
})
export class UserPreferencesTabComponent {}