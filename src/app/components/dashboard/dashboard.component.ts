import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar glass-panel">
        <div class="sidebar-header flex justify-between items-center">
          <h2 style="margin: 0;">Admin RT</h2>
          <button (click)="logout()" class="btn btn-sm btn-danger mobile-logout" style="display: none; padding: 0.4rem 0.8rem;">Logout</button>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/admin/warga" routerLinkActive="active" class="nav-item">Data Warga</a>
          <a routerLink="/admin/iuran" routerLinkActive="active" class="nav-item">Iuran Bulanan Warga</a>
          <a routerLink="/admin/keuangan/input" routerLinkActive="active" class="nav-item">Input Keuangan</a>
          <a routerLink="/laporan-keuangan" class="nav-item">Lihat Laporan Kas</a>
          <a routerLink="/admin/database" routerLinkActive="active" class="nav-item">Pengaturan Database</a>
        </nav>
        
        <div class="sidebar-footer">
          <button (click)="logout()" class="btn btn-danger" style="width: 100%;">Logout</button>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar glass-panel mb-4 items-center justify-between flex" style="flex-wrap: wrap; gap: 0.5rem;">
          <h3 style="color: var(--text-dark); margin: 0; font-size: clamp(1.1rem, 3vw, 1.3rem);">Sistem Informasi</h3>
          <div style="font-weight: 500; font-size: 0.9rem;">Halo, <span style="text-transform: capitalize;">{{ authService.getCurrentUsername() }}</span></div>
        </header>
        
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      width: 100%;
    }
    .sidebar {
      width: 260px;
      display: flex;
      flex-direction: column;
      border-radius: 0;
      border-left: none;
      border-top: none;
      border-bottom: none;
      box-shadow: 4px 0 24px rgba(0,0,0,0.05);
      z-index: 10;
    }
    .sidebar-header {
      padding: 2rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    .sidebar-header h2 {
      color: var(--primary-color);
      font-size: 1.5rem;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .nav-item {
      display: block;
      padding: 0.85rem 1.25rem;
      color: var(--text-dark);
      text-decoration: none;
      border-radius: var(--radius-sm);
      font-weight: 500;
      transition: var(--transition);
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.5);
      transform: translateX(4px);
    }
    .nav-item.active {
      background: var(--primary-color);
      color: white;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      overflow-x: hidden;
      min-width: 0;
    }
    .topbar {
      padding: 1rem 1.5rem;
      display: flex;
    }
    .content-area {
      flex: 1;
      min-width: 0;
      width: 100%;
    }

    @media (max-width: 768px) {
      .layout {
        flex-direction: column;
      }
      .sidebar {
        width: 100%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .sidebar-header {
        padding: 1rem;
        border-bottom: none;
      }
      .mobile-logout {
        display: block !important;
      }
      .sidebar-footer {
        display: none;
      }
      .sidebar-nav {
        flex-direction: row;
        overflow-x: auto;
        padding: 0 1rem 1rem 1rem;
        -webkit-overflow-scrolling: touch;
      }
      /* Hide scrollbar for horizontal menu */
      .sidebar-nav::-webkit-scrollbar {
        display: none;
      }
      .sidebar-nav {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .nav-item {
        white-space: nowrap;
        padding: 0.6rem 1rem;
      }
      .nav-item:hover {
        transform: translateY(-2px);
      }
      .main-content {
        padding: 1rem;
      }
      .topbar {
        padding: 1rem;
      }
    }
  `]
})
export class DashboardComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
