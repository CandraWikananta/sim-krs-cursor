import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", "3600"))

    SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get(
        "SUPABASE_KEY", ""
    )

    UPSTASH_REDIS_REST_URL = os.environ.get("UPSTASH_REDIS_REST_URL", "")
    UPSTASH_REDIS_REST_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    CACHE_TTL_MAHASISWA = int(os.environ.get("CACHE_TTL_MAHASISWA", "300"))
    CACHE_TTL_DOSEN = int(os.environ.get("CACHE_TTL_DOSEN", "300"))
    CACHE_TTL_MATA_KULIAH = int(os.environ.get("CACHE_TTL_MATA_KULIAH", "300"))

    SEMESTER_AKTIF = os.environ.get("SEMESTER_AKTIF", "2024/2025 Ganjil")
    MAX_SKS_PER_SEMESTER = int(os.environ.get("MAX_SKS_PER_SEMESTER", "24"))
