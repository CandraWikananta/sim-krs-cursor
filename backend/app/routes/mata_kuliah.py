from flask import Blueprint, current_app, request
from postgrest.exceptions import APIError

from app.middleware.auth_middleware import require_auth
from app.utils.cache import cache_delete, cache_get_json, cache_set_json
from app.utils.response import err, ok
from app.utils.validators import parse_int, valid_uuid

bp = Blueprint("mata_kuliah", __name__, url_prefix="/api/mata-kuliah")


def _sb():
    return current_app.extensions["supabase"]


@bp.route("", methods=["GET"])
@require_auth("admin", "dosen", "mahasiswa")
def list_mata_kuliah():
    cached = cache_get_json("list:mata_kuliah")
    if cached is not None:
        return ok(cached, "Daftar mata kuliah (cache)")
    try:
        res = _sb().table("mata_kuliah").select("*").order("kode_mk").execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)

    rows = res.data or []
    ttl = current_app.config["CACHE_TTL_MATA_KULIAH"]
    cache_set_json("list:mata_kuliah", rows, ttl)
    return ok(rows, "Daftar mata kuliah")


@bp.route("", methods=["POST"])
@require_auth("admin")
def create_mata_kuliah():
    body = request.get_json(silent=True) or {}
    kode = (body.get("kode_mk") or "").strip()
    nama = (body.get("nama_mk") or "").strip()
    sks = parse_int(body.get("sks"), min_v=1, max_v=6)
    semester = parse_int(body.get("semester"), min_v=1, max_v=20)
    dosen_id = body.get("dosen_pengampu_id")
    kuota = parse_int(body.get("kuota"), min_v=1, max_v=500) or 30

    if not kode or len(kode) > 20:
        return err("Kode mata kuliah tidak valid")
    if not nama or len(nama) > 100:
        return err("Nama mata kuliah tidak valid")
    if sks is None:
        return err("SKS tidak valid")
    row = {
        "kode_mk": kode,
        "nama_mk": nama,
        "sks": sks,
        "kuota": kuota,
    }
    if semester is not None:
        row["semester"] = semester
    if dosen_id and valid_uuid(str(dosen_id)):
        row["dosen_pengampu_id"] = str(dosen_id)
    try:
        ins = _sb().table("mata_kuliah").insert(row).select().execute()
    except APIError as e:
        msg = str(getattr(e, "message", e))
        if "duplicate" in msg.lower():
            return err("Kode mata kuliah sudah ada", 409)
        return err(msg, 400)
    ins_rows = ins.data or []
    if not ins_rows:
        return err("Gagal membuat mata kuliah: tidak ada data dikembalikan", 500)
    cache_delete("list:mata_kuliah")
    return ok(ins_rows[0], "Mata kuliah dibuat", 201)


@bp.route("/<mkid>", methods=["PUT"])
@require_auth("admin")
def update_mata_kuliah(mkid):
    if not valid_uuid(mkid):
        return err("ID tidak valid")
    body = request.get_json(silent=True) or {}
    updates = {}
    if "kode_mk" in body:
        kode = (body.get("kode_mk") or "").strip()
        if not kode or len(kode) > 20:
            return err("Kode tidak valid")
        updates["kode_mk"] = kode
    if "nama_mk" in body:
        nama = (body.get("nama_mk") or "").strip()
        if not nama or len(nama) > 100:
            return err("Nama tidak valid")
        updates["nama_mk"] = nama
    if "sks" in body:
        sks = parse_int(body.get("sks"), min_v=1, max_v=6)
        if sks is None:
            return err("SKS tidak valid")
        updates["sks"] = sks
    if "semester" in body:
        sem = body.get("semester")
        if sem is None:
            updates["semester"] = None
        else:
            s = parse_int(sem, min_v=1, max_v=20)
            if s is None:
                return err("Semester tidak valid")
            updates["semester"] = s
    if "dosen_pengampu_id" in body:
        d = body.get("dosen_pengampu_id")
        updates["dosen_pengampu_id"] = None if d in ("", None) else str(d)
    if "kuota" in body:
        k = parse_int(body.get("kuota"), min_v=1, max_v=500)
        if k is None:
            return err("Kuota tidak valid")
        updates["kuota"] = k
    if not updates:
        return err("Tidak ada field yang diperbarui")
    try:
        out = (
            _sb()
            .table("mata_kuliah")
            .update(updates)
            .eq("id", mkid)
            .select()
            .execute()
        )
    except APIError as e:
        msg = str(getattr(e, "message", e))
        if "duplicate" in msg.lower():
            return err("Kode bentrok", 409)
        return err(msg, 400)
    out_rows = out.data or []
    if not out_rows:
        return err("Mata kuliah tidak ditemukan atau gagal memperbarui", 404)
    cache_delete("list:mata_kuliah")
    return ok(out_rows[0], "Mata kuliah diperbarui")


@bp.route("/<mkid>", methods=["DELETE"])
@require_auth("admin")
def delete_mata_kuliah(mkid):
    if not valid_uuid(mkid):
        return err("ID tidak valid")
    try:
        _sb().table("mata_kuliah").delete().eq("id", mkid).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 400)
    cache_delete("list:mata_kuliah")
    return ok(None, "Mata kuliah dihapus")
