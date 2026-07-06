import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Warga {
  id: string;
  nik: string;
  nama: string;
  jenisKelamin: string;
  agama: string;
  blok: string;
  status: 'Kepala Keluarga' | 'Anggota';
}

@Injectable({
  providedIn: 'root'
})
export class WargaService {
  private apiUrl = environment.googleSheetApiUrl;
  private wargaListSignal = signal<Warga[]>([]);
  private http = inject(HttpClient);

  wargaList = this.wargaListSignal.asReadonly();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<{data: Warga[]}>(`${this.apiUrl}?sheet=warga`).subscribe({
      next: (res) => {
        if (res && res.data) {
          // Konversi ID menjadi string karena Google Sheets mungkin mengembalikannya sebagai number
          const data = res.data.map(w => ({...w, id: String(w.id)}));
          this.wargaListSignal.set(data);
        }
      },
      error: (err) => console.error('Gagal mengambil data Warga', err)
    });
  }

  private saveData(data: Warga[]): void {
    const payload = {
      action: 'overwrite',
      sheet: 'warga',
      data: data
    };
    
    // Update UI (optimistic)
    this.wargaListSignal.set(data);
    
    this.http.post(this.apiUrl, JSON.stringify(payload), {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      responseType: 'text'
    }).subscribe({
      error: (err) => console.error('Gagal menyimpan Warga', err)
    });
  }

  getAll(): Warga[] {
    return this.wargaListSignal();
  }

  getById(id: string): Warga | undefined {
    return this.wargaListSignal().find(w => w.id === id);
  }

  add(warga: Omit<Warga, 'id'>): void {
    const newData = [...this.wargaListSignal(), { ...warga, id: Date.now().toString() }];
    this.saveData(newData);
  }

  update(id: string, updatedWarga: Omit<Warga, 'id'>): void {
    const newData = this.wargaListSignal().map(w => w.id === id ? { ...updatedWarga, id } : w);
    this.saveData(newData);
  }

  delete(id: string): void {
    const newData = this.wargaListSignal().filter(w => w.id !== id);
    this.saveData(newData);
  }
}
