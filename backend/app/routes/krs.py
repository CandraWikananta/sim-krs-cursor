from flask import Blueprint, current_app, g, request
from postgrest.exceptions import APIError

from app.middleware.auth_middleware import require_auth
from app.models import strip_hash
from app.utils.krs_rules import (
    count_mk_enrollment,
    has_duplicate_course,
    summary_sks_for_mahasiswa,
    total_sks_pending_approved,
)
from app.utils.response import err, ok
from app.utils.validators import valid_uuid

bp = Blueprint("krs", __name__, url_prefix="/api/krs")


def _sb():
    return current_app.extensions["supabase"]


def _mahasiswa_pa_owns(mahasiswa_id, dosen_id):
    r = _sb().table("mahasiswa").select("dosen_pa_id").eq("id", mahasiswa_id).limit(1).execute()
    rows = r.data or []
    if not rows:
        return False
    return str(rows[0].get("dosen_pa_id")) == str(dosen_id)


def _can_view_summary(mahasiswa_id):
    if g.current_role == "admin":
        return True
    if g.current_role == "mahasiswa" and str(g.current_user_id) == str(mahasiswa_id):
        return True
    if g.current_role == "dosen" and _mahasiswa_pa_owns(mahasiswa_id, g.current_user_id):
        return True
    return False


@bp.route("", methods=["GET"])
@require_auth("mahasiswa")
def list_krs_mahasiswa():
    try:
        res = (
            _sb()
            .table("krs")
            .select("*, mata_kuliah(*)")
            .eq("mahasiswa_id", g.current_user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    return ok(res.data or [], "Daftar KRS Anda")


@bp.route("/pending-approval", methods=["GET"])
@require_auth("dosen")
def pending_approval():
    try:
        m = (
            _sb()
            .table("mahasiswa")
            .select("id")
            .eq("dosen_pa_id", g.current_user_id)
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    ids = [r["id"] for r in (m.data or [])]
    if not ids:
        return ok([], "Tidak ada pengajuan")
    try:
        res = (
            _sb()
            .table("krs")
            .select("*, mata_kuliah(*), mahasiswa(*)")
            .eq("status", "diajukan")
            .in_("mahasiswa_id", ids)
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 500)
    rows = res.data or []
    for r in rows:
        mh = r.get("mahasiswa")
        if isinstance(mh, dict):
            r["mahasiswa"] = strip_hash(mh)
    return ok(rows, "Menunggu persetujuan")


@bp.route("", methods=["POST"])
@require_auth("mahasiswa")
def ajukan_krs():
    body = request.get_json(silent=True) or {}
    mk_id = body.get("mata_kuliah_id")
    semester_aktif = (body.get("semester_aktif") or "").strip() or current_app.config[
        "SEMESTER_AKTIF"
    ]

    if not valid_uuid(str(mk_id)):
        return err("mata_kuliah_id tidak valid")

    cfg_sem = (current_app.config.get("SEMESTER_AKTIF") or "").strip()
    if semester_aktif != cfg_sem:
        return err(
            f"Pengajuan hanya untuk semester aktif: {cfg_sem}",
            422,
        )

    mres = _sb().table("mahasiswa").select("*").eq("id", g.current_user_id).limit(1).execute()
    if not mres.data:
        return err("Mahasiswa tidak ditemukan", 404)
    mhs = mres.data[0]

    mkres = _sb().table("mata_kuliah").select("*").eq("id", mk_id).limit(1).execute()
    if not mkres.data:
        return err("Mata kuliah tidak ditemukan", 404)
    mk = mkres.data[0]

    mk_sem = mk.get("semester")
    if mk_sem is not None and mhs.get("semester") is not None:
        if int(mk_sem) != int(mhs.get("semester")):
            return err(
                "Mata kuliah ini tidak sesuai semester akademik Anda saat ini",
                422,
            )

    if has_duplicate_course(_sb(), g.current_user_id, mk_id, semester_aktif):
        return err("Anda sudah mengambil mata kuliah ini pada semester ini", 409)

    kuota = int(mk.get("kuota") or 0)
    enrolled = count_mk_enrollment(_sb(), mk_id, semester_aktif)
    if enrolled >= kuota:
        return err("Kuota mata kuliah ini sudah penuh", 409)

    sks_mk = int(mk.get("sks") or 0)
    max_sks = int(current_app.config["MAX_SKS_PER_SEMESTER"])
    current_total = total_sks_pending_approved(_sb(), g.current_user_id, semester_aktif)
    if current_total + sks_mk > max_sks:
        return err(f"Total SKS tidak boleh melebihi {max_sks} per semester", 422)

    row = {
        "mahasiswa_id": str(g.current_user_id),
        "mata_kuliah_id": str(mk_id),
        "semester_aktif": semester_aktif,
        "status": "diajukan",
        "catatan": None,
    }
    try:
        ins = _sb().table("krs").insert(row).select("*, mata_kuliah(*)").single().execute()
    except APIError as e:
        msg = str(getattr(e, "message", e))
        if "duplicate" in msg.lower() or "unique" in msg.lower():
            return err("Mata kuliah sudah terdaftar untuk semester ini", 409)
        return err(msg, 400)

    return ok(ins.data, "KRS diajukan", 201)


@bp.route("/<kid>", methods=["DELETE"])
@require_auth("mahasiswa")
def batalkan_krs(kid):
    if not valid_uuid(kid):
        return err("ID KRS tidak valid")
    r = (
        _sb()
        .table("krs")
        .select("*")
        .eq("id", kid)
        .eq("mahasiswa_id", g.current_user_id)
        .limit(1)
        .execute()
    )
    rows = r.data or []
    if not rows:
        return err("KRS tidak ditemukan", 404)
    if rows[0].get("status") != "diajukan":
        return err("Hanya KRS berstatus diajukan yang dapat dibatalkan", 422)
    try:
        _sb().table("krs").delete().eq("id", kid).execute()
    except APIError as e:
        return err(str(getattr(e, "message", e)), 400)
    return ok(None, "KRS dibatalkan")


@bp.route("/<kid>/approve", methods=["PUT"])
@require_auth("dosen")
def approve_krs(kid):
    if not valid_uuid(kid):
        return err("ID KRS tidak valid")
    r = _sb().table("krs").select("*").eq("id", kid).limit(1).execute()
    rows = r.data or []
    if not rows:
        return err("KRS tidak ditemukan", 404)
    row = rows[0]
    if row.get("status") != "diajukan":
        return err("Hanya KRS berstatus diajukan yang dapat disetujui", 422)
    mid = row.get("mahasiswa_id")
    if not _mahasiswa_pa_owns(mid, g.current_user_id):
        return err("Hanya dosen PA mahasiswa ini yang dapat menyetujui KRS", 403)

    try:
        out = (
            _sb()
            .table("krs")
            .update({"status": "disetujui", "catatan": None})
            .eq("id", kid)
            .select("*, mata_kuliah(*)")
            .single()
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 400)
    return ok(out.data, "KRS disetujui")


@bp.route("/<kid>/reject", methods=["PUT"])
@require_auth("dosen")
def reject_krs(kid):
    if not valid_uuid(kid):
        return err("ID KRS tidak valid")
    body = request.get_json(silent=True) or {}
    catatan = (body.get("catatan") or "").strip()
    if not catatan:
        return err("Catatan penolakan wajib diisi")

    r = _sb().table("krs").select("*").eq("id", kid).limit(1).execute()
    rows = r.data or []
    if not rows:
        return err("KRS tidak ditemukan", 404)
    row = rows[0]
    if row.get("status") != "diajukan":
        return err("Hanya KRS berstatus diajukan yang dapat ditolak", 422)
    mid = row.get("mahasiswa_id")
    if not _mahasiswa_pa_owns(mid, g.current_user_id):
        return err("Hanya dosen PA mahasiswa ini yang dapat menolak KRS", 403)

    try:
        out = (
            _sb()
            .table("krs")
            .update({"status": "ditolak", "catatan": catatan})
            .eq("id", kid)
            .select("*, mata_kuliah(*)")
            .single()
            .execute()
        )
    except APIError as e:
        return err(str(getattr(e, "message", e)), 400)
    return ok(out.data, "KRS ditolak")


@bp.route("/summary/<mahasiswa_id>", methods=["GET"])
@require_auth("admin", "dosen", "mahasiswa")
def krs_summary(mahasiswa_id):
    if not valid_uuid(mahasiswa_id):
        return err("ID mahasiswa tidak valid")
    if not _can_view_summary(mahasiswa_id):
        return err("Akses ditolak", 403)

    semester_aktif = (request.args.get("semester_aktif") or "").strip() or current_app.config[
        "SEMESTER_AKTIF"
    ]
    data = summary_sks_for_mahasiswa(_sb(), mahasiswa_id, semester_aktif)
    return ok(data, "Ringkasan SKS")
