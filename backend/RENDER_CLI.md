# Deploy backend ke Render memakai **Render CLI**

Render CLI **tidak** mengunggah folder lokal secara mandiri. Alur resmi tetap membutuhkan **kode di repositori Git** (GitHub/GitLab/Bitbucket) yang terhubung ke Render. CLI dipakai untuk **login**, **validasi `render.yaml`**, **membuat service** (opsional), dan **memicu deploy** / **logs**.

---

## 1. Instal Render CLI (Windows)

### Opsi A — Unduh biner (paling mudah)

1. Buka: https://github.com/render-oss/cli/releases/latest  
2. Unduh **`cli_*_windows_amd64.zip`** (sesuai PC 64-bit).  
3. Ekstrak ZIP → di dalamnya biasanya ada **`cli_v2.xx.x.exe`**. Anda boleh **rename** menjadi `render.exe` supaya mengikuti dokumentasi resmi.  
4. Pindahkan `render.exe` ke folder yang ada di **PATH**, misalnya:
   - `C:\Users\<NamaAnda>\bin\`  
   lalu tambahkan folder itu ke *Environment Variables* → *Path*, **atau**
5. Jalankan `render.exe` dengan path lengkap dari folder ekstraksi.

Buka **PowerShell** baru, cek:

```powershell
render --version
```

### Opsi B — Winget (jika tersedia di mesin Anda)

```powershell
winget install Render.RenderCLI
```

*(Nama paket bisa berubah; jika gagal, gunakan Opsi A.)*

---

## 2. Login ke Render

```powershell
render login
```

- Browser terbuka → setujui → **Generate token**.  
- Kembali ke terminal; pilih **workspace** jika diminta:

```powershell
render workspaces
render workspace set
```

*(Atau ikuti prompt interaktif setelah `render login`.)*

---

## 3. Siapkan Git + GitHub (wajib untuk layanan web Render)

1. Buat repositori kosong di GitHub (mis. `sim-krs`).  
2. Push isi folder proyek **`sim-krs-old`** (setidaknya folder **`backend`** + **`render.yaml` di akar** sudah ada di repo ini).  
3. Di GitHub, pastikan file **`render.yaml`** ada di **akar repo** (sudah disediakan di proyek Anda dengan `rootDir: backend`).

> Tanpa Git remote, perintah `render services create --repo ...` tidak bisa digunakan.

---

## 4. Validasi Blueprint (`render.yaml`)

Perintah ini membutuhkan **sudah login** dan **workspace aktif** (`render workspace set`). Jika muncul error *no workspace specified*, jalankan:

```powershell
render workspaces
render workspace set
```

Lalu di **akar repo** (`sim-krs-old`, tempat file `render.yaml`):

```powershell
cd d:\coding-projects\kuliah\topsus-cursor\sim-krs-old
render blueprints validate .\render.yaml
```

Jika sukses, berkas siap dipakai di dashboard **Blueprint** atau sebagai acuan konfigurasi.

---

## 5. Cara deploy — dua jalur umum

### Jalur A — Blueprint lewat Dashboard (disarankan pertama kali)

1. Render Dashboard → **New** → **Blueprint**.  
2. Pilih repo GitHub yang sama.  
3. Render mendeteksi `render.yaml` → ikuti wizard.  
4. Isi **secret env** yang bertanda `sync: false` (Supabase, Upstash, JWT, dll.) saat diminta.  
5. Setelah service hidup, untuk deploy ulang setelah push Git, Anda bisa pakai CLI:

```powershell
render services
# catat SERVICE_ID untuk sim-krs-backend, lalu:
render deploys create srv-xxxxxxxxxxxx --wait
```

*(Ganti `srv-xxxxxxxxxxxx` dengan ID service Anda; atau jalankan `render deploys create` tanpa ID untuk mode interaktif.)*

### Jalur B — Buat Web Service dari CLI (non-interaktif)

Ganti nilai contoh di bawah:

| Placeholder | Isi dengan |
|-------------|------------|
| `https://github.com/USER/REPO.git` | URL clone HTTPS repo Anda |
| `main` | Nama branch default Anda |

```powershell
render services create `
  --name sim-krs-backend `
  --type web_service `
  --repo https://github.com/USER/REPO.git `
  --branch main `
  --runtime python `
  --region singapore `
  --plan free `
  --root-directory backend `
  --build-command "pip install -r requirements.txt" `
  --start-command "gunicorn --bind 0.0.0.0:$PORT run:app" `
  --env-var FLASK_ENV=production `
  --env-var PYTHON_VERSION=3.11.6 `
  -o json --confirm
```

**Penting:** Variabel rahasia (Supabase service key, Upstash, JWT, `SECRET_KEY`, `FRONTEND_URL`) **jangan** disimpan permanen di riwayat terminal. Setelah service terbentuk:

- Dashboard Render → service → **Environment** → tambahkan `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (atau `SUPABASE_KEY`), Upstash, `JWT_SECRET_KEY`, `SECRET_KEY`, `FRONTEND_URL`.

Lalu picu deploy:

```powershell
render deploys create srv-YOUR_ID --wait
```

---

## 6. Set environment variables (CLI, opsional)

Jika perlu mengatur dari CLI (hati-hati token terlihat di log):

```powershell
render services update sim-krs-backend --help
```

*(Lihat opsi terbaru di `render help services update` — nama flag bisa berubah mengikuti versi CLI.)*

Praktik aman: **Dashboard → Environment** untuk secret.

---

## 7. Uji backend hidup

```powershell
# Ganti URL dengan URL Render Anda
curl.exe https://YOUR-SERVICE.onrender.com/api/health
```

Atau buka di browser: `https://YOUR-SERVICE.onrender.com/api/health`

---

## 8. Logs & troubleshooting

```powershell
render logs --tail
```

Mode interaktif: jalankan `render logs` lalu pilih service.

---

## Ringkasan

| Langkah | Perintah / Tindakan |
|--------|----------------------|
| Instal | Unduh `render.exe` dari GitHub releases |
| Auth | `render login` |
| Validasi YAML | `render blueprints validate` (dari akar repo) |
| Deploy kode | Push ke Git → auto deploy **atau** `render deploys create <service-id> --wait` |
| Secret | Isi di Dashboard (disarankan) |

File `render.yaml` di **akar** monorepo ini sudah memakai **`rootDir: backend`**.  
Jika repo Anda **hanya** berisi isi folder `backend`, gunakan `backend/render.yaml` dengan `rootDir: .` dan letakkan itu di **akar** repo tersebut.
