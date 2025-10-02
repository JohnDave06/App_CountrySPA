import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.css']
})
export class LoginScreenComponent {
  @Output() loginSuccess = new EventEmitter<LoginCredentials>();
  @Output() loginError = new EventEmitter<string>();

  loginForm: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Demo users
  private demoUsers = [
    { email: 'admin@countryspa.com', password: 'admin123', role: 'admin' },
    { email: 'user@countryspa.com', password: 'user123', role: 'user' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.maxLength(50)
      ]],
      rememberMe: [false]
    });
  }

  onLogin(): void {
    // Clear previous error message
    this.errorMessage = '';
    
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched();
    
    if (this.loginForm.valid) {
      this.isLoading = true;
      const formValue = this.loginForm.value;
      
      // Basic client-side validation
      if (!formValue.email || !formValue.password) {
        this.errorMessage = 'Por favor completa todos los campos obligatorios';
        this.isLoading = false;
        return;
      }

      if (formValue.email.trim() === '' || formValue.password.trim() === '') {
        this.errorMessage = 'Los campos no pueden estar vacíos o contener solo espacios';
        this.isLoading = false;
        return;
      }
      
      // Simulate API call delay
      setTimeout(() => {
        const user = this.demoUsers.find(u => 
          u.email.toLowerCase() === formValue.email.toLowerCase().trim() && 
          u.password === formValue.password.trim()
        );

        if (user) {
          // Successful login
          const userData = {
            email: user.email,
            role: user.role,
            loginTime: new Date().toISOString()
          };

          // Store user data
          if (formValue.rememberMe) {
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }

          this.loginSuccess.emit(formValue);
          this.router.navigate(['/home']);
        } else {
          // Failed login - More specific error messages
          const emailExists = this.demoUsers.find(u => u.email.toLowerCase() === formValue.email.toLowerCase().trim());
          if (emailExists) {
            this.errorMessage = 'Contraseña incorrecta. Verifica tu contraseña e intenta nuevamente.';
          } else {
            this.errorMessage = 'Email no registrado. Verifica tu email o regístrate si eres nuevo usuario.';
          }
          this.loginError.emit(this.errorMessage);
        }
        
        this.isLoading = false;
      }, 1500);
    } else {
      // Show validation summary
      const errors = this.getFormValidationSummary();
      this.errorMessage = `Por favor corrige los siguientes errores:\n${errors.join('\n')}`;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(): void {
    alert('Funcionalidad de recuperación de contraseña - Por implementar');
  }

  onRegister(): void {
    alert('Funcionalidad de registro - Por implementar');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'El email' : 'La contraseña'} es requerido`;
      }
      if (field.errors['email'] || field.errors['pattern']) {
        return 'Por favor ingresa un email válido (ejemplo: usuario@dominio.com)';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        const actualLength = field.errors['minlength'].actualLength;
        return `La contraseña debe tener al menos ${requiredLength} caracteres (actual: ${actualLength})`;
      }
      if (field.errors['maxlength']) {
        return 'La contraseña no puede tener más de 50 caracteres';
      }
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private getFormValidationSummary(): string[] {
    const errors: string[] = [];
    
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control && control.invalid && (control.dirty || control.touched)) {
        const fieldError = this.getFieldError(key);
        if (fieldError) {
          errors.push(`• ${fieldError}`);
        }
      }
    });
    
    return errors;
  }

  // Helper method to check if form has any validation errors
  get hasValidationErrors(): boolean {
    return this.loginForm.invalid && (this.loginForm.dirty || this.loginForm.touched);
  }

  // Helper method to get form submission button text
  get submitButtonText(): string {
    if (this.isLoading) return 'Iniciando sesión...';
    if (this.loginForm.invalid) return 'Completar campos requeridos';
    return 'Iniciar Sesión';
  }
}
