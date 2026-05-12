import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from flask import Blueprint, current_app, g, request
from postgrest.exceptions import APIError

from app.middleware.auth_middleware import require_auth
from app.models import strip_hash
from app.utils.cache import cache_delete, invalidate_list_caches
from app.utils.response import err, ok
from app.utils.validators import parse_int, valid_email, valid_password

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _supabase():
    return current_app.extensions["supabase"]


def _issue_token(user_id, role):
    exp = datetime.now(timezone.utc) + timedelta(
        seconds=int(current_app.config["JWT_ACCESS_TOKEN_EXPIRES"])
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": exp,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256",
    )
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def _check_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


@bp.route("/register/mahasiswa", methods=["POST"])
def register_mahasiswa():
    body = request.get_json(silent=True) or {}
    nim = (body.get("nim") or "").strip()
    nama = (body.get("nama") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    semester = parse_int(body.get("semester"), min_v=1, max_v=20) or 1
    jurusan = (body.get("jurusan") or "").strip() or None
    dosen_pa_id = body.get("dosen_pa_id")
    if dosen_pa_id == "":
        dosen_pa_id = None

    if not nim or len(nim) > 20:
        return err("NIM tidak valid")
    if not nama or len(nama) > 100:
        return err("Nama tidak valid")
    if not valid_email(email):
        return err("Email tidak valid")
    if not valid_password(password):
        return err("Password minimal 8 karakter")

    row = {
        "nim": nim,
        "nama": nama,
        "email": email,
        "password_hash": _hash_password(password),
        "semester": semester,
        "jurusan": jurusan,
    }
    if dosen_pa_id:
        row["dosen_pa_id"] = str(dosen_pa_id)

    try:
        res = _supabase().table("mahasiswa").insert(row).select().execute()
    except APIError as e:
        msg = str(e.message) if hasattr(e, "message") else str(e)
        if "duplicate" in msg.lower() or "unique" in msg.lower():
            return err("NIM atau email sudah terdaftar", 409)
        return err("Gagal mendaftar: " + msg, 400)

    rows = res.data or []
    if not rows:
        return err("Gagal mendaftar: tidak ada data dikembalikan", 500)

    cache_delete("list:mahasiswa")
    user = strip_hash(rows[0])
    return ok(
        {"user": user, "token": _issue_token(user["id"], "mahasiswa")},
        "Registrasi mahasiswa berhasil",
        201,
    )


@bp.route("/register/dosen", methods=["POST"])
@require_auth("admin")
def register_dosen():
    body = request.get_json(silent=True) or {}
    nidn = (body.get("nidn") or "").strip()
    nama = (body.get("nama") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    bidang = (body.get("bidang_keahlian") or "").strip() or None
    max_m = parse_int(body.get("max_mahasiswa_bimbingan"), min_v=1, max_v=500)
    if max_m is None:
        max_m = 20

    if not nidn or len(nidn) > 20:
        return err("NIDN tidak valid")
    if not nama or len(nama) > 100:
        return err("Nama tidak valid")
    if not valid_email(email):
        return err("Email tidak valid")
    if not valid_password(password):
        return err("Password minimal 8 karakter")

    row = {
        "nidn": nidn,
        "nama": nama,
        "email": email,
        "password_hash": _hash_password(password),
        "bidang_keahlian": bidang,
        "max_mahasiswa_bimbingan": max_m,
    }
    try:
        res = _supabase().table("dosen").insert(row).select().execute()
    except APIError as e:
        msg = str(e.message) if hasattr(e, "message") else str(e)
        if "duplicate" in msg.lower() or "unique" in msg.lower():
            return err("NIDN atau email sudah terdaftar", 409)
        return err("Gagal menambah dosen: " + msg, 400)

    rows = res.data or []
    if not rows:
        return err("Gagal menambah dosen: tidak ada data dikembalikan", 500)

    cache_delete("list:dosen")
    user = strip_hash(rows[0])
    return ok(
        {"user": user},
        "Dosen berhasil ditambahkan",
        201,
    )


def _login_table_lookup(role: str, identifier: str, password: str):
    sb = _supabase()
    if role == "mahasiswa":
        q = sb.table("mahasiswa").select("*").eq("email", identifier.lower()).limit(1).execute()
        rows = q.data or []
        if not rows:
            return None
        u = rows[0]
        if not _check_password(password, u.get("password_hash") or ""):
            return None
        return strip_hash(u), "mahasiswa"
    if role == "dosen":
        q = sb.table("dosen").select("*").eq("email", identifier.lower()).limit(1).execute()
        rows = q.data or []
        if not rows:
            return None
        u = rows[0]
        if not _check_password(password, u.get("password_hash") or ""):
            return None
        return strip_hash(u), "dosen"
    if role == "admin":
        ident = identifier.strip()
        if not ident:
            return None
        if "@" in ident:
            q = sb.table("admin").select("*").eq("email", ident.lower()).limit(1).execute()
        else:
            q = sb.table("admin").select("*").eq("username", ident).limit(1).execute()
        rows = q.data or []
        if not rows:
            return None
        u = rows[0]
        if not _check_password(password, u.get("password_hash") or ""):
            return None
        return strip_hash(u), "admin"
    return None


@bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    role = (body.get("role") or "").strip().lower()
    password = body.get("password") or ""
    if role not in ("mahasiswa", "dosen", "admin"):
        return err('Field "role" harus mahasiswa, dosen, atau admin')
    if role == "admin":
        identifier = (body.get("username") or body.get("email") or "").strip()
    else:
        identifier = (body.get("email") or "").strip()
    if not identifier or not password:
        return err("Email/username dan password wajib diisi")
    found = _login_table_lookup(role, identifier, password)
    if not found:
        return err("Email/username atau password salah", 401)
    user, r = found
    token = _issue_token(user["id"], r)
    return ok({"user": user, "token": token, "role": r}, "Login berhasil")


@bp.route("/login/admin", methods=["POST"])
def login_admin():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    identifier = username or email
    if not identifier or not password:
        return err("Username/email dan password wajib diisi")
    found = _login_table_lookup("admin", identifier, password)
    if not found:
        return err("Username/email atau password salah", 401)
    user, r = found
    token = _issue_token(user["id"], r)
    return ok({"user": user, "token": token, "role": r}, "Login admin berhasil")


@bp.route("/logout", methods=["POST"])
def logout():
    return ok(None, "Logout berhasil (hapus token di sisi klien)")


@bp.route("/me", methods=["GET"])
@require_auth("mahasiswa", "dosen", "admin")
def me():
    sb = _supabase()
    uid = g.current_user_id
    role = g.current_role
    try:
        if role == "mahasiswa":
            res = sb.table("mahasiswa").select("*").eq("id", uid).limit(1).execute()
        elif role == "dosen":
            res = sb.table("dosen").select("*").eq("id", uid).limit(1).execute()
        else:
            res = sb.table("admin").select("*").eq("id", uid).limit(1).execute()
    except APIError:
        return err("Pengguna tidak ditemukan", 404)
    rows = res.data or []
    if not rows:
        return err("Pengguna tidak ditemukan", 404)
    return ok(strip_hash(rows[0]), "Profil pengguna")
