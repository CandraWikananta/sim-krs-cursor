# Sistem KRS (Kartu Rencana Studi)

Aplikasi web untuk pengelolaan Kartu Rencana Studi mahasiswa.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js (React) + Tailwind CSS |
| Backend | Python Flask (REST API) |
| Database | Supabase (PostgreSQL) |
| Caching | Upstash Redis |
| Hosting Frontend | Netlify |
| Hosting Backend | Render.com |

## Struktur Proyek

```
sim-krs/
├── frontend/          # Next.js app
│   ├── src/
│   │   └── app/
│   └── .env.example
├── backend/           # Flask API
│   ├── app/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── .env.example
└── database/          # SQL scripts & panduan
    ├── 01_create_tables.sql
    ├── 02_seed_data.sql
    └── SUPABASE_SETUP_GUIDE.md
```

## Setup

1. **Database**: Ikuti panduan di `database/SUPABASE_SETUP_GUIDE.md`
2. **Backend**: Lihat `backend/README.md`
3. **Frontend**: Lihat `frontend/README.md`

## Fitur

- Autentikasi Mahasiswa & Dosen
- Pengajuan & Persetujuan KRS
- Pemetaan Dosen Pembimbing Akademik (PA)
- CRUD Mahasiswa, Dosen, Mata Kuliah
- Validasi batas SKS (maks. 24 SKS/semester)
- Caching dengan Redis
