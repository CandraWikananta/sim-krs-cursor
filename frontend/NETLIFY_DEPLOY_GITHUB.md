# Deploy frontend ke Netlify lewat **GitHub**

Panduan ini untuk repositori **monorepo** (`sim-krs-old` berisi `frontend/`, `backend/`, `database/`). File **`netlify.toml` di akar repo** sudah mengatur `base = "frontend"` agar build di Netlify dijalankan dari folder frontend.

---

## Prasyarat

1. Kode sudah ada di repositori GitHub (push folder project Anda ke satu repo).
2. Backend sudah jalan di Render dan Anda punya URL HTTPS-nya (untuk `NEXT_PUBLIC_API_URL`).
3. Akun Netlify (bisa daftar gratis di https://www.netlify.com).

---

## Langkah 1 — Siapkan repositori GitHub

1. Di GitHub, buat repository (public/private sesuai kebutuhan), misalnya `sim-krs`.
2. Pastikan isi push **termasuk**:
   - folder **`frontend/`** (seluruh isinya),
   - file **`netlify.toml` di akar repo** (satu tingkat di atas `frontend/`), **bukan** hanya di dalam `frontend` saja — untuk monorepo yang dipakai Netlify adalah file di akar.

> Jika Anda **hanya** meng-host repo yang isinya **frontend saja** (tanpa `backend/`), Anda bisa menghubungkan Netlify dengan **Base directory** kosong dan taruh **`netlify.toml` hanya di dalam `frontend/`** (lihat `frontend/netlify.toml`). Untuk struktur proyek kuliah ini, ikuti **`netlify.toml` di akar**.

---

## Langkah 2 — Hubungkan GitHub ke Netlify

1. Login ke **https://app.netlify.com**
2. **Add new site** → **Import an existing project** (atau **Import from Git**).
3. Pilih **GitHub** → izinkan Netlify mengakses repo jika diminta.
4. Pilih repository **`sim-krs`** (atau nama repo Anda).

---

## Langkah 3 — Pengaturan build (biasanya terisi otomatis)

Netlify akan membaca **`netlify.toml` di akar repo**. Pastikan di layar konfigurasi terbaca seperti berikut (atau set manual jika kosong):

| Pengaturan | Nilai |
|------------|--------|
| **Base directory** | `frontend` *(bisa juga dikosongkan jika semua sudah di `netlify.toml` dengan `base = "frontend"` — cek pratinjau build)* |
| **Build command** | `npm install && npm run build` *(atau sesuai `netlify.toml`)* |
| **Publish directory** | `out` *(relatif terhadap base `frontend`)* |

> Di banyak kasus, cukup simpan default yang Netlify baca dari `netlify.toml` tanpa mengedit manual.

Klik **Deploy site**.

---

## Langkah 4 — Environment variables di Netlify (wajib untuk URL API)

Variabel `NEXT_PUBLIC_*` disematkan **saat build** di server Netlify. Isi di:

**Site configuration → Environment variables → Add a variable**

| Key | Value | Scope |
|-----|--------|--------|
| `NEXT_PUBLIC_API_URL` | `https://nama-service-anda.onrender.com` | Production (dan Preview jika mau) |
| `NEXT_PUBLIC_APP_NAME` | `Sistem KRS` | opsional |
| `NEXT_PUBLIC_APP_UNIVERSITY` | Nama kampus | opsional |
| `NEXT_PUBLIC_SEMESTER_AKTIF` | `2024/2025 Ganjil` | opsional |

**Aturan URL:**

- Tanpa garis miring di akhir: `https://xxx.onrender.com` ✅  
- Jangan commit secret backend ke GitHub; yang di sini hanya URL publik API.

Setelah menyimpan variabel, picu **deploy ulang**:

**Deploys → Trigger deploy → Clear cache and deploy site** (disarankan setelah perubahan env pertama kali).

---

## Langkah 5 — CORS di backend (Render)

Agar browser di domain Netlify boleh memanggil API Render:

1. Di **Render** → service Flask → **Environment**
2. Set **`FRONTEND_URL`** sama persis dengan URL Netlify Anda, misalnya:  
   `https://nama-acak-123.netlify.app`  
   (HTTPS, tanpa `/` di akhir.)

3. Deploy ulang backend jika perlu.

---

## Langkah 6 — Domain kustom (opsional)

Di Netlify: **Domain management** → **Add custom domain** → ikuti wizard DNS.

Setelah punya domain, **update `FRONTEND_URL`** di Render ke domain baru itu, lalu deploy ulang backend.

---

## Alur kerja sehari-hari

1. Anda **push** perubahan ke branch utama (mis. `main`) di GitHub.
2. Netlify **otomatis** menjalankan build (jika **Auto publish** aktif untuk branch itu).
3. Situs terbaru tersedia di URL Netlify.

Untuk mematikan deploy otomatis: **Project configuration → Build & deploy → Continuous deployment** (sesuai tampilan dashboard).

---

## Troubleshooting

| Masalah | Yang dicek |
|---------|------------|
| Build gagal “no such file” | Pastikan **`netlify.toml` di akar** dan folder **`frontend`** ada di repo; `base = "frontend"` benar. |
| Situs tapi API tidak terhubung | `NEXT_PUBLIC_API_URL` di Netlify + **redeploy**; cek **Network** di browser. |
| Error CORS | `FRONTEND_URL` di Render = URL Netlify persis. |
| Halaman kosong / 404 aneh | Pastikan `next.config.mjs` memakai `output: "export"` dan **publish directory** = **`out`**. |

---

## Perbandingan singkat: GitHub vs drag & drop

| | GitHub + Netlify | Drag & drop folder `out` |
|--|------------------|---------------------------|
| URL API | Set di **Environment variables** Netlify | Set di **`.env.production`** lalu build **lokal** |
| Deploy ulang | Push ke Git | Build lokal + unggah ulang `out` |
| Cocok untuk | Tim, CI, update rutin | Cepat sekali tanpa Git |

File terkait: `netlify.toml` (akar repo), `frontend/netlify.toml` (jika repo hanya frontend), `NETLIFY_DEPLOY_DRAG_DROP.md`.
