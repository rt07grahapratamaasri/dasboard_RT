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
  private apiUrl = environment.apiUrl;
  private transaksiSignal = signal<TransaksiKeuangan[]>([]);
  private http = inject(HttpClient);

  transaksiList = this.transaksiSignal.asReadonly();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<{data: TransaksiKeuangan[]}>(this.apiUrl + '?action=getKeuangan').subscribe({
      next: (res) => {
        if (res && res.data) {
          const data = res.data.map(k => ({
            ...k, 
            id: String(k.id), 
            nominal: Number(k.nominal),
            tanggal: new Date(k.tanggal).toISOString().split('T')[0] // format date for input
          }));
          this.transaksiSignal.set(data);
        }
      },
      error: (err) => console.error('Gagal mengambil data Keuangan', err)
    });
  }

  getAll(): TransaksiKeuangan[] {
    return this.transaksiSignal();
  }

  add(transaksi: Omit<TransaksiKeuangan, 'id'>): void {
    const newId = Date.now().toString();
    const newData = { ...transaksi, id: newId };
    
    // Optimistic UI
    this.transaksiSignal.set([...this.transaksiSignal(), newData]);
    
    this.http.post(this.apiUrl + '?action=addKeuangan', JSON.stringify(newData), { headers: { 'Content-Type': 'text/plain' } }).subscribe({
      error: (err) => {
        console.error('Gagal menyimpan Keuangan', err);
        this.loadData();
      }
    });
  }

  update(id: string, updatedData: Partial<TransaksiKeuangan>): void {
    // Optimistic UI
    const newData = this.transaksiSignal().map(t => t.id === id ? { ...t, ...updatedData } as TransaksiKeuangan : t);
    this.transaksiSignal.set(newData);
    
    this.http.post(this.apiUrl + '?action=updateKeuangan', JSON.stringify({ ...updatedData, id }), { headers: { 'Content-Type': 'text/plain' } }).subscribe({
      error: (err) => {
        console.error('Gagal update Keuangan', err);
        this.loadData();
      }
    });
  }

  findByKeterangan(keterangan: string): TransaksiKeuangan | undefined {
    return this.transaksiSignal().find(t => t.keterangan === keterangan);
  }

  delete(id: string): void {
    // Optimistic UI
    const newData = this.transaksiSignal().filter(t => t.id !== id);
    this.transaksiSignal.set(newData);
    
    this.http.post(this.apiUrl + '?action=deleteKeuangan', JSON.stringify({id}), { headers: { 'Content-Type': 'text/plain' } }).subscribe({
      error: (err) => {
        console.error('Gagal hapus Keuangan', err);
        this.loadData();
      }
    });
  }

  getTotalSaldo(): number {
    return this.transaksiSignal().reduce((acc, curr) => {
      return curr.tipe === 'Pemasukan' ? acc + Number(curr.nominal) : acc - Number(curr.nominal);
    }, 0);
  }
}
