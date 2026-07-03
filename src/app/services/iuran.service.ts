import { Injectable, signal, inject } from '@angular/core';
import { KeuanganService } from './keuangan.service';

export interface Iuran {
  id: string;
  wargaId: string;
  bulan: number; // 1-12
  tahun: number;
  isPaid: boolean;
  nominal: number;
}

@Injectable({
  providedIn: 'root'
})
export class IuranService {
  private storageKey = 'rt07_iuran_data';
  private iuranSignal = signal<Iuran[]>(this.loadData());
  private keuanganService = inject(KeuanganService);

  iuranList = this.iuranSignal.asReadonly();

  constructor() { }

  private loadData(): Iuran[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveData(data: Iuran[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.iuranSignal.set(data);
  }

  getIuranByWarga(wargaId: string, bulan: number, tahun: number): Iuran | undefined {
    return this.iuranSignal().find(i => i.wargaId === wargaId && i.bulan === bulan && i.tahun === tahun);
  }

  markAsPaid(wargaId: string, wargaName: string, bulan: number, tahun: number, nominal: number = 30000): void {
    const existing = this.getIuranByWarga(wargaId, bulan, tahun);
    if (!existing) {
      const newIuran: Iuran = {
        id: Date.now().toString(),
        wargaId,
        bulan,
        tahun,
        isPaid: true,
        nominal
      };
      const newData = [...this.iuranSignal(), newIuran];
      this.saveData(newData);

      // Auto add/update to Keuangan
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const ket = `Iuran Warga (${monthNames[bulan - 1]} ${tahun})`;
      
      const trx = this.keuanganService.findByKeterangan(ket);
      if (trx) {
        this.keuanganService.update(trx.id, { nominal: trx.nominal + nominal });
      } else {
        this.keuanganService.add({
          tanggal: new Date().toISOString().split('T')[0],
          keterangan: ket,
          tipe: 'Pemasukan',
          nominal
        });
      }
    }
  }

  markAsUnpaid(wargaId: string, bulan: number, tahun: number): void {
    const iuran = this.getIuranByWarga(wargaId, bulan, tahun);
    if (iuran) {
      const newData = this.iuranSignal().filter(i => i.id !== iuran.id);
      this.saveData(newData);

      // Update Keuangan
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const ket = `Iuran Warga (${monthNames[bulan - 1]} ${tahun})`;
      const trx = this.keuanganService.findByKeterangan(ket);
      if (trx) {
        const newNominal = trx.nominal - iuran.nominal;
        if (newNominal <= 0) {
          this.keuanganService.delete(trx.id);
        } else {
          this.keuanganService.update(trx.id, { nominal: newNominal });
        }
      }
    }
  }
}
