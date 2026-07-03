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

  getUsers(): any[] {
    const data = localStorage.getItem('rt07_users');
    if (data) {
      return JSON.parse(data);
    }
    
    // Migration from old single-user system
    const oldData = localStorage.getItem('rt07_admin_credentials');
    if (oldData) {
      const oldUser = JSON.parse(oldData);
      const users = [{ ...oldUser, role: 'super0' }];
      localStorage.setItem('rt07_users', JSON.stringify(users));
      return users;
    }

    // Default
    return [{ username: 'admin', password: 'admin123', role: 'super0' }];
  }

  private saveUsers(users: any[]): void {
    localStorage.setItem('rt07_users', JSON.stringify(users));
  }

  login(username: string, password: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      localStorage.setItem('rt07_token', 'true');
      localStorage.setItem('rt07_current_user', user.username);
      localStorage.setItem('rt07_current_role', user.role || 'super0');
      this.isLoggedInSignal.set(true);
      return true;
    }
    return false;
  }

  getCurrentUsername(): string {
    return localStorage.getItem('rt07_current_user') || 'Admin';
  }

  getCurrentRole(): string {
    return localStorage.getItem('rt07_current_role') || 'super0';
  }

  addUser(username: string, password: string, role: string = 'super1'): void {
    const users = this.getUsers();
    if (!users.find(u => u.username === username)) {
      users.push({ username, password, role });
      this.saveUsers(users);
    }
  }

  updateUser(oldUsername: string, newUsername: string, newPassword: string, newRole: string): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username === oldUsername);
    if (index !== -1) {
      users[index] = { username: newUsername, password: newPassword, role: newRole };
      this.saveUsers(users);
      
      // Update session if they edit their own account
      if (localStorage.getItem('rt07_current_user') === oldUsername) {
        localStorage.setItem('rt07_current_user', newUsername);
        localStorage.setItem('rt07_current_role', newRole);
      }
    }
  }

  deleteUser(username: string): void {
    let users = this.getUsers();
    if (users.length <= 1) {
      alert("Tidak dapat menghapus pengguna terakhir. Harus ada minimal 1 admin.");
      return;
    }
    if (localStorage.getItem('rt07_current_user') === username) {
      alert("Tidak dapat menghapus akun Anda sendiri saat sedang login.");
      return;
    }
    users = users.filter(u => u.username !== username);
    this.saveUsers(users);
  }

  logout(): void {
    localStorage.removeItem('rt07_token');
    localStorage.removeItem('rt07_current_user');
    localStorage.removeItem('rt07_current_role');
    this.isLoggedInSignal.set(false);
  }
}
