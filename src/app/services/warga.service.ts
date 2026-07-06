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
  private apiUrl = environment.apiUrl;
  private wargaListSignal = signal<Warga[]>([]);
  private http = inject(HttpClient);

  wargaList = this.wargaListSignal.asReadonly();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<{data: Warga[]}>(this.apiUrl + '?action=getWarga').subscribe({
      next: (res) => {
        if (res && res.data) {
          const data = res.data.map(w => ({...w, id: String(w.id)}));
          this.wargaListSignal.set(data);
        }
      },
      error: (err) => console.error('Gagal mengambil data Warga', err)
    });
  }

  getAll(): Warga[] {
    return this.wargaListSignal();
  }

  getById(id: string): Warga | undefined {
    return this.wargaListSignal().find(w => w.id === id);
  }

  add(warga: Omit<Warga, 'id'>): void {
    const newId = Date.now().toString();
    const newData = { ...warga, id: newId };
    
    // Optimistic UI
    this.wargaListSignal.set([...this.wargaListSignal(), newData]);
    
    this.http.post(this.apiUrl + '?action=addWarga', JSON.stringify(newData), { headers: { 'Content-Type': 'text/plain' } }).subscribe({
      error: (err) => {
        console.error('Gagal menyimpan Warga', err);
        this.loadData(); // Revert on error
      }
    });
  }

  addAsync(warga: Omit<Warga, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const newId = Date.now().toString();
      const newData = { ...warga, id: newId };
      
      // Optimistic UI
      this.wargaListSignal.set([...this.wargaListSignal(), newData]);
      
      this.http.post(this.apiUrl + '?action=addWarga', JSON.stringify(newData), { headers: { 'Content-Type': 'text/plain' } }).subscribe({
        next: () => resolve(),
        error: (err) => {
          console.error('Gagal menyimpan Warga', err);
          this.loadData(); // Revert on error
          resolve(); // Resolve anyway so the queue continues even if one fails
        }
      });
    });
  }

  update(id: string, updatedWarga: Omit<Warga, 'id'>): void {
    // Optimistic UI
    const newData = this.wargaListSignal().map(w => w.id === id ? { ...updatedWarga, id } : w);
    this.wargaListSignal.set(newData);
    
    this.http.post(this.apiUrl + '?action=updateWarga', JSON.stringify({ ...updatedWarga, id }), { headers: { 'Content-Type': 'text/plain' } }).subscribe({
      error: (err) => {
        console.error('Gagal update Warga', err);
        this.loadData();
      }
    });
  }

  delete(id: string): void {
    // Optimistic UI
    const newData = this.wargaListSignal().filter(w => w.id !== id);
    this.wargaListSignal.set(newData);
    
    this.http.post(this.apiUrl + '?action=deleteWarga', JSON.stringify({id}), { headers: { 'Content-Type': 'text/plain' } }).subscribe({
      error: (err) => {
        console.error('Gagal hapus Warga', err);
        this.loadData();
      }
    });
  }
}
