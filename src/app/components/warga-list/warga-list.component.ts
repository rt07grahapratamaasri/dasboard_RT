import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WargaService } from '../../services/warga.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-warga-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <div class="glass-panel p-6 animate-fade-in" style="padding: 1.5rem;">
      <div class="flex justify-between items-center mb-4" style="flex-wrap: wrap; gap: 1rem;">
        <h2 style="color: var(--primary-color); margin-bottom: 0;">Data Warga RT 07</h2>
        
        <div class="flex gap-2" style="flex-wrap: wrap;">
          <button (click)="downloadTemplate()" class="btn" style="background: rgba(14, 165, 233, 0.1); color: var(--secondary-color);">Download Template Excel</button>
          
          <label class="btn" style="background: rgba(16, 185, 129, 0.1); color: var(--success); cursor: pointer; margin-bottom: 0;">
            Import Excel
            <input type="file" (change)="onFileChange($event)" accept=".xlsx, .xls" style="display: none;">
          </label>

          <a routerLink="/admin/warga/tambah" class="btn btn-primary">+ Tambah Warga</a>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mb-4" style="margin-bottom: 1.5rem;">
        <input type="text" class="form-control" placeholder="🔍 Cari berdasarkan NIK, Nama, atau Blok..." [ngModel]="searchQuery" (ngModelChange)="onSearchChange($event)" style="max-width: 100%; width: 400px; border-radius: 20px; padding: 0.6rem 1.2rem; border: 1px solid rgba(0,0,0,0.1);">
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>No</th>
              <th>NIK / No. KTP</th>
              <th>Nama Lengkap</th>
              <th>Jenis Kelamin</th>
              <th>Agama</th>
              <th>Blok Rumah</th>
              <th>Status</th>
              <th style="width: 150px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of paginatedWarga; let i = index">
              <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
              <td style="font-family: monospace;">{{ w.nik }}</td>
              <td style="font-weight: 500;">{{ w.nama }}</td>
              <td>{{ w.jenisKelamin }}</td>
              <td>{{ w.agama }}</td>
              <td>{{ w.blok }}</td>
              <td>
                <span class="badge" [ngClass]="w.status === 'Kepala Keluarga' ? 'badge-primary' : 'badge-secondary'">
                  {{ w.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <a [routerLink]="['/admin/warga/edit', w.id]" class="btn btn-sm" style="background: var(--secondary-color); color: white; padding: 0.4rem 0.8rem;">Edit</a>
                  <button (click)="onDelete(w.id)" class="btn btn-sm btn-danger" style="padding: 0.4rem 0.8rem;">Hapus</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredWarga.length === 0">
              <td colspan="8" class="text-center text-muted" style="padding: 2rem;">
                <span *ngIf="searchQuery">Tidak ada warga yang cocok dengan pencarian "{{ searchQuery }}".</span>
                <span *ngIf="!searchQuery">Belum ada data warga.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="flex justify-between items-center mt-4" style="flex-wrap: wrap; gap: 1rem; margin-top: 1.5rem;" *ngIf="filteredWarga.length > 0">
        <div class="flex items-center gap-2">
          <span class="text-muted" style="font-size: 0.9rem;">Tampilkan:</span>
          <select class="form-control" style="width: auto; padding: 0.3rem 0.5rem; margin-bottom: 0;" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
            <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
          </select>
          <span class="text-muted" style="font-size: 0.9rem;">data per halaman</span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-muted mr-3" style="font-size: 0.9rem; margin-right: 1rem;">
            Menampilkan {{ startItem }} - {{ endItem }} dari {{ filteredWarga.length }} data
          </span>
          <button class="btn btn-sm" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)" style="background: rgba(0,0,0,0.05);">Sebelumnya</button>
          
          <div class="flex gap-1">
            <button class="btn btn-sm" style="background: var(--primary-color); color: white;">{{ currentPage }}</button>
          </div>

          <button class="btn btn-sm" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)" style="background: rgba(0,0,0,0.05);">Selanjutnya</button>
        </div>
      </div>

      <!-- Import Progress Overlay -->
      <div *ngIf="isImporting" class="import-overlay">
        <div class="import-card glass-panel">
          <div class="loader"></div>
          <h3 style="margin-top: 1rem; color: var(--primary-color);">Sedang Mengimpor Data...</h3>
          <p style="margin-bottom: 0.5rem; font-weight: 500;">Harap jangan tutup halaman ini</p>
          <div class="progress-text">{{ importProgress }} dari {{ totalImport }} data</div>
          <div class="progress-bar-container">
            <div class="progress-bar" [style.width.%]="(importProgress / totalImport) * 100"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .badge-primary {
      background: rgba(79, 70, 229, 0.1);
      color: var(--primary-color);
      border: 1px solid rgba(79, 70, 229, 0.2);
    }
    .badge-secondary {
      background: rgba(14, 165, 233, 0.1);
      color: var(--secondary-color);
      border: 1px solid rgba(14, 165, 233, 0.2);
    }
    .btn-sm {
      font-size: 0.8rem;
      border-radius: var(--radius-sm);
    }
    .import-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .import-card {
      background: white;
      padding: 2.5rem;
      border-radius: 20px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .loader {
      border: 5px solid rgba(79, 70, 229, 0.2);
      border-top: 5px solid var(--primary-color);
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: #eee;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 10px;
    }
    .progress-bar {
      height: 100%;
      background: var(--primary-color);
      transition: width 0.3s ease;
    }
    .progress-text {
      font-size: 0.9rem;
      color: #666;
    }
  `]
})
export class WargaListComponent {
  wargaService = inject(WargaService);
  searchQuery: string = '';
  isImporting: boolean = false;
  importProgress: number = 0;
  totalImport: number = 0;

  // Pagination states
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 30, 40, 50, 100];

  get filteredWarga() {
    let result = this.wargaService.wargaList();
    const query = this.searchQuery.toLowerCase().trim();
    
    // Filter first if there is a search query
    if (query) {
      result = result.filter(w =>
        w.nik.toLowerCase().includes(query) ||
        w.nama.toLowerCase().includes(query) ||
        w.blok.toLowerCase().includes(query)
      );
    }
    
    // Sort by Blok Rumah (A-Z), then Status (Kepala Keluarga first)
    return [...result].sort((a, b) => {
      // 1. Sort by Blok Rumah
      const blokComparison = a.blok.localeCompare(b.blok);
      if (blokComparison !== 0) return blokComparison;
      
      // 2. If Blok is the same, Kepala Keluarga comes first
      if (a.status === 'Kepala Keluarga' && b.status !== 'Kepala Keluarga') return -1;
      if (a.status !== 'Kepala Keluarga' && b.status === 'Kepala Keluarga') return 1;
      
      // 3. Optional: Sort by name if both are Anggota
      return a.nama.localeCompare(b.nama);
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredWarga.length / this.pageSize) || 1;
  }

  get paginatedWarga() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredWarga.slice(startIndex, startIndex + this.pageSize);
  }

  get startItem(): number {
    return this.filteredWarga.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  
  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredWarga.length);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
  }

  onSearchChange(val: string) {
    this.searchQuery = val;
    this.currentPage = 1;
  }

  onDelete(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      this.wargaService.delete(id);
    }
  }

  downloadTemplate() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([
      { NIK: '3201012345678901', Nama: 'Budi Santoso', 'Jenis Kelamin': 'Laki-laki', Agama: 'Islam', Blok: 'A-01', Status: 'Kepala Keluarga' },
      { NIK: '3201012345678902', Nama: 'Siti Aminah', 'Jenis Kelamin': 'Perempuan', Agama: 'Islam', Blok: 'A-01', Status: 'Anggota' }
    ]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Warga');
    XLSX.writeFile(wb, 'Template_Import_Warga.xlsx');
  }

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    
    this.isImporting = true;
    this.importProgress = 0;
    
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const validData = data.filter((row: any) => row.NIK && row.Nama && row.Blok && row.Status);
      this.totalImport = validData.length;
      
      if (this.totalImport === 0) {
        this.isImporting = false;
        alert('Tidak ada data yang valid untuk diimport!');
        return;
      }

      // Map and save data sequentially and await true network response
      const processImports = async () => {
        let successCount = 0;
        for (const row of validData as any[]) {
          try {
            await this.wargaService.addAsync({
              nik: String(row.NIK),
              nama: row.Nama,
              jenisKelamin: row['Jenis Kelamin'] || 'Laki-laki',
              agama: row.Agama || 'Islam',
              blok: row.Blok,
              status: row.Status === 'Kepala Keluarga' ? 'Kepala Keluarga' : 'Anggota'
            });
            successCount++;
            this.importProgress = successCount;
            // Small safety buffer
            await new Promise(resolve => setTimeout(resolve, 300)); 
          } catch(e) {
            console.error(e);
          }
        }
        this.isImporting = false;
        alert(`Import data selesai! Total ${successCount} data berhasil diproses.`);
      };
      
      processImports();
    };
    reader.readAsBinaryString(target.files[0]);
    // Reset file input
    evt.target.value = null;
  }
}
