-- ============================================================
-- SISTEM KRS - Database Migration Script
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL: admin
-- Pengelola sistem: CRUD dosen/mahasiswa/mata kuliah, konfigurasi global
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABEL: dosen
-- ============================================================
CREATE TABLE IF NOT EXISTS dosen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nidn VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bidang_keahlian VARCHAR(100),
    max_mahasiswa_bimbingan INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABEL: mahasiswa
-- ============================================================
CREATE TABLE IF NOT EXISTS mahasiswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    semester INTEGER DEFAULT 1,
    jurusan VARCHAR(100),
    dosen_pa_id UUID REFERENCES dosen(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABEL: mata_kuliah
-- ============================================================
CREATE TABLE IF NOT EXISTS mata_kuliah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_mk VARCHAR(20) UNIQUE NOT NULL,
    nama_mk VARCHAR(100) NOT NULL,
    sks INTEGER NOT NULL CHECK (sks > 0 AND sks <= 6),
    semester INTEGER,
    dosen_pengampu_id UUID REFERENCES dosen(id) ON DELETE SET NULL,
    kuota INTEGER DEFAULT 30 CHECK (kuota > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABEL: krs
-- ============================================================
CREATE TABLE IF NOT EXISTS krs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    mata_kuliah_id UUID NOT NULL REFERENCES mata_kuliah(id) ON DELETE CASCADE,
    semester_aktif VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'diajukan' CHECK (status IN ('diajukan', 'disetujui', 'ditolak')),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mahasiswa_id, mata_kuliah_id, semester_aktif)
);

-- ============================================================
-- INDEXES untuk performa query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_dosen_pa ON mahasiswa(dosen_pa_id);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_nim ON mahasiswa(nim);
CREATE INDEX IF NOT EXISTS idx_dosen_nidn ON dosen(nidn);
CREATE INDEX IF NOT EXISTS idx_krs_mahasiswa ON krs(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_krs_status ON krs(status);
CREATE INDEX IF NOT EXISTS idx_krs_semester ON krs(semester_aktif);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_dosen ON mata_kuliah(dosen_pengampu_id);

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mahasiswa_updated_at
    BEFORE UPDATE ON mahasiswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dosen_updated_at
    BEFORE UPDATE ON dosen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE krs ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan akses penuh via service_role (digunakan oleh Flask backend)
CREATE POLICY "Allow full access for service role" ON admin
    FOR ALL USING (true);

CREATE POLICY "Allow full access for service role" ON mahasiswa
    FOR ALL USING (true);

CREATE POLICY "Allow full access for service role" ON dosen
    FOR ALL USING (true);

CREATE POLICY "Allow full access for service role" ON mata_kuliah
    FOR ALL USING (true);

CREATE POLICY "Allow full access for service role" ON krs
    FOR ALL USING (true);
