# Deploy frontend Next.js ke Netlify (drag & drop, **tanpa** terminal & Git)

Panduan ini untuk orang yang **tidak** memakai baris perintah atau Git. Langkah build project bisa dilakukan lewat **Cursor** (atau VS Code): minta asisten AI menjalankan build, atau gunakan menu terminal terintegrasi jika Anda mau — intinya **satu perintah** `npm run build` di folder `frontend`.

---

## Yang perlu Anda pahami dulu

### Folder mana yang di-upload: **`out`** — bukan `.next`

| Folder | Apa isinya | Di-upload ke Netlify? |
|--------|------------|------------------------|
| **`.next`** | Cache & hasil build internal Next.js | **Tidak** — bukan situs statis |
| **`out`** | HTML, JS, CSS siap di-host statis | **Ya** — inilah yang dipakai drag & drop |

Project ini sudah disetel **`output: 'export'`** di `next.config.mjs` agar `npm run build` menghasilkan folder **`out`**.

### URL backend (Render) harus sudah benar **sebelum** build

Variabel `NEXT_PUBLIC_*` disematkan ke file JavaScript **pada saat** `npm run build`.

- Edit dulu **`frontend/.env.production`** (isi `NEXT_PUBLIC_API_URL` dengan URL Render Anda).
- **Baru** jalankan build.
- **Lalu** unggah folder **`out`**.

> **Deploy drag & drop saja:** mengisi Environment Variables di dashboard Netlify **tidak** mengubah URL API yang sudah tertanam di file JS hasil build Anda. Variabel di Netlify baru berguna jika nanti Anda deploy dengan **Git** dan biarkan Netlify yang menjalankan `npm run build` di server mereka.

---

## Langkah 1 — Siapkan URL backend di `.env.production`

1. Buka folder project Anda di File Explorer.
2. Masuk ke **`frontend`**.
3. Buka file **`.env.production`** dengan Notepad / Cursor.
4. Ganti baris ini dengan URL asli backend Render (contoh bentuknya: `https://nama-service.onrender.com` — **tanpa** garis miring `/` di paling akhir):

   ```env
   NEXT_PUBLIC_API_URL=https://nama-service-anda.onrender.com
   ```

5. Simpan file.

6. Di backend Render, set **`FRONTEND_URL`** ke URL Netlify Anda **persis** (mis. `https://nama-anda.netlify.app`, tanpa `/` di akhir). Tanpa ini, browser akan memblokir request ke API (error CORS).

---

## Langkah 2 — Build project (menghasilkan folder `out`)

Anda **tidak** perlu membuka CMD/PowerShell sendiri jika tidak mau — gunakan Cursor:

1. Buka project di **Cursor**.
2. Buka **Chat / Agent** dan minta: *“Jalankan `npm run build` di folder `frontend`.”*  
   Atau buka terminal di Cursor (**Terminal → New Terminal**), pastikan folder aktif adalah `frontend`, lalu ketik: `npm run build` (jika Anda tidak keberatan satu baris perintah).

3. Tunggu sampai selesai tanpa error. Harus muncul pesan sukses dan folder **`out`** terbentuk di dalam **`frontend/out`**.

4. Cek di File Explorer:  
   `frontend\out\`  
   Di dalamnya harus ada **`index.html`** di level paling luar (bersama folder `_next`, dll.).

> Jika folder **`out`** tidak terlihat: pastikan build sukses; di `.gitignore` folder `out` memang sering disembunyikan dari daftar “untracked” di Git, tapi di File Explorer folder itu tetap ada.

---

## Langkah 3 — Siapkan folder untuk di-drag (disarankan ZIP)

Netlify drag & drop menerima **folder** atau **ZIP**.

### Opsi A — ZIP (lebih rapi)

1. Buka **`frontend\out`** di File Explorer.
2. **Ctrl + A** (pilih semua isi: `index.html`, `_next`, folder halaman, dll.).
3. Klik kanan → **Compress to ZIP file** / **Send to → Compressed folder**.
4. Beri nama misalnya **`sim-krs-frontend-out.zip`**.

Saat membuka ZIP, **file pertama yang terlihat** harus **`index.html`**, bukan satu subfolder `out` lagi.

### Opsi B — Folder langsung

Cukup siapkan folder **`out`**; nanti di Netlify Anda bisa menjatuhkan folder tersebut (tergantung tampilan Netlify).

---

## Langkah 4 — Buat situs baru di Netlify (tanpa Git)

1. Buka browser, kunjungi **https://www.netlify.com**
2. **Sign up** / **Log in** (email atau Google, dll.).
3. Setelah masuk **Dashboard**, cari area **Sites** atau tombol **Add new site** / **Deploy manually** / **deploy without Git** (istilah bisa sedikit berubah).
4. Pilih opsi seperti **“Deploy manually”** / **“Want to deploy a new site without connecting to Git?”** — yang intinya **unggah situs statis**.
5. Anda akan melihat kotak besar **“Drag and drop your site output folder here”** (atau serupa).

---

## Langkah 5 — Drag & drop ke Netlify

1. **Seret** file ZIP (`sim-krs-frontend-out.zip`) atau **folder** hasil isi `out` ke kotak tersebut.
2. Tunggu proses upload dan pemroses selesai (beberapa detik sampai menit).
3. Netlify akan memberi URL acak, misalnya **`https://random-name-123.netlify.app`**.

**Simpan URL ini** — dipakai untuk tes dan untuk mengisi **`FRONTEND_URL`** di backend Render (supaya browser boleh memanggil API).

---

## Langkah 6 — Environment variables di dashboard Netlify

### Untuk metode drag & drop (build di komputer Anda)

| Variabel | Apakah wajib di Netlify? | Keterangan |
|----------|---------------------------|------------|
| `NEXT_PUBLIC_API_URL` | **Tidak wajib** (sudah di-build dari `.env.production`) | Isi di Netlify **tidak** mengubah bundle yang sudah Anda upload |
| `NODE_VERSION` | Tidak | Netlify tidak menjalankan `npm run build` untuk deploy manual ini |

Jadi untuk drag & drop, **Anda tidak harus** mengisi env di Netlify agar URL API jalan — yang menentukan adalah **`.env.production` + build ulang**.

### Jika nanti Anda pindah ke deploy dari Git

Baru kemudian isi di **Site settings → Environment variables**:

- `NEXT_PUBLIC_API_URL` = URL Render  
- `NEXT_PUBLIC_APP_NAME` (opsional)  
- `NEXT_PUBLIC_APP_UNIVERSITY` (opsional)  
- `NEXT_PUBLIC_SEMESTER_AKTIF` (opsional)  

Lalu set **Build command** `npm run build`, **Publish directory** `out` (sudah tercermin di `netlify.toml`).

---

## Langkah 7 — Setelah deploy: tes frontend ↔ backend

### 7.1 Buka situs Netlify

1. Buka URL Netlify (mis. `https://....netlify.app`) di browser.
2. Harus tampil halaman utama aplikasi (tanpa layar putih error di konsol karena file hilang).

### 7.2 Cek di browser (DevTools)

1. Tekan **F12** → tab **Network** (Jaringan).
2. Buka halaman **Login**, coba login (mis. mahasiswa).
3. Cari request ke domain **Render** (bukan netlify.app).  
   - **Berhasil:** status **200** atau **401** (kredensial salah) — artinya request sampai ke backend.  
   - **Gagal CORS:** error merah di konsol bertuliskan **CORS** → set **`FRONTEND_URL`** di Render sama dengan URL Netlify Anda (termasuk `https://`, tanpa `/` di akhir), deploy ulang backend, coba lagi.

### 7.3 Tes cepat tanpa login

Di tab baru, buka langsung URL health backend:

`https://URL-RENDER-ANDA.onrender.com/api/health`

Harus JSON `success: true`. Itu memastikan backend hidup; frontend memakai base URL yang sama dengan di `.env.production` saat build.

### 7.4 Jika login selalu gagal / “Network error”

- Pastikan `NEXT_PUBLIC_API_URL` di **`.env.production`** benar dan Anda sudah **`npm run build` ulang** lalu **upload ulang** folder `out`.
- Pastikan tidak ada spasi atau `/` di akhir URL.
- Pastikan backend Render sudah “bangun” (plan free kadang sleep).

---

## Ringkasan satu halaman

1. Edit **`frontend/.env.production`** → `NEXT_PUBLIC_API_URL` = URL Render.  
2. Build: **`npm run build`** di folder `frontend` (boleh lewat Cursor).  
3. Unggah isi folder **`frontend/out`** (atau ZIP-nya) ke Netlify **manual deploy**.  
4. Set **`FRONTEND_URL`** di Render = URL Netlify.  
5. Tes: buka situs → Login → lihat tab Network; tes `/api/health` di browser.

---

## File pendukung di repo

| File | Fungsi |
|------|--------|
| `frontend/netlify.toml` | Build & publish `out` untuk deploy lewat Git/CI |
| `frontend/.env.production` | Template URL production untuk build lokal |
| `frontend/public/_headers` | Header Netlify; setelah build disalin ke `out/_headers` lewat skrip `postbuild` |

Jika Anda mengubah URL backend, **selalu** build ulang dan unggah ulang `out`.
