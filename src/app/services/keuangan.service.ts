import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TransaksiKeuangan {
  id: string;
  tanggal: string;
  keterangan: string;
  tipe: 'Pemasukan' | 'Pengeluaran';
  nominal: number;
}

@Injectable({
  providedIn: 'root'
})
export class KeuanganService {
  private apiUrl = environment.googleSheetApiUrl;
  private transaksiSignal = signal<TransaksiKeuangan[]>([]);
  private http = inject(HttpClient);

  transaksiList = this.transaksiSignal.asReadonly();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<{data: TransaksiKeuangan[]}>(`${this.apiUrl}?sheet=keuangan`).subscribe({
      next: (res) => {
        if (res && res.data) {
          const data = res.data.map(k => ({...k, id: String(k.id), nominal: Number(k.nominal)}));
          this.transaksiSignal.set(data);
        }
      },
      error: (err) => console.error('Gagal mengambil data Keuangan', err)
    });
  }

  private saveData(data: TransaksiKeuangan[]): void {
    const payload = {
      action: 'overwrite',
      sheet: 'keuangan',
      data: data
    };
    
    // Update UI (optimistic)
    this.transaksiSignal.set(data);
    
    this.http.post(this.apiUrl, JSON.stringify(payload), {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).subscribe({
      error: (err) => console.error('Gagal menyimpan Keuangan', err)
    });
  }

  getAll(): TransaksiKeuangan[] {
    return this.transaksiSignal();
  }

  add(transaksi: Omit<TransaksiKeuangan, 'id'>): void {
    const newData = [...this.transaksiSignal(), { ...transaksi, id: Date.now().toString() }];
    this.saveData(newData);
  }

  update(id: string, updatedData: Partial<TransaksiKeuangan>): void {
    const newData = this.transaksiSignal().map(t => t.id === id ? { ...t, ...updatedData } : t);
    this.saveData(newData);
  }

  findByKeterangan(keterangan: string): TransaksiKeuangan | undefined {
    return this.transaksiSignal().find(t => t.keterangan === keterangan);
  }

  delete(id: string): void {
    const newData = this.transaksiSignal().filter(t => t.id !== id);
    this.saveData(newData);
  }

  getTotalSaldo(): number {
    return this.transaksiSignal().reduce((acc, curr) => {
      return curr.tipe === 'Pemasukan' ? acc + Number(curr.nominal) : acc - Number(curr.nominal);
    }, 0);
  }
}
