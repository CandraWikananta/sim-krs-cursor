-- ============================================================
-- SEED DATA - Data Dummy untuk Testing
-- Jalankan SETELAH 01_create_tables.sql
-- ============================================================
-- CATATAN: Password di bawah adalah hash bcrypt (cost 12) untuk plain text "password123"
-- (Hash lama di seed pertama salah sehingga login selalu gagal — diganti yang terverifikasi.)
-- ============================================================

-- Insert Admin (1 akun default)
INSERT INTO admin (id, username, nama, email, password_hash)
VALUES
    ('d1b2c3d4-0001-0001-0001-000000000001', 'admin', 'Administrator Sistem', 'admin@kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W');

-- Insert Dosen (3 data)
INSERT INTO dosen (id, nidn, nama, email, password_hash, bidang_keahlian, max_mahasiswa_bimbingan)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', '0101018001', 'Dr. Budi Santoso, M.Kom', 'budi.santoso@kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 'Sistem Informasi', 20),
    ('a1b2c3d4-0002-0002-0002-000000000002', '0202029002', 'Dr. Siti Rahayu, M.T', 'siti.rahayu@kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 'Rekayasa Perangkat Lunak', 15),
    ('a1b2c3d4-0003-0003-0003-000000000003', '0303030003', 'Prof. Ahmad Fauzi, Ph.D', 'ahmad.fauzi@kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 'Kecerdasan Buatan', 25);

-- Insert Mahasiswa (5 data)
INSERT INTO mahasiswa (id, nim, nama, email, password_hash, semester, jurusan, dosen_pa_id)
VALUES
    ('b1b2c3d4-0001-0001-0001-000000000001', '2021001001', 'Andi Pratama', 'andi.pratama@student.kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 5, 'Teknik Informatika', 'a1b2c3d4-0001-0001-0001-000000000001'),
    ('b1b2c3d4-0002-0002-0002-000000000002', '2021001002', 'Budi Wijaya', 'budi.wijaya@student.kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 5, 'Teknik Informatika', 'a1b2c3d4-0001-0001-0001-000000000001'),
    ('b1b2c3d4-0003-0003-0003-000000000003', '2021001003', 'Citra Dewi', 'citra.dewi@student.kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 3, 'Sistem Informasi', 'a1b2c3d4-0002-0002-0002-000000000002'),
    ('b1b2c3d4-0004-0004-0004-000000000004', '2022001001', 'Dian Permata', 'dian.permata@student.kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 3, 'Sistem Informasi', 'a1b2c3d4-0002-0002-0002-000000000002'),
    ('b1b2c3d4-0005-0005-0005-000000000005', '2022001002', 'Eko Saputra', 'eko.saputra@student.kampus.ac.id', '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W', 1, 'Teknik Informatika', 'a1b2c3d4-0003-0003-0003-000000000003');

-- Insert Mata Kuliah (8 data)
INSERT INTO mata_kuliah (id, kode_mk, nama_mk, sks, semester, dosen_pengampu_id, kuota)
VALUES
    ('c1b2c3d4-0001-0001-0001-000000000001', 'TI301', 'Rekayasa Perangkat Lunak', 3, 5, 'a1b2c3d4-0001-0001-0001-000000000001', 30),
    ('c1b2c3d4-0002-0002-0002-000000000002', 'TI302', 'Basis Data Lanjut', 3, 5, 'a1b2c3d4-0001-0001-0001-000000000001', 25),
    ('c1b2c3d4-0003-0003-0003-000000000003', 'TI303', 'Pemrograman Web', 3, 5, 'a1b2c3d4-0002-0002-0002-000000000002', 30),
    ('c1b2c3d4-0004-0004-0004-000000000004', 'TI304', 'Jaringan Komputer', 2, 5, 'a1b2c3d4-0002-0002-0002-000000000002', 35),
    ('c1b2c3d4-0005-0005-0005-000000000005', 'TI305', 'Kecerdasan Buatan', 3, 5, 'a1b2c3d4-0003-0003-0003-000000000003', 20),
    ('c1b2c3d4-0006-0006-0006-000000000006', 'SI301', 'Analisis Sistem Informasi', 3, 3, 'a1b2c3d4-0002-0002-0002-000000000002', 30),
    ('c1b2c3d4-0007-0007-0007-000000000007', 'SI302', 'Manajemen Proyek TI', 2, 3, 'a1b2c3d4-0001-0001-0001-000000000001', 25),
    ('c1b2c3d4-0008-0008-0008-000000000008', 'TI101', 'Algoritma dan Pemrograman', 4, 1, 'a1b2c3d4-0003-0003-0003-000000000003', 40);

-- Insert KRS (beberapa pengajuan)
INSERT INTO krs (mahasiswa_id, mata_kuliah_id, semester_aktif, status, catatan)
VALUES
    ('b1b2c3d4-0001-0001-0001-000000000001', 'c1b2c3d4-0001-0001-0001-000000000001', '2024/2025 Ganjil', 'disetujui', NULL),
    ('b1b2c3d4-0001-0001-0001-000000000001', 'c1b2c3d4-0002-0002-0002-000000000002', '2024/2025 Ganjil', 'disetujui', NULL),
    ('b1b2c3d4-0001-0001-0001-000000000001', 'c1b2c3d4-0003-0003-0003-000000000003', '2024/2025 Ganjil', 'diajukan', NULL),
    ('b1b2c3d4-0002-0002-0002-000000000002', 'c1b2c3d4-0001-0001-0001-000000000001', '2024/2025 Ganjil', 'diajukan', NULL),
    ('b1b2c3d4-0002-0002-0002-000000000002', 'c1b2c3d4-0004-0004-0004-000000000004', '2024/2025 Ganjil', 'ditolak', 'Kuota hampir penuh, silakan ambil semester depan'),
    ('b1b2c3d4-0003-0003-0003-000000000003', 'c1b2c3d4-0006-0006-0006-000000000006', '2024/2025 Ganjil', 'disetujui', NULL),
    ('b1b2c3d4-0003-0003-0003-000000000003', 'c1b2c3d4-0007-0007-0007-000000000007', '2024/2025 Ganjil', 'diajukan', NULL);
