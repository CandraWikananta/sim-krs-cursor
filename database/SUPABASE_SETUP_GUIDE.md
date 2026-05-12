# Panduan Setup Supabase untuk Sistem KRS

## Langkah 1: Buat Akun & Project Supabase

1. Buka browser, pergi ke **https://supabase.com**
2. Klik **"Start your project"** atau **"Sign Up"**
3. Daftar menggunakan akun GitHub atau email
4. Setelah login, klik **"New Project"**
5. Isi form:
   - **Organization**: pilih personal atau buat baru
   - **Project name**: `sim-krs`
   - **Database Password**: buat password yang kuat (SIMPAN PASSWORD INI!)
   - **Region**: pilih **Southeast Asia (Singapore)** untuk performa terbaik
6. Klik **"Create new project"**
7. Tunggu 1-2 menit hingga project siap

---

## Langkah 2: Ambil Credentials (API Keys)

1. Di sidebar kiri, klik ikon **roda gigi (Settings)**
2. Klik **"API"**
3. Catat dua nilai berikut:
   - **Project URL** → masukkan ke `SUPABASE_URL` di `.env` backend
   - **service_role secret** (klik "Reveal") → masukkan ke `SUPABASE_SERVICE_KEY` di `.env` backend

> ⚠️ PENTING: Gunakan `service_role` key untuk backend, BUKAN `anon` key.
> `service_role` key melewati Row Level Security dan aman digunakan di server.

---

## Langkah 3: Jalankan SQL Migration

1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik **"New query"**
3. Buka file `database/01_create_tables.sql` dari komputer Anda
4. **Copy semua isi file tersebut**
5. **Paste** ke SQL Editor Supabase
6. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
7. Pastikan muncul pesan **"Success. No rows returned"**

---

## Langkah 4: Jalankan Seed Data (Data Dummy)

1. Di SQL Editor, klik **"New query"** lagi
2. Buka file `database/02_seed_data.sql` dari komputer Anda
3. **Copy semua isi file tersebut**
4. **Paste** ke SQL Editor Supabase
5. Klik tombol **"Run"**
6. Pastikan berhasil

---

## Langkah 5: Verifikasi Tabel Berhasil Dibuat

1. Di sidebar kiri, klik **"Table Editor"**
2. Pastikan ada 5 tabel: **admin**, **dosen**, **mahasiswa**, **mata_kuliah**, **krs**
3. Klik masing-masing tabel untuk memastikan data dummy sudah masuk

---

## Akun Testing

Setelah seed data berhasil, gunakan akun berikut untuk testing:

### Login sebagai Admin:
| Username | Email | Password |
|----------|-------|----------|
| admin | admin@kampus.ac.id | password123 |

### Login sebagai Dosen:
| Nama | Email | Password |
|------|-------|----------|
| Dr. Budi Santoso | budi.santoso@kampus.ac.id | password123 |
| Dr. Siti Rahayu | siti.rahayu@kampus.ac.id | password123 |
| Prof. Ahmad Fauzi | ahmad.fauzi@kampus.ac.id | password123 |

### Login sebagai Mahasiswa:
| Nama | NIM | Email | Password |
|------|-----|-------|----------|
| Andi Pratama | 2021001001 | andi.pratama@student.kampus.ac.id | password123 |
| Budi Wijaya | 2021001002 | budi.wijaya@student.kampus.ac.id | password123 |
| Citra Dewi | 2021001003 | citra.dewi@student.kampus.ac.id | password123 |

---

## Troubleshooting

**Login admin/dosen/mahasiswa gagal dengan `password123` padahal seed sudah dijalankan** → Versi awal `02_seed_data.sql` memakai bcrypt yang tidak cocok dengan plain text tersebut. Jalankan sekali query di `database/03_fix_bcrypt_seed_password123.sql` di SQL Editor (mengganti hash lama di database), atau kosongkan tabel dan jalankan ulang `02_seed_data.sql` yang sudah diperbaiki.

**Error: "already exists"** → Tabel sudah dibuat sebelumnya. Tidak masalah, script menggunakan `IF NOT EXISTS`.

**Error: "permission denied"** → Pastikan Anda menjalankan SQL menggunakan SQL Editor di dashboard, bukan dari aplikasi eksternal.

**RLS Policy Error** → Pastikan `service_role` key yang digunakan di backend, bukan `anon` key.
