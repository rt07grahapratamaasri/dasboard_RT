import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { WargaService } from '../../services/warga.service';
import { KeuanganService } from '../../services/keuangan.service';
import { IuranService } from '../../services/iuran.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-panel p-6 animate-fade-in" style="padding: 1.5rem;">
      <h2 style="color: var(--primary-color); margin-bottom: 1.5rem;">Pengaturan Sistem</h2>
      
      <div class="responsive-grid" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
        
        <!-- JSON Backup -->
        <div class="glass-card" style="padding: 1.5rem; border-top: 4px solid var(--secondary-color);">
          <h3 style="margin-bottom: 1rem;">Database JSON</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Backup semua data (Warga, Keuangan, Iuran) ke dalam satu file RT07.JSON atau pulihkan data dari file JSON.</p>
          
          <div class="flex flex-col gap-3">
            <button (click)="exportJSON()" class="btn btn-primary" style="width: 100%;">
              📥 Download RT07.JSON
            </button>
            
            <label class="btn" style="background: rgba(16, 185, 129, 0.1); color: var(--success); cursor: pointer; text-align: center; width: 100%;">
              📤 Restore dari JSON
              <input type="file" (change)="importJSON($event)" accept=".json" style="display: none;">
            </label>
          </div>
        </div>

        <!-- Excel Backup -->
        <div class="glass-card" style="padding: 1.5rem; border-top: 4px solid var(--success);">
          <h3 style="margin-bottom: 1rem;">Backup Spreadsheet</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Unduh data dalam bentuk Microsoft Excel (.xlsx) untuk laporan atau jika terjadi masalah pada Vercel.</p>
          
          <div class="flex flex-col gap-3">
            <button (click)="exportExcel()" class="btn" style="background: rgba(16, 185, 129, 0.1); color: var(--success); width: 100%;">
              📊 Download Backup Excel
            </button>
          </div>
        </div>

        <!-- Keamanan Akun -->
        <div class="glass-card" style="padding: 1.5rem; border-top: 4px solid var(--danger);">
          <h3 style="margin-bottom: 1rem;">Manajemen Admin (Multi-User)</h3>
          <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.9rem;">Kelola daftar pengguna yang memiliki akses ke Panel Admin.</p>
          
          <div class="table-responsive" style="margin-bottom: 1.5rem;">
            <table class="table" style="font-size: 0.9rem;">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Hak Akses</th>
                  <th style="width: 150px; text-align: center;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users()">
                  <td>
                    <span *ngIf="editMode !== u.username">{{ u.username }}</span>
                    <input *ngIf="editMode === u.username" type="text" class="form-control" [(ngModel)]="editUsername" style="padding: 0.3rem;">
                  </td>
                  <td>
                    <span *ngIf="editMode !== u.username">••••••••</span>
                    <input *ngIf="editMode === u.username" type="text" class="form-control" [(ngModel)]="editPassword" style="padding: 0.3rem;">
                  </td>
                  <td>
                    <span *ngIf="editMode !== u.username" class="badge" [ngClass]="u.role === 'super0' ? 'badge-primary' : 'badge-secondary'">{{ u.role === 'super0' ? 'Super Admin' : 'Admin' }}</span>
                    <select *ngIf="editMode === u.username" class="form-control" [(ngModel)]="editRole" style="padding: 0.3rem;">
                      <option value="super0">Super Admin (super0)</option>
                      <option value="super1">Admin (super1)</option>
                    </select>
                  </td>
                  <td>
                    <div class="flex gap-2 justify-center">
                      <ng-container *ngIf="editMode !== u.username">
                        <button (click)="startEdit(u)" class="btn btn-sm" style="background: rgba(14, 165, 233, 0.1); color: var(--secondary-color); padding: 0.3rem 0.6rem;">Edit</button>
                        <button *ngIf="authService.getCurrentRole() === 'super0'" (click)="deleteUser(u.username)" class="btn btn-sm" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 0.3rem 0.6rem;">Hapus</button>
                      </ng-container>
                      <ng-container *ngIf="editMode === u.username">
                        <button (click)="saveEdit(u.username)" class="btn btn-sm" style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 0.3rem 0.6rem;">Simpan</button>
                        <button (click)="cancelEdit()" class="btn btn-sm" style="background: rgba(100, 116, 139, 0.1); color: var(--text-dark); padding: 0.3rem 0.6rem;">Batal</button>
                      </ng-container>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: var(--radius-sm); border: 1px dashed rgba(0,0,0,0.1);">
            <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem;">Tambah Admin Baru</h4>
            <div class="flex gap-2" style="flex-wrap: wrap;">
              <input type="text" class="form-control" placeholder="Username" [(ngModel)]="newUsername" style="flex: 1; min-width: 120px; margin-bottom: 0;">
              <input type="password" class="form-control" placeholder="Password" [(ngModel)]="newPassword" style="flex: 1; min-width: 120px; margin-bottom: 0;">
              <select class="form-control" [(ngModel)]="newRole" style="flex: 1; min-width: 120px; margin-bottom: 0;">
                <option value="super1">Admin (super1)</option>
                <option value="super0">Super Admin (super0)</option>
              </select>
              <button (click)="addUser()" class="btn btn-primary" style="white-space: nowrap;">+ Tambah</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .flex-col { display: flex; flex-direction: column; }
    .btn { display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; display: inline-block; text-align: center; }
    .badge-primary { background: rgba(79, 70, 229, 0.1); color: var(--primary-color); }
    .badge-secondary { background: rgba(100, 116, 139, 0.1); color: var(--text-dark); }
  `]
})
export class DatabaseComponent {
  wargaService = inject(WargaService);
  keuanganService = inject(KeuanganService);
  iuranService = inject(IuranService);
  authService = inject(AuthService);

  users = signal<any[]>([]);
  newUsername = '';
  newPassword = '';
  newRole = 'super1';
  
  editMode: string | null = null;
  editUsername = '';
  editPassword = '';
  editRole = 'super1';

  constructor() {
    this.refreshUsers();
  }

  refreshUsers() {
    this.users.set(this.authService.getUsers());
  }

  addUser() {
    if (!this.newUsername.trim() || !this.newPassword.trim()) {
      alert('Username dan Password tidak boleh kosong!');
      return;
    }
    
    if (this.users().find(u => u.username === this.newUsername.trim())) {
      alert('Username sudah ada! Gunakan nama lain.');
      return;
    }

    this.authService.addUser(this.newUsername.trim(), this.newPassword.trim(), this.newRole);
    this.newUsername = '';
    this.newPassword = '';
    this.newRole = 'super1';
    this.refreshUsers();
    alert('Admin baru berhasil ditambahkan!');
  }

  startEdit(user: any) {
    this.editMode = user.username;
    this.editUsername = user.username;
    this.editPassword = user.password;
    this.editRole = user.role || 'super0';
  }

  cancelEdit() {
    this.editMode = null;
  }

  saveEdit(oldUsername: string) {
    if (!this.editUsername.trim() || !this.editPassword.trim()) {
      alert('Username dan Password tidak boleh kosong!');
      return;
    }
    this.authService.updateUser(oldUsername, this.editUsername.trim(), this.editPassword.trim(), this.editRole);
    this.editMode = null;
    this.refreshUsers();
  }

  deleteUser(username: string) {
    if (confirm(`Apakah Anda yakin ingin menghapus admin "${username}"?`)) {
      this.authService.deleteUser(username);
      this.refreshUsers();
    }
  }

  exportJSON() {
    const data = {
      warga: JSON.parse(localStorage.getItem('rt07_warga_data') || '[]'),
      keuangan: JSON.parse(localStorage.getItem('rt07_keuangan_data') || '[]'),
      iuran: JSON.parse(localStorage.getItem('rt07_iuran_data') || '[]')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RT07_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importJSON(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('Peringatan: Memulihkan database akan menimpa semua data saat ini. Apakah Anda yakin?')) {
      event.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.warga) localStorage.setItem('rt07_warga_data', JSON.stringify(data.warga));
        if (data.keuangan) localStorage.setItem('rt07_keuangan_data', JSON.stringify(data.keuangan));
        if (data.iuran) localStorage.setItem('rt07_iuran_data', JSON.stringify(data.iuran));
        
        alert('Database berhasil dipulihkan! Halaman akan dimuat ulang.');
        window.location.reload();
      } catch (error) {
        alert('File JSON tidak valid!');
      }
    };
    reader.readAsText(file);
  }

  exportExcel() {
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // Sheet 1: Warga
    const wargaData = this.wargaService.getAll().map((w, index) => ({
      No: index + 1,
      NIK: w.nik,
      'Nama Lengkap': w.nama,
      'Jenis Kelamin': w.jenisKelamin,
      Agama: w.agama,
      Blok: w.blok,
      Status: w.status
    }));
    const wsWarga: XLSX.WorkSheet = XLSX.utils.json_to_sheet(wargaData);
    XLSX.utils.book_append_sheet(wb, wsWarga, 'Data Warga');

    // Sheet 2: Keuangan
    const keuanganData = this.keuanganService.getAll().map((k, index) => ({
      No: index + 1,
      Tanggal: k.tanggal,
      Keterangan: k.keterangan,
      Tipe: k.tipe,
      Nominal: k.nominal
    }));
    const wsKeuangan: XLSX.WorkSheet = XLSX.utils.json_to_sheet(keuanganData);
    XLSX.utils.book_append_sheet(wb, wsKeuangan, 'Keuangan Kas');

    // Sheet 3: Iuran (Raw)
    const iuranData = this.iuranService.iuranList().map((i, index) => {
      const w = this.wargaService.getById(i.wargaId);
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return {
        No: index + 1,
        Bulan: monthNames[i.bulan - 1],
        Tahun: i.tahun,
        'Nama Warga': w ? w.nama : 'Unknown',
        Nominal: i.nominal,
        Status: i.isPaid ? 'Lunas' : 'Belum Lunas'
      };
    });
    const wsIuran: XLSX.WorkSheet = XLSX.utils.json_to_sheet(iuranData);
    XLSX.utils.book_append_sheet(wb, wsIuran, 'Data Iuran');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Backup_Spreadsheet_RT07_${dateStr}.xlsx`);
  }
}
