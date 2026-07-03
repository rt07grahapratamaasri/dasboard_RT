import { Component, inject, computed, signal, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WargaService } from '../../services/warga.service';
import { IuranService } from '../../services/iuran.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-iuran',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-panel p-6 animate-fade-in" style="padding: 1.5rem; margin-bottom: 2rem;">
      <div class="flex justify-between items-center mb-4">
        <h2 style="color: var(--primary-color);">Checklist Iuran Bulanan Warga</h2>
      </div>

      <div class="flex gap-4 mb-4" style="background: rgba(255,255,255,0.5); padding: 1rem; border-radius: var(--radius-md); flex-wrap: wrap;">
        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">Pilih Bulan</label>
          <select class="form-control" [ngModel]="selectedBulan()" (ngModelChange)="selectedBulan.set($event)">
            <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
          </select>
        </div>
        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">Pilih Tahun</label>
          <input type="number" class="form-control" [ngModel]="selectedTahun()" (ngModelChange)="selectedTahun.set($event)">
        </div>
        <div class="form-group mb-0" style="flex: 2; min-width: 200px;">
          <label class="form-label">Cari Nama / Blok</label>
          <input type="text" class="form-control" placeholder="Ketik nama atau blok..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)">
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Kepala Keluarga</th>
              <th>Blok</th>
              <th>Status Bayar</th>
              <th style="width: 150px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let kk of kepalaKeluargaList(); let i = index">
              <td>{{ i + 1 }}</td>
              <td style="font-weight: 500;">{{ kk.nama }}</td>
              <td>{{ kk.blok }}</td>
              <td>
                <span class="badge" [ngClass]="isPaid(kk.id) ? 'badge-success' : 'badge-danger'">
                  {{ isPaid(kk.id) ? 'Lunas (Rp 30.000)' : 'Belum Bayar' }}
                </span>
              </td>
              <td>
                <button *ngIf="!isPaid(kk.id)" (click)="togglePayment(kk.id, kk.nama, true)" class="btn btn-sm" style="background: var(--success); color: white; padding: 0.4rem 0.8rem;">
                  ✅ Tandai Lunas
                </button>
                <button *ngIf="isPaid(kk.id)" (click)="togglePayment(kk.id, kk.nama, false)" class="btn btn-sm btn-danger" style="padding: 0.4rem 0.8rem;">
                  ❌ Batalkan
                </button>
              </td>
            </tr>
            <tr *ngIf="kepalaKeluargaList().length === 0">
              <td colspan="5" class="text-center text-muted" style="padding: 2rem;">Tidak ada data yang cocok dengan pencarian.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-muted mt-4" style="font-size: 0.85rem;">* Menandai Lunas otomatis menambahkan Rp 30.000 ke Pemasukan Kas RT.</p>
    </div>

    <!-- LAPORAN IURAN -->
    <div class="glass-panel p-6 animate-fade-in" style="padding: clamp(1rem, 3vw, 1.5rem); animation-delay: 0.2s;">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem;">
        <h3 style="color: var(--primary-color); margin-bottom: 0; font-size: clamp(1.1rem, 3vw, 1.3rem);">Laporan Iuran</h3>
        
        <div class="flex gap-2 items-center" style="background: rgba(0,0,0,0.03); padding: 0.5rem; border-radius: var(--radius-md);">
          <select class="form-control" style="padding: 0.3rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(0,0,0,0.1); background: white; margin-bottom: 0;" [ngModel]="selectedBulan()" (ngModelChange)="selectedBulan.set($event)">
            <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
          </select>
          <input type="number" class="form-control" style="width: 80px; padding: 0.3rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(0,0,0,0.1); background: white; margin-bottom: 0;" [ngModel]="selectedTahun()" (ngModelChange)="selectedTahun.set($event)">
        </div>
      </div>
      
      <!-- Statistik -->
      <div class="responsive-grid stats-grid" style="margin-bottom: 1.5rem;">
        <div class="glass-card summary-box" style="padding: 1rem; text-align: center; border-bottom: 4px solid var(--success);">
          <div class="text-muted" style="font-size: 0.85rem;">Sudah Membayar</div>
          <h2 style="color: var(--success); font-size: clamp(1.2rem, 4vw, 1.5rem);">{{ wargaSudahBayar().length }} Warga</h2>
        </div>
        <div class="glass-card summary-box" style="padding: 1rem; text-align: center; border-bottom: 4px solid var(--danger);">
          <div class="text-muted" style="font-size: 0.85rem;">Belum Membayar</div>
          <h2 style="color: var(--danger); font-size: clamp(1.2rem, 4vw, 1.5rem);">{{ totalKepalaKeluarga() - wargaSudahBayar().length }} Warga</h2>
        </div>
        <div class="glass-card summary-box" style="padding: 1rem; text-align: center; border-bottom: 4px solid var(--primary-color);">
          <div class="text-muted" style="font-size: 0.85rem;">Total Terkumpul</div>
          <h2 style="color: var(--primary-color); font-size: clamp(1.2rem, 4vw, 1.5rem);">Rp {{ wargaSudahBayar().length * 30000 | number }}</h2>
        </div>
      </div>

      <!-- Chart -->
      <div class="glass-card flex flex-col items-center justify-center" style="padding: 1rem; margin-bottom: 2.5rem; width: 100%; box-sizing: border-box;">
        <h4 style="margin-bottom: 1rem; color: var(--text-dark); font-size: 0.95rem; text-align: center;">Grafik Pembayaran</h4>
        <div style="width: 100%; display: flex; justify-content: center; align-items: center;">
          <div class="chart-container" style="position: relative; width: 100%; max-width: 280px; height: 250px;">
            <canvas id="iuranChart"></canvas>
          </div>
        </div>
      </div>

      <h4 style="margin-bottom: 1rem; color: var(--text-dark);">Daftar Warga yang Sudah Lunas:</h4>
      
      <div class="table-responsive" *ngIf="wargaSudahBayar().length > 0">
        <table class="table">
          <thead>
            <tr style="background: rgba(0,0,0,0.02);">
              <th style="width: 50px;">No</th>
              <th>Nama Warga</th>
              <th>Blok</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of wargaSudahBayar(); let i = index" class="animate-fade-in" [style.animation-delay]="(i * 0.05) + 's'">
              <td>{{ i + 1 }}</td>
              <td style="font-weight: 500;">{{ w.nama }}</td>
              <td>{{ w.blok }}</td>
              <td style="text-align: center;">
                <span class="badge badge-success">Lunas</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div *ngIf="wargaSudahBayar().length === 0" class="text-muted p-4 text-center" style="border: 2px dashed rgba(0,0,0,0.1); border-radius: var(--radius-md);">
        Belum ada warga yang lunas di bulan ini.
      </div>
    </div>
  `,
  styles: [`
    .responsive-grid { display: grid; gap: 1rem; }
    .stats-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
    .mb-0 { margin-bottom: 0 !important; }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
      display: inline-block;
    }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
    .btn-sm { font-size: 0.8rem; border-radius: var(--radius-sm); cursor: pointer; border: none; }
  `]
})
export class IuranComponent implements AfterViewInit {
  wargaService = inject(WargaService);
  iuranService = inject(IuranService);

  months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  selectedBulan = signal(new Date().getMonth() + 1);
  selectedTahun = signal(new Date().getFullYear());
  searchQuery = signal('');

  chart: any;

  constructor() {
    effect(() => {
      const paid = this.wargaSudahBayar().length;
      const unpaid = this.totalKepalaKeluarga() - paid;
      this.updateChart(paid, unpaid);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initChart();
      const paid = this.wargaSudahBayar().length;
      const unpaid = this.totalKepalaKeluarga() - paid;
      this.updateChart(paid, unpaid);
    }, 100);
  }

  initChart() {
    const ctx = document.getElementById('iuranChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sudah Membayar', 'Belum Membayar'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(239, 68, 68, 0.85)'
          ],
          borderColor: [
            '#10b981',
            '#ef4444'
          ],
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                family: 'Inter, sans-serif'
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  updateChart(paid: number, unpaid: number) {
    if (this.chart) {
      this.chart.data.datasets[0].data = [paid, unpaid];
      this.chart.update();
    }
  }

  kepalaKeluargaList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.wargaService.wargaList().filter(w => {
      if (w.status !== 'Kepala Keluarga') return false;
      if (!query) return true;
      return w.nama.toLowerCase().includes(query) || w.blok.toLowerCase().includes(query);
    });
  });

  totalKepalaKeluarga = computed(() => {
    return this.wargaService.wargaList().filter(w => w.status === 'Kepala Keluarga').length;
  });

  wargaSudahBayar = computed(() => {
    const b = Number(this.selectedBulan());
    const t = Number(this.selectedTahun());
    
    return this.wargaService.wargaList().filter(w => {
      if (w.status !== 'Kepala Keluarga') return false;
      return !!this.iuranService.getIuranByWarga(w.id, b, t);
    });
  });

  isPaid(wargaId: string): boolean {
    return !!this.iuranService.getIuranByWarga(wargaId, Number(this.selectedBulan()), Number(this.selectedTahun()));
  }

  togglePayment(wargaId: string, wargaName: string, toPaid: boolean) {
    if (toPaid) {
      this.iuranService.markAsPaid(wargaId, wargaName, Number(this.selectedBulan()), Number(this.selectedTahun()));
    } else {
      if (confirm('Batalkan lunas untuk warga ini? (Otomatis mengurangi saldo Kas)')) {
        this.iuranService.markAsUnpaid(wargaId, Number(this.selectedBulan()), Number(this.selectedTahun()));
      }
    }
  }
}
