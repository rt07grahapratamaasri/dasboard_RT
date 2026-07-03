import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeuanganService } from '../../services/keuangan.service';

@Component({
  selector: 'app-keuangan-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-panel animate-fade-in mb-4" style="padding: 2rem;">
      <h2 style="color: var(--primary-color); margin-bottom: 1.5rem;">Input Transaksi Kas</h2>
      
      <form (ngSubmit)="onSubmit()" class="flex gap-4 items-center" style="flex-wrap: wrap;">
        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">Tanggal</label>
          <input type="date" class="form-control" [(ngModel)]="formData.tanggal" name="tanggal" required>
        </div>
        
        <div class="form-group mb-0" style="flex: 2; min-width: 200px;">
          <label class="form-label">Keterangan</label>
          <input type="text" class="form-control" [(ngModel)]="formData.keterangan" name="keterangan" required placeholder="Contoh: Iuran Warga">
        </div>

        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">Tipe</label>
          <select class="form-control" [(ngModel)]="formData.tipe" name="tipe" required>
            <option value="Pemasukan">Pemasukan</option>
            <option value="Pengeluaran">Pengeluaran</option>
          </select>
        </div>

        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">Nominal (Rp)</label>
          <input type="number" class="form-control" [(ngModel)]="formData.nominal" name="nominal" required min="0">
        </div>
        
        <div style="margin-top: 1.25rem;">
          <button type="submit" class="btn btn-primary" style="height: 42px;">Tambah</button>
        </div>
      </form>
    </div>

    <div class="glass-panel p-6 animate-fade-in" style="padding: 1.5rem; animation-delay: 0.1s;">
      <h3 style="margin-bottom: 1rem; color: var(--text-dark);">Riwayat Transaksi</h3>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Tipe</th>
              <th>Nominal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of keuanganService.transaksiList()">
              <td>{{ t.tanggal }}</td>
              <td>{{ t.keterangan }}</td>
              <td>
                <span class="badge" [ngClass]="t.tipe === 'Pemasukan' ? 'badge-success' : 'badge-danger'">
                  {{ t.tipe }}
                </span>
              </td>
              <td style="font-family: monospace; font-size: 1.1rem;">Rp {{ t.nominal | number }}</td>
              <td>
                <button (click)="onDelete(t.id)" class="btn btn-sm btn-danger" style="padding: 0.4rem 0.8rem;">Hapus</button>
              </td>
            </tr>
            <tr *ngIf="keuanganService.transaksiList().length === 0">
              <td colspan="5" class="text-center text-muted" style="padding: 2rem;">Belum ada data transaksi.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .mb-0 { margin-bottom: 0 !important; }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .badge-success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .badge-danger {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .btn-sm { font-size: 0.8rem; border-radius: var(--radius-sm); }
  `]
})
export class KeuanganInputComponent {
  keuanganService = inject(KeuanganService);

  formData: any = {
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
    tipe: 'Pemasukan',
    nominal: null
  };

  onSubmit() {
    this.keuanganService.add({
      ...this.formData,
      nominal: Number(this.formData.nominal)
    });
    this.formData.keterangan = '';
    this.formData.nominal = null;
  }

  onDelete(id: string) {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      this.keuanganService.delete(id);
    }
  }
}
