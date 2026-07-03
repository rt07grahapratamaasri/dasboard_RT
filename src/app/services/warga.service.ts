import { Injectable, signal } from '@angular/core';

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
  private storageKey = 'rt07_warga_data';
  private wargaListSignal = signal<Warga[]>(this.loadData());

  wargaList = this.wargaListSignal.asReadonly();

  constructor() { }

  private loadData(): Warga[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [
      { id: '1', nik: '3201012345678901', nama: 'Budi Santoso', jenisKelamin: 'Laki-laki', agama: 'Islam', blok: 'A-01', status: 'Kepala Keluarga' },
      { id: '2', nik: '3201012345678902', nama: 'Siti Aminah', jenisKelamin: 'Perempuan', agama: 'Islam', blok: 'A-01', status: 'Anggota' }
    ];
  }

  private saveData(data: Warga[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.wargaListSignal.set(data);
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
