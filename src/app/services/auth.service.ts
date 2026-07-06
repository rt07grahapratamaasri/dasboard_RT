import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private http = inject(HttpClient);
  
  private isLoggedInSignal = signal<boolean>(this.checkLogin());
  private usersSignal = signal<any[]>([]);

  isLoggedIn = this.isLoggedInSignal.asReadonly();

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.http.get<{data: any[]}>(this.apiUrl).subscribe({
      next: (res) => {
        if (res && res.data && res.data.length > 0) {
          this.usersSignal.set(res.data);
        } else {
          // Default fallback (but should ideally exist in DB via init.sql)
          this.usersSignal.set([{ username: 'admin', password: 'admin123', role: 'super0' }]);
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
    const payload = { username, password, role };
    // Optimistic UI
    this.usersSignal.set([...this.usersSignal(), payload]);
    
    this.http.post(this.apiUrl, payload).subscribe({
      error: (err) => {
        console.error('Gagal menambah user', err);
        this.loadUsers();
      }
    });
  }

  updateUser(oldUsername: string, newUsername: string, newPassword: string, newRole: string): void {
    const payload = { oldUsername, newUsername, password: newPassword, role: newRole };
    
    // Optimistic UI
    const users = this.usersSignal().map(u => String(u.username) === oldUsername ? { username: newUsername, password: newPassword, role: newRole } : u);
    this.usersSignal.set(users);
    
    this.http.put(`${this.apiUrl}?username=${oldUsername}`, payload).subscribe({
      error: (err) => {
        console.error('Gagal update user', err);
        this.loadUsers();
      }
    });

    // Update session if they edit their own account
    if (localStorage.getItem('rt07_current_user') === oldUsername) {
      localStorage.setItem('rt07_current_user', newUsername);
      localStorage.setItem('rt07_current_role', newRole);
    }
  }

  deleteUser(username: string): void {
    const users = this.getUsers();
    if (users.length <= 1) {
      alert("Tidak dapat menghapus pengguna terakhir. Harus ada minimal 1 admin.");
      return;
    }
    if (localStorage.getItem('rt07_current_user') === username) {
      alert("Tidak dapat menghapus akun Anda sendiri saat sedang login.");
      return;
    }
    
    // Optimistic UI
    this.usersSignal.set(users.filter(u => String(u.username) !== username));
    
    this.http.delete(`${this.apiUrl}?username=${username}`).subscribe({
      error: (err) => {
        console.error('Gagal hapus user', err);
        this.loadUsers();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('rt07_token');
    localStorage.removeItem('rt07_current_user');
    localStorage.removeItem('rt07_current_role');
    this.isLoggedInSignal.set(false);
  }
}
