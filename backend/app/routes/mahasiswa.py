import bcrypt
from flask import Blueprint, current_app, g, request
from postgrest.exceptions import APIError

from app.middleware.auth_middleware import require_auth
from app.models import strip_hash, strip_hash_list
from app.utils.cache import cache_delete, cache_get_json, cache_set_json
from app.utils.response import err, ok
from app.utils.validators import parse_int, valid_email, valid_password, valid_uuid

bp = Blueprint("mahasiswa", __name__, url_prefix="/api/mahasiswa")


def _sb():
    return current_app.extensions["supabase"]


def _can_view_mhs(row):
    if g.current_role == "admin":
        return True
    if g.current_role == "mahasiswa" and str(row.get("id")) == str(g.current_user_id):
        return True
    if g.current_role == "dosen" and str(row.get("dosen_pa_id")) == str(g.current_user_id):
        return True
    return False


def _can_mutate_mhs(row):
    if g.current_role == "admin":
        return True
    if g.current_role == "dosen" and str(row.get("dosen_pa_id")) == str(g.current_user_id):
        return True
    return False


@bp.route("", methods=["POST"])
@require_auth("admin")
def create_mahasiswa():
    body = request.get_json(silent=True) or {}
    nim = (body.get("nim") or "").strip()
    nama = (body.get("nama") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    semester = parse_int(body.get("semester"), min_v=1, max_v=20) or 1
    jurusan = (body.get("jurusan") or "").strip() or None
    dosen_pa_id = body.get("dosen_pa_id")
    if dosen_pa_id in ("", None):
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
        "password_hash": bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt(rounds=12)
        ).decode("utf-8"),
        "semester": semester,
        "jurusan": jurusan,
    }
    if dosen_pa_id:
        row["dosen_pa_id"] = str(dosen_pa_id)

    try:
        res = _sb().table("mahasiswa").insert(row).select().execute()
    except APIError as e:
        msg = str(getattr(e, "message", e))
        if "duplicate" in msg.lower() or "unique" in msg.lower():
            return err("NIM atau email sudah terdaftar", 409)
        return err(msg, 400)

    rows = res.data or []
    if not rows:
        return err("Gagal membuat mahasiswa: tidak ada data dikembalikan", 500)

    cache_delete("list:mahasiswa")
    return ok(strip_hash(rows[0]), "Mahasiswa dibuat", 201)


@bp.route("", methods=["GET"])
@require_auth("admin", "dosen")
def list_mahasiswa():
    if g.current_role == "admin":
        cached = cache_get_json("list:mahasiswa")
        if cached is not None:
            return ok(cached, "Daftar mahasiswa (cache)")
        try:
            res = _sb().table("mahasiswa").select("*").order("nim").execute()
        except APIError as e:
            return err(str(getattr(e, "message", e)), 500)
        data = strip_hash_list(res.data or [])
        ttl = current_app.config["CACHE_TTL_MAHASISWA"]
        cache_set_json("list:mahasiswa", data, ttl)
        return ok(data, "Daftar mahasiswa")

    try:
        res = (
            _sb()
            .table("mahasiswa")
            .select("*")
            .eq("dosen_pa_id", g.current_user_id)
            .order("nim")
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    return ok(strip_hash_list(res.data or []), "Mahasiswa bimbingan Anda")


@bp.route("/<mid>", methods=["GET"])
@require_auth("admin", "dosen", "mahasiswa")
def get_mahasiswa(mid):
    if not valid_uuid(mid):
        return err("ID mahasiswa tidak valid")
    try:
        res = _sb().table("mahasiswa").select("*").eq("id", mid).limit(1).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    rows = res.data or []
    if not rows:
        return err("Mahasiswa tidak ditemukan", 404)
    row = rows[0]
    if not _can_view_mhs(row):
        return err("Akses ditolak", 403)
    return ok(strip_hash(row), "Detail mahasiswa")


@bp.route("/<mid>", methods=["PUT"])
@require_auth("admin", "dosen", "mahasiswa")
def update_mahasiswa(mid):
    if not valid_uuid(mid):
        return err("ID mahasiswa tidak valid")
    try:
        res = _sb().table("mahasiswa").select("*").eq("id", mid).limit(1).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    rows = res.data or []
    if not rows:
        return err("Mahasiswa tidak ditemukan", 404)
    existing = rows[0]
    self_mhs = g.current_role == "mahasiswa" and str(existing.get("id")) == str(
        g.current_user_id
    )
    if not self_mhs and not _can_mutate_mhs(existing):
        return err("Hanya admin atau dosen PA yang dapat mengubah mahasiswa ini", 403)

    body = request.get_json(silent=True) or {}
    updates = {}
    if "nama" in body:
        nama = (body.get("nama") or "").strip()
        if not nama or len(nama) > 100:
            return err("Nama tidak valid")
        updates["nama"] = nama
    if "email" in body:
        email = (body.get("email") or "").strip().lower()
        if not valid_email(email):
            return err("Email tidak valid")
        updates["email"] = email
    if not self_mhs:
        if "semester" in body:
            sem = parse_int(body.get("semester"), min_v=1, max_v=20)
            if sem is None:
                return err("Semester tidak valid")
            updates["semester"] = sem
        if "dosen_pa_id" in body:
            dpid = body.get("dosen_pa_id")
            updates["dosen_pa_id"] = None if dpid in ("", None) else str(dpid)
        if "nim" in body and g.current_role == "admin":
            nim = (body.get("nim") or "").strip()
            if not nim or len(nim) > 20:
                return err("NIM tidak valid")
            updates["nim"] = nim
    if "jurusan" in body:
        if self_mhs or g.current_role in ("admin", "dosen"):
            updates["jurusan"] = (body.get("jurusan") or "").strip() or None

    if not updates:
        return err("Tidak ada field yang diperbarui")

    try:
        out = (
            _sb().table("mahasiswa").update(updates).eq("id", mid).select().execute()
        )
    except APIError as e:
        msg = str(getattr(e, "message", e))
        if "duplicate" in msg.lower():
            return err("NIM atau email bentrok", 409)
        return err(msg, 400)

    out_rows = out.data or []
    if not out_rows:
        return err("Mahasiswa tidak ditemukan atau gagal memperbarui", 404)

    cache_delete("list:mahasiswa")
    return ok(strip_hash(out_rows[0]), "Mahasiswa diperbarui")


@bp.route("/<mid>", methods=["DELETE"])
@require_auth("admin", "dosen")
def delete_mahasiswa(mid):
    if not valid_uuid(mid):
        return err("ID mahasiswa tidak valid")
    try:
        res = _sb().table("mahasiswa").select("*").eq("id", mid).limit(1).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    rows = res.data or []
    if not rows:
        return err("Mahasiswa tidak ditemukan", 404)
    if not _can_mutate_mhs(rows[0]):
        return err("Hanya admin atau dosen PA yang dapat menghapus mahasiswa ini", 403)
    try:
        _sb().table("mahasiswa").delete().eq("id", mid).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 400)
    cache_delete("list:mahasiswa")
    return ok(None, "Mahasiswa dihapus")


@bp.route("/<mid>/krs", methods=["GET"])
@require_auth("admin", "dosen", "mahasiswa")
def mahasiswa_krs(mid):
    if not valid_uuid(mid):
        return err("ID mahasiswa tidak valid")
    try:
        res = _sb().table("mahasiswa").select("*").eq("id", mid).limit(1).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    rows = res.data or []
    if not rows:
        return err("Mahasiswa tidak ditemukan", 404)
    if not _can_view_mhs(rows[0]):
        return err("Akses ditolak", 403)

    try:
        krs = (
            _sb()
            .table("krs")
            .select("*, mata_kuliah(*)")
            .eq("mahasiswa_id", mid)
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    return ok(krs.data or [], "KRS mahasiswa")
