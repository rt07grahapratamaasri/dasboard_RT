import { Injectable, signal, inject } from '@angular/core';
import { KeuanganService } from './keuangan.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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
  private apiUrl = environment.apiUrl + '/iuran';
  private iuranSignal = signal<Iuran[]>([]);
  private keuanganService = inject(KeuanganService);
  private http = inject(HttpClient);

  iuranList = this.iuranSignal.asReadonly();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<{data: Iuran[]}>(this.apiUrl).subscribe({
      next: (res) => {
        if (res && res.data) {
          const data = res.data.map(i => ({
            ...i, 
            id: String(i.id), 
            wargaId: String(i.wargaId),
            bulan: Number(i.bulan),
            tahun: Number(i.tahun),
            isPaid: Boolean(i.isPaid),
            nominal: Number(i.nominal)
          }));
          this.iuranSignal.set(data);
        }
      },
      error: (err) => console.error('Gagal mengambil data Iuran', err)
    });
  }

  getIuranByWarga(wargaId: string, bulan: number, tahun: number): Iuran | undefined {
    return this.iuranSignal().find(i => String(i.wargaId) === String(wargaId) && Number(i.bulan) === Number(bulan) && Number(i.tahun) === Number(tahun));
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
      
      // Optimistic UI
      this.iuranSignal.set([...this.iuranSignal(), newIuran]);
      
      this.http.post(this.apiUrl, newIuran).subscribe({
        error: (err) => {
          console.error('Gagal menyimpan Iuran', err);
          this.loadData();
        }
      });

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
      // Optimistic UI
      const newData = this.iuranSignal().filter(i => i.id !== iuran.id);
      this.iuranSignal.set(newData);
      
      this.http.delete(`${this.apiUrl}?id=${iuran.id}`).subscribe({
        error: (err) => {
          console.error('Gagal hapus Iuran', err);
          this.loadData();
        }
      });

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
