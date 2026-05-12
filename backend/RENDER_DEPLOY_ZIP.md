# Deploy Backend Flask ke Render.com (tanpa Git / tanpa terminal)

Panduan ini untuk mengunggah **folder `backend` saja** sebagai file ZIP ke Render. Ikuti urutan langkahnya perlahan.

---

## Bagian A — Pastikan file di folder `backend` sudah lengkap

Di dalam folder **`backend`** Anda harus punya minimal:

| File | Fungsi |
|------|--------|
| `requirements.txt` | Daftar library Python yang di-install Render saat build |
| `Procfile` | Perintah untuk menjalankan server web (Gunicorn) |
| `run.py` | File yang mengekspor objek `app` untuk Gunicorn |
| `render.yaml` | Contoh konfigurasi Render (Blueprint); bisa dipakai jika nanti pakai Git |

Isi **`Procfile`** harus persis satu baris:

```text
web: gunicorn run:app
```

**Catatan penting untuk Render:** Di banyak kasus, Render mengharuskan aplikasi **mendengarkan** di alamat `0.0.0.0` dan **port** dari variabel `PORT`. Jika setelah deploy statusnya gagal atau log menolak koneksi, di dashboard Render buka service Anda → **Settings** → **Start Command** — isi:

```text
gunicorn --bind 0.0.0.0:$PORT run:app
```

Lalu simpan dan deploy ulang. (Procfile Anda tetap bisa memakai `web: gunicorn run:app` sesuai permintaan proyek; yang menjamin jalan di Render biasanya **Start Command** dengan `--bind` seperti di atas.)

---

## Bagian B — Mengompres folder `backend` menjadi file ZIP (Windows)

Langkah ini **tidak memakai Git** dan **tidak memakai terminal**.

### B1. Buka lokasi proyek di File Explorer

1. Buka **File Explorer** (ikon folder di taskbar).
2. Masuk ke folder proyek Anda, lalu masuk ke folder **`backend`**.
   - Contoh: `D:\coding-projects\...\sim-krs-old\backend`
3. Pastikan di dalamnya terlihat file seperti: `run.py`, `requirements.txt`, `Procfile`, folder `app`, dll.

### B2. Kompres **isi** folder backend (disarankan)

Render mengharapkan file seperti `requirements.txt` dan `run.py` ada di **akar (root)** ZIP, bukan di dalam subfolder `backend\backend`.

**Cara yang disarankan:**

1. Di dalam folder **`backend`**, tekan **Ctrl + A** (pilih semua file dan folder).
2. Klik kanan pada area yang terpilih.
3. Pilih **Compress to ZIP file** / **Send to** → **Compressed (zipped) folder**  
   (nama menu bisa sedikit berbeda tergantung versi Windows).
4. Beri nama file, misalnya: **`sim-krs-backend.zip`**
5. **Jangan** zip folder `backend` dari luar sehingga isi ZIP jadi `backend\run.py`. Kalau terlanjur, buka ZIP-nya: struktur yang benar saat dibuka adalah langsung terlihat `run.py`, bukan satu folder `backend` lalu baru `run.py`.

**Cek cepat:** Buka `sim-krs-backend.zip` — di level pertama harus ada **`run.py`** dan **`requirements.txt`**.

---

## Bagian C — Membuat akun dan layanan di Render.com

### C1. Daftar / masuk ke Render

1. Buka browser (Chrome, Edge, Firefox).
2. Kunjungi **https://render.com**
3. Klik **Get Started** atau **Sign Up** dan buat akun (bisa pakai GitHub atau email — sesuai pilihan Anda).

### C2. Buat Web Service baru (dari ZIP)

1. Setelah login, buka **Dashboard** Render.
2. Klik tombol **New +** (biasanya pojok kanan atas).
3. Pilih **Web Service** (atau **Deploy** → **Web Service**, tergantung tampilan dashboard).
4. Anda akan diminta sumber deploy:
   - Pilih opsi yang memungkinkan **deploy dari file / manual / upload** (Render kadang mengubah nama menu).
   - Jika ada pilihan **Public Git repository** saja: untuk **upload ZIP murni tanpa Git**, biasanya memakai alur **Blueprint** atau fitur upload tergantung paket Render.

**Realitas produk Render (penting):** Pada tahun 2024–2026, **Web Service standar** Render umumnya terhubung ke **repositori Git** (GitHub/GitLab/Bitbucket). Opsi **upload ZIP langsung** untuk Web Service **tidak selalu tersedia** untuk semua akun.

**Alternatif jika tidak ada opsi upload ZIP untuk Web Service:**

- **Opsi 1 (paling umum):** Buat repo kosong di GitHub **hanya berisi folder `backend`**, lalu hubungkan repo itu ke Render (masih bisa dilakukan sepenuhnya lewat browser + upload file ke GitHub web).
- **Opsi 2:** Gunakan **Render Blueprint** dari `render.yaml` jika Anda mengunggah proyek ke Git.

Untuk tetap mengikuti permintaan Anda (**ZIP**), ikuti langkah di dashboard Render yang paling mendekati ini:

1. **New +** → cari **Deploy from archive / Upload / Manual deploy** (jika tersedia).
2. Unggah **`sim-krs-backend.zip`**.
3. Pilih runtime **Python 3** (versi **3.11** disarankan).

Jika Anda **hanya** melihat **Connect GitHub**:

- Itu normal. Artinya untuk Render, jalur resmi adalah **Git**. ZIP bisa dipakai dengan cara mengunggah isi ZIP ke GitHub (drag-and-drop file di website GitHub) lalu pilih repo tersebut di Render — **tanpa perlu menguasai Git di terminal** (semua lewat web GitHub + web Render).

### C3. Pengaturan build & start (di form pembuatan service)

Saat mengisi form Web Service, setel:

| Field | Nilai yang disarankan |
|--------|------------------------|
| **Name** | `sim-krs-backend` (atau nama lain) |
| **Region** | Pilih yang terdekat, mis. **Singapore** |
| **Branch** | (hanya jika pakai Git) `main` |
| **Root Directory** | Kosongkan jika repo/ZIP hanya berisi backend. Jika repo monorepo, isi `backend` |
| **Runtime** | **Python 3** |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn --bind 0.0.0.0:$PORT run:app` |

**Plan:** pilih **Free** jika tersedia (layanan free bisa sleep saat tidak dipakai).

Klik **Create Web Service** / **Deploy**.

---

## Bagian D — Environment variables di Render (wajib diisi)

Di dashboard Render: buka service Anda → **Environment** → **Environment Variables** → tambahkan satu per satu.

### Wajib / sangat disarankan

| Key | Nilai (contoh asal) | Penjelasan singkat |
|-----|---------------------|-------------------|
| `FLASK_ENV` | `production` | Mode produksi |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Dari Supabase → **Project Settings** → **API** → **Project URL** |
| `SUPABASE_KEY` **atau** `SUPABASE_SERVICE_KEY` | String JWT panjang (**service_role**) | Dari Supabase → **API** → **service_role** (secret). Aplikasi ini membaca **`SUPABASE_SERVICE_KEY`**; nama **`SUPABASE_KEY`** juga didukung sebagai alias. **Jangan** pakai key `anon` untuk backend. |
| `UPSTASH_REDIS_REST_URL` | `https://....upstash.io` | Dari Upstash Redis → tab **REST API** |
| `UPSTASH_REDIS_REST_TOKEN` | Token Bearer Upstash | Dari Upstash → **REST API** → token |
| `JWT_SECRET_KEY` | String acak panjang (minimal ~32 karakter) | Untuk menandatangani token login; simpan rahasia |

### Sangat disarankan (agar aman & frontend tidak diblokir CORS)

| Key | Nilai |
|-----|--------|
| `SECRET_KEY` | String acak panjang (beda dari JWT) | Untuk Flask (session/CSRF internal bila dipakai) |
| `FRONTEND_URL` | URL frontend Anda, mis. `https://nama-app.netlify.app` | Harus **tepat** sama dengan origin browser (termasuk `https` dan tanpa `/` di akhir) |

### Opsional (sudah ada default di kode)

| Key | Default di kode |
|-----|-----------------|
| `SEMESTER_AKTIF` | `2024/2025 Ganjil` |
| `MAX_SKS_PER_SEMESTER` | `24` |
| `JWT_ACCESS_TOKEN_EXPIRES` | `3600` (detik) |
| `CACHE_TTL_*` | `300` |

Setelah menambah variabel, klik **Save** — Render biasanya **otomatis deploy ulang**.

---

## Bagian E — Cara menguji backend sudah jalan

Ganti `https://YOUR-SERVICE.onrender.com` dengan URL asli dari Render (ada di halaman service, **HTTPS**).

### E1. Health check (paling mudah)

1. Buka browser tab baru.
2. Kunjungi:  
   `https://YOUR-SERVICE.onrender.com/api/health`
3. **Harapan:** halaman menampilkan JSON kurang lebih seperti:  
   `{"success": true, "data": {"status": "ok"}, "message": "Service hidup"}`

Jika **error 502 / tidak bisa dihubungi**:

- Tunggu 2–5 menit (deploy pertama + cold start pada plan free).
- Buka tab **Logs** di Render dan baca baris error terakhir (mis. dependency gagal, Start Command salah, atau env kosong).

### E2. Cek dari frontend atau alat lain

- Jika Anda punya frontend: set `NEXT_PUBLIC_API_URL` ke URL Render yang sama (tanpa `/` di akhir), lalu coba **login**.
- Atau pakai **Postman** / **Thunder Client** (opsional):  
  **POST** `https://YOUR-SERVICE.onrender.com/api/auth/login`  
  Body JSON contoh: `{"role":"admin","username":"admin","password":"..."}`  
  (sesuai user seed database Anda.)

### E3. Masalah umum

| Gejala | Yang dicek |
|--------|------------|
| CORS error di browser | `FRONTEND_URL` harus sama persis dengan URL situs frontend |
| 401 / gagal login | `JWT_SECRET_KEY` sudah diset; `SUPABASE_*` benar |
| 500 saat API DB | `SUPABASE_SERVICE_KEY` / `SUPABASE_KEY` = **service_role**, bukan anon |
| Redis error di log | Upstash URL & token; tanpa Redis cache tetap bisa jalan (log peringatan) |

---

## Ringkasan satu halaman

1. ZIP isi folder **`backend`** (akar ZIP berisi `run.py`).
2. Buat **Web Service** di Render (upload ZIP **jika tersedia**, atau unggah ke GitHub lewat web lalu hubungkan).
3. **Build:** `pip install -r requirements.txt`  
4. **Start:** `gunicorn --bind 0.0.0.0:$PORT run:app`  
5. Isi env: `FLASK_ENV`, Supabase, Upstash, JWT, plus `SECRET_KEY` & `FRONTEND_URL`.  
6. Tes: buka `/api/health` di browser.

Jika Anda ingin, langkah berikutnya bisa menyamakan isi `Procfile` dengan Start Command Render (`--bind 0.0.0.0:$PORT`) agar tidak perlu mengingat dua versi.
