import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  searchTerm: string = '';
  isLoggedIn: boolean = false;

  constructor(private router: Router) {
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    // Check if user is logged in by looking for user data in localStorage
    const user = localStorage.getItem('user');
    this.isLoggedIn = !!user;
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.searchChange.emit(this.searchTerm);
  }

  onLogout(): void {
    // Lógica de logout
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }
}
