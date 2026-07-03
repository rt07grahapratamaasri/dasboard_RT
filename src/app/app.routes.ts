import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { WargaListComponent } from './components/warga-list/warga-list.component';
import { WargaFormComponent } from './components/warga-form/warga-form.component';
import { KeuanganReportComponent } from './components/keuangan-report/keuangan-report.component';
import { KeuanganInputComponent } from './components/keuangan-input/keuangan-input.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'laporan-keuangan', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'laporan-keuangan', component: KeuanganReportComponent },
  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: 'warga', component: WargaListComponent },
      { path: 'warga/tambah', component: WargaFormComponent },
      { path: 'warga/edit/:id', component: WargaFormComponent },
      { path: 'iuran', loadComponent: () => import('./components/iuran/iuran.component').then(m => m.IuranComponent) },
      { path: 'keuangan/input', component: KeuanganInputComponent },
      { path: 'database', loadComponent: () => import('./components/database/database.component').then(m => m.DatabaseComponent) },
      { path: '', redirectTo: 'warga', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'laporan-keuangan' } 
];
