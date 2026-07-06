-- Tabel Warga
CREATE TABLE IF NOT EXISTS warga (
  id VARCHAR(50) PRIMARY KEY,
  nik VARCHAR(20) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  "jenisKelamin" VARCHAR(20) NOT NULL,
  agama VARCHAR(50) NOT NULL,
  blok VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL
);

-- Tabel Keuangan
CREATE TABLE IF NOT EXISTS keuangan (
  id VARCHAR(50) PRIMARY KEY,
  tanggal DATE NOT NULL,
  keterangan VARCHAR(255) NOT NULL,
  tipe VARCHAR(20) NOT NULL CHECK (tipe IN ('Pemasukan', 'Pengeluaran')),
  nominal INT NOT NULL
);

-- Tabel Iuran
CREATE TABLE IF NOT EXISTS iuran (
  id VARCHAR(50) PRIMARY KEY,
  "wargaId" VARCHAR(50) NOT NULL,
  bulan INT NOT NULL,
  tahun INT NOT NULL,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  nominal INT NOT NULL,
  FOREIGN KEY ("wargaId") REFERENCES warga(id) ON DELETE CASCADE
);

-- Tabel Users (Admin)
CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'super1'
);

-- Insert Default Admin (If not exists)
INSERT INTO users (username, password, role) 
VALUES ('admin', 'admin123', 'super0')
ON CONFLICT (username) DO NOTHING;
