import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSignal = signal<boolean>(this.checkLogin());

  isLoggedIn = this.isLoggedInSignal.asReadonly();

  constructor() { }

  private checkLogin(): boolean {
    return localStorage.getItem('rt07_token') === 'true';
  }

  private getCredentials() {
    const data = localStorage.getItem('rt07_admin_credentials');
    return data ? JSON.parse(data) : { username: 'admin', password: 'admin123' };
  }

  login(username: string, password: string): boolean {
    const creds = this.getCredentials();
    if (username === creds.username && password === creds.password) {
      localStorage.setItem('rt07_token', 'true');
      this.isLoggedInSignal.set(true);
      return true;
    }
    return false;
  }

  getCurrentUsername(): string {
    return this.getCredentials().username;
  }

  updateCredentials(newUsername: string, newPassword: string): void {
    localStorage.setItem('rt07_admin_credentials', JSON.stringify({ username: newUsername, password: newPassword }));
  }

  logout(): void {
    localStorage.removeItem('rt07_token');
    this.isLoggedInSignal.set(false);
  }
}
