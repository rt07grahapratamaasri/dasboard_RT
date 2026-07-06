import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.googleSheetApiUrl;
  private http = inject(HttpClient);
  
  private isLoggedInSignal = signal<boolean>(this.checkLogin());
  private usersSignal = signal<any[]>([]);

  isLoggedIn = this.isLoggedInSignal.asReadonly();

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.http.get<{data: any[]}>(`${this.apiUrl}?sheet=users`).subscribe({
      next: (res) => {
        if (res && res.data && res.data.length > 0) {
          this.usersSignal.set(res.data);
        } else {
          // Default user if sheet is completely empty
          const defaultUser = [{ username: 'admin', password: 'admin123', role: 'super0' }];
          this.usersSignal.set(defaultUser);
          this.saveUsers(defaultUser);
        }
      },
      error: (err) => console.error('Gagal mengambil data Users', err)
    });
  }

  private checkLogin(): boolean {
    return localStorage.getItem('rt07_token') === 'true';
  }

  getUsers(): any[] {
    const users = this.usersSignal();
    return users.length > 0 ? users : [{ username: 'admin', password: 'admin123', role: 'super0' }];
  }

  private saveUsers(users: any[]): void {
    const payload = {
      action: 'overwrite',
      sheet: 'users',
      data: users
    };
    
    this.usersSignal.set(users);
    
    this.http.post(this.apiUrl, JSON.stringify(payload), {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      responseType: 'text'
    }).subscribe({
      error: (err) => console.error('Gagal menyimpan Users', err)
    });
  }

  login(username: string, password: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => String(u.username) === username && String(u.password) === password);
    
    if (user) {
      localStorage.setItem('rt07_token', 'true');
      localStorage.setItem('rt07_current_user', String(user.username));
      localStorage.setItem('rt07_current_role', String(user.role || 'super0'));
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
    const users = [...this.getUsers()];
    if (!users.find(u => String(u.username) === username)) {
      users.push({ username, password, role });
      this.saveUsers(users);
    }
  }

  updateUser(oldUsername: string, newUsername: string, newPassword: string, newRole: string): void {
    const users = [...this.getUsers()];
    const index = users.findIndex(u => String(u.username) === oldUsername);
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
    let users = [...this.getUsers()];
    if (users.length <= 1) {
      alert("Tidak dapat menghapus pengguna terakhir. Harus ada minimal 1 admin.");
      return;
    }
    if (localStorage.getItem('rt07_current_user') === username) {
      alert("Tidak dapat menghapus akun Anda sendiri saat sedang login.");
      return;
    }
    users = users.filter(u => String(u.username) !== username);
    this.saveUsers(users);
  }

  logout(): void {
    localStorage.removeItem('rt07_token');
    localStorage.removeItem('rt07_current_user');
    localStorage.removeItem('rt07_current_role');
    this.isLoggedInSignal.set(false);
  }
}
