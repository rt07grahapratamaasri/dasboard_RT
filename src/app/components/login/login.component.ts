import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  template: `
    <div class="login-container">
      <div class="glass-panel login-box animate-fade-in">
        <div class="text-center mb-4">
          <h2 style="color: var(--primary-color); font-weight: 700;">Login RT 07</h2>
          <p class="text-muted" style="margin-top: 0.5rem; font-size: 0.9rem;">Masukkan kredensial Anda</p>
        </div>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-control" [(ngModel)]="username" name="username" required placeholder="Masukkan Username">
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" [(ngModel)]="password" name="password" required placeholder="Masukkan Password">
          </div>

          <div *ngIf="errorMsg" class="error-msg">
            {{ errorMsg }}
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Login</button>
        </form>

        <div class="text-center mt-4">
          <a href="/laporan-keuangan" style="color: var(--secondary-color); text-decoration: none; font-size: 0.9rem;">Kembali ke Laporan Kas</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100%;
      padding: 1rem;
    }
    .login-box {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem;
    }
    .error-msg {
      color: var(--danger);
      font-size: 0.85rem;
      margin-top: -1rem;
      margin-bottom: 1rem;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  errorMsg = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    if (this.authService.login(this.username, this.password)) {
      this.router.navigate(['/admin/warga']);
    } else {
      this.errorMsg = 'Username atau password salah!';
    }
  }
}
