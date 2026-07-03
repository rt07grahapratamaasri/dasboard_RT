import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeuanganService } from '../../services/keuangan.service';
import { AuthService } from '../../services/auth.service';
import { WargaService } from '../../services/warga.service';
import { IuranService } from '../../services/iuran.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-keuangan-report',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="report-container">
      <header class="topbar glass-panel items-center justify-between flex animate-fade-in mb-8" style="padding: 1.5rem; flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem;">
        <div class="header-content flex items-center gap-4" style="flex-wrap: wrap; flex: 1;">
          <h2 style="color: var(--primary-color); margin-bottom: 0; font-size: clamp(1.2rem, 4vw, 1.5rem);">Laporan Keuangan Kas</h2>
          <div class="filter-box flex gap-2 items-center" style="background: rgba(0,0,0,0.03); padding: 0.5rem; border-radius: var(--radius-md);">
            <select class="form-control" style="padding: 0.3rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(0,0,0,0.1); background: white; margin-bottom: 0;" [ngModel]="selectedBulanKeuangan()" (ngModelChange)="selectedBulanKeuangan.set($event)">
              <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
            </select>
            <input type="number" class="form-control" style="width: 80px; padding: 0.3rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(0,0,0,0.1); background: white; margin-bottom: 0;" [ngModel]="selectedTahunKeuangan()" (ngModelChange)="selectedTahunKeuangan.set($event)">
          </div>
        </div>
        <div class="header-actions flex gap-2">
          <a *ngIf="!authService.isLoggedIn()" routerLink="/login" class="btn btn-sm" style="background: rgba(79, 70, 229, 0.1); color: var(--primary-color);">Login Pengurus</a>
          <a *ngIf="authService.isLoggedIn()" routerLink="/admin/warga" class="btn btn-sm" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">Panel Admin</a>
        </div>
      </header>

      <!-- BAGIAN 1: LAPORAN ARUS KAS -->
      <div class="responsive-grid stats-grid animate-fade-in" style="animation-delay: 0.1s; margin-bottom: 2rem;">
        <div class="glass-card summary-box" style="padding: 1.5rem; text-align: center; border-bottom: 4px solid var(--success);">
          <div class="text-muted" style="font-size: 0.9rem; margin-bottom: 0.5rem;">Total Pemasukan</div>
          <h3 style="color: var(--success); font-size: clamp(1.2rem, 4vw, 1.8rem);">Rp {{ totalPemasukan | number }}</h3>
        </div>
        <div class="glass-card summary-box" style="padding: 1.5rem; text-align: center; border-bottom: 4px solid var(--danger);">
          <div class="text-muted" style="font-size: 0.9rem; margin-bottom: 0.5rem;">Total Pengeluaran</div>
          <h3 style="color: var(--danger); font-size: clamp(1.2rem, 4vw, 1.8rem);">Rp {{ totalPengeluaran | number }}</h3>
        </div>
        <div class="glass-card summary-box" style="padding: 1.5rem; text-align: center; border-bottom: 4px solid var(--primary-color);">
          <div class="text-muted" style="font-size: 0.9rem; margin-bottom: 0.5rem;">Saldo Saat Ini</div>
          <h3 style="color: var(--primary-color); font-size: clamp(1.2rem, 4vw, 1.8rem);">Rp {{ totalSaldo | number }}</h3>
        </div>
      </div>

      <div class="responsive-grid chart-list-grid" style="margin-bottom: 3rem;">
        <div class="glass-panel animate-fade-in flex flex-col" style="padding: 1.5rem; animation-delay: 0.2s;">
          <h3 style="margin-bottom: 1rem;">Grafik Arus Kas</h3>
          <div class="chart-container">
            <canvas #chartCanvas></canvas>
          </div>
        </div>

        <div class="glass-panel animate-fade-in flex flex-col" style="padding: 1.5rem; animation-delay: 0.3s; max-height: 450px; overflow-y: auto;">
          <h3 style="margin-bottom: 1rem;">5 Transaksi Terakhir</h3>
          <div class="list-group">
            <div *ngFor="let t of recentTransactions" class="list-item flex justify-between items-center" style="padding: 1rem 0; border-bottom: 1px solid rgba(0,0,0,0.05); gap: 1rem;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ t.keterangan }}</div>
                <div class="text-muted" style="font-size: 0.8rem;">{{ t.tanggal }}</div>
              </div>
              <div style="white-space: nowrap;" [ngStyle]="{'color': t.tipe === 'Pemasukan' ? 'var(--success)' : 'var(--danger)', 'font-weight': '600'}">
                {{ t.tipe === 'Pemasukan' ? '+' : '-' }}Rp{{ t.nominal | number }}
              </div>
            </div>
            <div *ngIf="recentTransactions.length === 0" class="text-muted text-center" style="padding: 2rem 0;">Belum ada transaksi.</div>
          </div>
        </div>
      </div>

      <!-- BAGIAN 2: LAPORAN IURAN -->
      <div class="glass-panel p-6 animate-fade-in" style="padding: clamp(1rem, 3vw, 1.5rem); animation-delay: 0.4s;">
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
        <div class="glass-card flex flex-col items-center justify-center" style="padding: 1.5rem; margin-bottom: 2.5rem;">
          <h4 style="margin-bottom: 1rem; color: var(--text-dark); font-size: 0.95rem;">Grafik Pembayaran</h4>
          <div class="chart-container" style="max-width: 400px; margin: 0 auto;">
            <canvas #iuranChartCanvas></canvas>
          </div>
        </div>

        <h4 style="margin-bottom: 1rem; color: var(--text-dark);">Daftar Warga yang Sudah Lunas:</h4>
        
        <div class="table-responsive" *ngIf="wargaSudahBayar().length > 0">
          <table class="table" style="min-width: 400px;">
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
    </div>
  `,
  styles: [`
    .report-container {
      padding: clamp(1rem, 3vw, 2rem);
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
    }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
      display: inline-block;
    }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
    
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .flex-col { display: flex; flex-direction: column; }
    
    .chart-container {
      position: relative; 
      flex-grow: 1; 
      min-height: 250px; 
      width: 100%; 
      display: block;
    }

    .responsive-grid {
      display: grid;
      gap: 1rem;
    }
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
    .chart-list-grid {
      grid-template-columns: 2fr 1fr;
    }
    .iuran-grid {
      grid-template-columns: 1fr 1.5fr;
    }

    @media (max-width: 992px) {
      .chart-list-grid, .iuran-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .topbar {
        flex-direction: column;
        align-items: flex-start !important;
      }
      .header-content, .header-actions {
        width: 100%;
        justify-content: space-between;
      }
      .filter-box {
        width: 100%;
        justify-content: space-between;
      }
      .filter-box select, .filter-box input {
        flex: 1;
      }
      .mb-8 {
        margin-bottom: 1.5rem !important;
      }
      .mb-6 {
        margin-bottom: 1rem !important;
      }
      .glass-panel {
        padding: 1rem !important;
      }
      .btn-sm {
        flex: 1;
        text-align: center;
      }
    }
  `]
})
export class KeuanganReportComponent implements AfterViewInit {
  keuanganService = inject(KeuanganService);
  authService = inject(AuthService);
  wargaService = inject(WargaService);
  iuranService = inject(IuranService);
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @ViewChild('iuranChartCanvas') iuranChartCanvas!: ElementRef;
  
  chart: any;
  iuranChart: any;

  totalPemasukan = 0;
  totalPengeluaran = 0;
  totalSaldo = 0;
  recentTransactions: any[] = [];

  // Laporan Iuran Data
  months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  selectedBulan = signal(new Date().getMonth() + 1);
  selectedTahun = signal(new Date().getFullYear());

  // Keuangan Arus Kas Data
  selectedBulanKeuangan = signal(new Date().getMonth() + 1);
  selectedTahunKeuangan = signal(new Date().getFullYear());

  filteredKeuangan = computed(() => {
    const b = Number(this.selectedBulanKeuangan());
    const t = Number(this.selectedTahunKeuangan());
    
    return this.keuanganService.transaksiList().filter(tx => {
      if (!tx.tanggal) return false;
      const date = new Date(tx.tanggal);
      return (date.getMonth() + 1) === b && date.getFullYear() === t;
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

  constructor() {
    effect(() => {
      const data = this.filteredKeuangan();
      this.calculateSummary(data);
      if (this.chartCanvas) {
        this.updateChart(data);
      }
    });

    effect(() => {
      const paid = this.wargaSudahBayar().length;
      const unpaid = this.totalKepalaKeluarga() - paid;
      if (this.iuranChartCanvas) {
        this.updateIuranChart(paid, unpaid);
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const data = this.filteredKeuangan();
      this.calculateSummary(data);
      this.updateChart(data);
      
      const paid = this.wargaSudahBayar().length;
      const unpaid = this.totalKepalaKeluarga() - paid;
      this.updateIuranChart(paid, unpaid);
    }, 100);
  }

  calculateSummary(data: any[]) {
    this.totalPemasukan = data.filter(t => t.tipe === 'Pemasukan').reduce((acc, curr) => acc + curr.nominal, 0);
    this.totalPengeluaran = data.filter(t => t.tipe === 'Pengeluaran').reduce((acc, curr) => acc + curr.nominal, 0);
    this.totalSaldo = this.keuanganService.getTotalSaldo(); // Tetap menggunakan saldo keseluruhan (all-time)
    
    // Sort transactions by date descending (newest first)
    this.recentTransactions = [...data]
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      .slice(0, 5);
  }

  updateChart(data: any[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // Group by tipe
    const pemasukan = data.filter(t => t.tipe === 'Pemasukan').reduce((acc, curr) => acc + curr.nominal, 0);
    const pengeluaran = data.filter(t => t.tipe === 'Pengeluaran').reduce((acc, curr) => acc + curr.nominal, 0);

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pemasukan', 'Pengeluaran'],
        datasets: [{
          data: [pemasukan, pengeluaran],
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

  updateIuranChart(paid: number, unpaid: number) {
    if (this.iuranChart) {
      this.iuranChart.destroy();
    }

    if (!this.iuranChartCanvas) return;
    const ctx = this.iuranChartCanvas.nativeElement.getContext('2d');
    
    this.iuranChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sudah Membayar', 'Belum Membayar'],
        datasets: [{
          data: [paid, unpaid],
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
}
