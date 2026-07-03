import { Component, inject } from '@angular/core';
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
          <h3 style="margin-bottom: 1rem;">Keamanan Akun</h3>
          <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.9rem;">Ubah nama pengguna (username) dan kata sandi (password) untuk login ke Panel Admin.</p>
          
          <div class="flex flex-col gap-3">
            <input type="text" class="form-control" placeholder="Username Baru" [(ngModel)]="newUsername">
            <input type="password" class="form-control" placeholder="Password Baru" [(ngModel)]="newPassword">
            <button (click)="changePassword()" class="btn btn-danger" style="width: 100%;">
              🔒 Simpan Perubahan
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .flex-col { display: flex; flex-direction: column; }
    .btn { display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
  `]
})
export class DatabaseComponent {
  wargaService = inject(WargaService);
  keuanganService = inject(KeuanganService);
  iuranService = inject(IuranService);
  authService = inject(AuthService);

  newUsername = '';
  newPassword = '';

  changePassword() {
    if (!this.newUsername.trim() || !this.newPassword.trim()) {
      alert('Username dan Password tidak boleh kosong!');
      return;
    }
    
    if (confirm('Apakah Anda yakin ingin mengubah kredensial Admin? Anda mungkin perlu login ulang setelah ini.')) {
      this.authService.updateCredentials(this.newUsername.trim(), this.newPassword.trim());
      alert('Username dan Password berhasil diubah!');
      this.newUsername = '';
      this.newPassword = '';
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
