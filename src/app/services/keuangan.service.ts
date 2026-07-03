import { Injectable, signal } from '@angular/core';

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
  private storageKey = 'rt07_keuangan_data';
  private transaksiSignal = signal<TransaksiKeuangan[]>(this.loadData());

  transaksiList = this.transaksiSignal.asReadonly();

  constructor() { }

  private loadData(): TransaksiKeuangan[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [
      { id: '1', tanggal: '2026-07-01', keterangan: 'Iuran Bulanan Warga', tipe: 'Pemasukan', nominal: 1500000 },
      { id: '2', tanggal: '2026-07-02', keterangan: 'Bayar Listrik Pos Satpam', tipe: 'Pengeluaran', nominal: 350000 }
    ];
  }

  private saveData(data: TransaksiKeuangan[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.transaksiSignal.set(data);
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
      return curr.tipe === 'Pemasukan' ? acc + curr.nominal : acc - curr.nominal;
    }, 0);
  }
}
