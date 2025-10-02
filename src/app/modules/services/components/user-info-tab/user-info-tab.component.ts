import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-info-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-info-tab">
      <h2 class="text-xl font-bold mb-6">Información Personal</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Personal Details -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Datos Personales</h3>
            
            <div class="space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Nombre Completo</span>
                </label>
                <input type="text" 
                       class="input input-bordered" 
                       value="Ana García Rodríguez" 
                       readonly>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Email</span>
                </label>
                <input type="email" 
                       class="input input-bordered" 
                       value="ana.garcia@email.com" 
                       readonly>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Teléfono</span>
                </label>
                <input type="tel" 
                       class="input input-bordered" 
                       value="+52 55 1234-5678" 
                       readonly>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Fecha de Nacimiento</span>
                </label>
                <input type="date" 
                       class="input input-bordered" 
                       value="1990-03-15" 
                       readonly>
              </div>
            </div>
          </div>
        </div>

        <!-- Address Information -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Dirección</h3>
            
            <div class="space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Calle y Número</span>
                </label>
                <input type="text" 
                       class="input input-bordered" 
                       value="Av. Reforma 123" 
                       readonly>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Ciudad</span>
                  </label>
                  <input type="text" 
                         class="input input-bordered" 
                         value="Ciudad de México" 
                         readonly>
                </div>
                
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">C.P.</span>
                  </label>
                  <input type="text" 
                         class="input input-bordered" 
                         value="06600" 
                         readonly>
                </div>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Estado</span>
                </label>
                <input type="text" 
                       class="input input-bordered" 
                       value="CDMX" 
                       readonly>
              </div>
            </div>
          </div>
        </div>

        <!-- Emergency Contact -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Contacto de Emergencia</h3>
            
            <div class="space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Nombre</span>
                </label>
                <input type="text" 
                       class="input input-bordered" 
                       value="Carlos García" 
                       readonly>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Relación</span>
                </label>
                <input type="text" 
                       class="input input-bordered" 
                       value="Esposo" 
                       readonly>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Teléfono</span>
                </label>
                <input type="tel" 
                       class="input input-bordered" 
                       value="+52 55 9876-5432" 
                       readonly>
              </div>
            </div>
          </div>
        </div>

        <!-- Medical Information -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Información Médica</h3>
            
            <div class="space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Alergias</span>
                </label>
                <textarea class="textarea textarea-bordered" 
                          rows="2" 
                          readonly>Ninguna alergia conocida</textarea>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Condiciones Médicas</span>
                </label>
                <textarea class="textarea textarea-bordered" 
                          rows="2" 
                          readonly>Ninguna condición médica relevante</textarea>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Medicamentos</span>
                </label>
                <textarea class="textarea textarea-bordered" 
                          rows="2" 
                          readonly>No toma medicamentos regulares</textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 mt-6">
        <button class="btn btn-outline">Cancelar</button>
        <button class="btn btn-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Editar Información
        </button>
      </div>

      <!-- Nested Route Demo -->
      <div class="alert alert-info mt-6">
        <svg class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
          <h3 class="font-bold">Ruta Anidada Activa</h3>
          <div class="text-xs">
            Esta es una pestaña hijo dentro del contenedor de perfil de usuario.<br>
            <strong>Ruta:</strong> /services/user-profile/info<br>
            <strong>Componente:</strong> UserInfoTabComponent (child route)
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-info-tab {
      animation: fadeInUp 0.4s ease-out;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .form-control input:read-only,
    .form-control textarea:read-only {
      background-color: var(--fallback-b2, oklch(var(--b2)));
      cursor: not-allowed;
    }
  `]
})
export class UserInfoTabComponent {}