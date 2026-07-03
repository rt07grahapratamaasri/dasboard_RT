import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { WargaService } from '../../services/warga.service';

@Component({
  selector: 'app-warga-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="glass-panel animate-fade-in" style="padding: 2rem; max-width: 600px; margin: 0 auto;">
      <h2 style="color: var(--primary-color); margin-bottom: 1.5rem;">
        {{ isEditMode ? 'Edit' : 'Tambah' }} Data Warga
      </h2>

      <form (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">NIK / No. KTP</label>
          <input type="text" class="form-control" [(ngModel)]="formData.nik" name="nik" required pattern="[0-9]{16}" placeholder="16 digit NIK">
        </div>

        <div class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input type="text" class="form-control" [(ngModel)]="formData.nama" name="nama" required>
        </div>

        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label class="form-label">Jenis Kelamin</label>
            <select class="form-control" [(ngModel)]="formData.jenisKelamin" name="jenisKelamin" required>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div>
            <label class="form-label">Agama</label>
            <select class="form-control" [(ngModel)]="formData.agama" name="agama" required>
              <option value="Islam">Islam</option>
              <option value="Kristen">Kristen Protestan</option>
              <option value="Katolik">Katolik</option>
              <option value="Hindu">Hindu</option>
              <option value="Buddha">Buddha</option>
              <option value="Konghucu">Konghucu</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Blok Rumah (Contoh: A-01)</label>
          <input type="text" class="form-control" [(ngModel)]="formData.blok" name="blok" required>
        </div>

        <div class="form-group">
          <label class="form-label">Status Warga</label>
          <select class="form-control" [(ngModel)]="formData.status" name="status" required>
            <option value="Kepala Keluarga">Kepala Keluarga</option>
            <option value="Anggota">Anggota</option>
          </select>
        </div>

        <div class="flex gap-4 mt-4">
          <button type="button" routerLink="/admin/warga" class="btn" style="background: rgba(100,116,139,0.1); color: var(--text-dark);">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Data</button>
        </div>
      </form>
    </div>
  `
})
export class WargaFormComponent implements OnInit {
  private wargaService = inject(WargaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  editId: string | null = null;
  
  formData: any = {
    nik: '',
    nama: '',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    blok: '',
    status: 'Kepala Keluarga'
  };

  ngOnInit() {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.isEditMode = true;
      const data = this.wargaService.getById(this.editId);
      if (data) {
        this.formData = { ...data };
      }
    }
  }

  onSubmit() {
    if (this.isEditMode && this.editId) {
      this.wargaService.update(this.editId, this.formData);
    } else {
      this.wargaService.add(this.formData);
    }
    this.router.navigate(['/admin/warga']);
  }
}
