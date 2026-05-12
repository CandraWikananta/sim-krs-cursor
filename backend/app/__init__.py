import logging
from typing import List, Tuple

from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import Client, create_client

from app.config import Config
from app.routes.auth import bp as auth_bp
from app.routes.dosen import bp as dosen_bp
from app.routes.krs import bp as krs_bp
from app.routes.mahasiswa import bp as mahasiswa_bp
from app.routes.mata_kuliah import bp as mata_kuliah_bp

logger = logging.getLogger(__name__)


def _cors_origins_from_config(cfg) -> Tuple[List[str], bool]:
    """
    FRONTEND_URL bisa beberapa origin, dipisah koma.
    Contoh: https://sim-krs.netlify.app,http://localhost:3000
    Slash di akhir diabaikan agar cocok dengan header Origin browser.
    """
    raw = (cfg.get("FRONTEND_URL") or "").strip()
    if not raw:
        raw = "http://localhost:3000"
    if raw == "*":
        return (["*"], False)
    origins = []
    for part in raw.split(","):
        o = part.strip().rstrip("/")
        if o:
            origins.append(o)
    if not origins:
        origins = ["http://localhost:3000"]
    return (origins, True)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    supabase_url = (app.config.get("SUPABASE_URL") or "").strip()
    supabase_key = (app.config.get("SUPABASE_SERVICE_KEY") or "").strip()
    if not supabase_url or not supabase_key:
        logger.warning(
            "SUPABASE_URL atau SUPABASE_SERVICE_KEY kosong — "
            "menggunakan placeholder; set di .env sebelum memanggil API DB."
        )
        supabase_url = supabase_url or "http://127.0.0.1:54321"
        supabase_key = supabase_key or "local-dev-placeholder-service-role-key"

    client: Client = create_client(supabase_url, supabase_key)
    app.extensions["supabase"] = client

    cors_origins, allow_credentials = _cors_origins_from_config(app.config)
    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=allow_credentials,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(mahasiswa_bp)
    app.register_blueprint(dosen_bp)
    app.register_blueprint(mata_kuliah_bp)
    app.register_blueprint(krs_bp)

    @app.get("/api/health")
    def health():
        return jsonify(
            {"success": True, "data": {"status": "ok"}, "message": "Service hidup"}
        )

    @app.errorhandler(404)
    def handle_404(_e):
        if request.path.startswith("/api"):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "message": "Endpoint tidak ditemukan",
                }
            ), 404
        return jsonify(
            {"success": False, "data": None, "message": "Tidak ditemukan"}
        ), 404

    @app.errorhandler(500)
    def handle_500(e):
        logger.exception(e)
        return jsonify(
            {
                "success": False,
                "data": None,
                "message": "Kesalahan server internal",
            }
        ), 500

    return app
