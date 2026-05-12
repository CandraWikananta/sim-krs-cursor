import bcrypt
from flask import Blueprint, current_app, g, request
from postgrest.exceptions import APIError

from app.middleware.auth_middleware import require_auth
from app.models import strip_hash, strip_hash_list
from app.utils.cache import cache_delete, cache_get_json, cache_set_json
from app.utils.response import err, ok
from app.utils.validators import valid_email, valid_password, valid_uuid

bp = Blueprint("dosen", __name__, url_prefix="/api/dosen")


def _sb():
    return current_app.extensions["supabase"]


@bp.route("", methods=["GET"])
@require_auth("admin", "dosen", "mahasiswa")
def list_dosen():
    cached = cache_get_json("list:dosen")
    if cached is not None:
        return ok(cached, "Daftar dosen (cache)")
    try:
        res = _sb().table("dosen").select("*").order("nama").execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    data = strip_hash_list(res.data or [])
    ttl = current_app.config["CACHE_TTL_DOSEN"]
    cache_set_json("list:dosen", data, ttl)
    return ok(data, "Daftar dosen")


@bp.route("/<did>", methods=["GET"])
@require_auth("admin", "dosen", "mahasiswa")
def get_dosen(did):
    if not valid_uuid(did):
        return err("ID dosen tidak valid")
    try:
        res = _sb().table("dosen").select("*").eq("id", did).limit(1).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    rows = res.data or []
    if not rows:
        return err("Dosen tidak ditemukan", 404)
    return ok(strip_hash(rows[0]), "Detail dosen")


@bp.route("/<did>", methods=["PUT"])
@require_auth("admin", "dosen")
def update_dosen(did):
    if not valid_uuid(did):
        return err("ID dosen tidak valid")
    self_dosen = g.current_role == "dosen" and str(did) == str(g.current_user_id)
    if g.current_role == "dosen" and not self_dosen:
        return err("Dosen hanya dapat mengubah profil sendiri", 403)

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
    if "bidang_keahlian" in body:
        updates["bidang_keahlian"] = (body.get("bidang_keahlian") or "").strip() or None
    if not self_dosen:
        if "max_mahasiswa_bimbingan" in body:
            from app.utils.validators import parse_int

            m = parse_int(body.get("max_mahasiswa_bimbingan"), min_v=1, max_v=500)
            if m is None:
                return err("max_mahasiswa_bimbingan tidak valid")
            updates["max_mahasiswa_bimbingan"] = m
        if "nidn" in body:
            nidn = (body.get("nidn") or "").strip()
            if not nidn or len(nidn) > 20:
                return err("NIDN tidak valid")
            updates["nidn"] = nidn
    if "password" in body:
        pw = body.get("password") or ""
        if not valid_password(pw):
            return err("Password minimal 8 karakter")
        updates["password_hash"] = bcrypt.hashpw(
            pw.encode("utf-8"), bcrypt.gensalt(rounds=12)
        ).decode("utf-8")

    if not updates:
        return err("Tidak ada field yang diperbarui")

    try:
        out = _sb().table("dosen").update(updates).eq("id", did).select().execute()
    except APIError as e:
        msg = str(getattr(e, "message", e))
        if "duplicate" in msg.lower():
            return err("NIDN atau email bentrok", 409)
        return err(msg, 400)

    out_rows = out.data or []
    if not out_rows:
        return err("Dosen tidak ditemukan atau gagal memperbarui", 404)

    cache_delete("list:dosen")
    return ok(strip_hash(out_rows[0]), "Dosen diperbarui")


@bp.route("/<did>", methods=["DELETE"])
@require_auth("admin")
def delete_dosen(did):
    if not valid_uuid(did):
        return err("ID dosen tidak valid")
    try:
        _sb().table("dosen").delete().eq("id", did).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 400)
    cache_delete("list:dosen")
    return ok(None, "Dosen dihapus")


@bp.route("/<did>/mahasiswa-bimbingan", methods=["GET"])
@require_auth("admin", "dosen")
def mahasiswa_bimbingan(did):
    if not valid_uuid(did):
        return err("ID dosen tidak valid")
    if g.current_role == "dosen" and str(g.current_user_id) != str(did):
        return err("Anda hanya dapat melihat bimbingan Anda sendiri", 403)
    try:
        res = (
            _sb()
            .table("mahasiswa")
            .select("*")
            .eq("dosen_pa_id", did)
            .order("nim")
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    return ok(strip_hash_list(res.data or []), "Mahasiswa bimbingan")


@bp.route("/assign-pa", methods=["POST"])
@require_auth("admin")
def assign_pa():
    body = request.get_json(silent=True) or {}
    mid = body.get("mahasiswa_id")
    dpid = body.get("dosen_pa_id")
    if not valid_uuid(mid) or not valid_uuid(dpid):
        return err("mahasiswa_id dan dosen_pa_id harus UUID valid")

    try:
        dres = _sb().table("dosen").select("*").eq("id", dpid).limit(1).execute()
        mres = _sb().table("mahasiswa").select("*").eq("id", mid).limit(1).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)

    if not dres.data:
        return err("Dosen tidak ditemukan", 404)
    if not mres.data:
        return err("Mahasiswa tidak ditemukan", 404)

    dosen = dres.data[0]
    max_m = int(dosen.get("max_mahasiswa_bimbingan") or 20)
    try:
        cnt = (
            _sb()
            .table("mahasiswa")
            .select("id", count="exact")
            .eq("dosen_pa_id", dpid)
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    current_count = cnt.count if cnt.count is not None else len(cnt.data or [])
    old_pa = mres.data[0].get("dosen_pa_id")
    if str(old_pa) != str(dpid) and current_count >= max_m:
        return err("Kuota bimbingan dosen ini sudah penuh", 409)

    try:
        out = (
            _sb()
            .table("mahasiswa")
            .update({"dosen_pa_id": dpid})
            .eq("id", mid)
            .select()
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 400)

    out_rows = out.data or []
    if not out_rows:
        return err("Mahasiswa tidak ditemukan atau gagal memperbarui", 404)

    cache_delete("list:mahasiswa")
    return ok(strip_hash(out_rows[0]), "Dosen PA berhasil ditetapkan")
