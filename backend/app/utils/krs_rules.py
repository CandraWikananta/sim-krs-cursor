"""Business rules for KRS: SKS cap, kuota, semester."""


def statuses_counted_for_sks():
    return ("diajukan", "disetujui")


def statuses_counted_for_kuota():
    return ("diajukan", "disetujui")


def count_mk_enrollment(client, mata_kuliah_id, semester_aktif):
    q = (
        client.table("krs")
        .select("id", count="exact")
        .eq("mata_kuliah_id", mata_kuliah_id)
        .eq("semester_aktif", semester_aktif)
        .in_("status", list(statuses_counted_for_kuota()))
        .execute()
    )
    if getattr(q, "count", None) is not None:
        return int(q.count)
    return len(q.data or [])


def has_duplicate_course(client, mahasiswa_id, mata_kuliah_id, semester_aktif):
    q = (
        client.table("krs")
        .select("id")
        .eq("mahasiswa_id", mahasiswa_id)
        .eq("mata_kuliah_id", mata_kuliah_id)
        .eq("semester_aktif", semester_aktif)
        .limit(1)
        .execute()
    )
    return bool(q.data)


def total_sks_pending_approved(client, mahasiswa_id, semester_aktif):
    q = (
        client.table("krs")
        .select("mata_kuliah_id,status")
        .eq("mahasiswa_id", mahasiswa_id)
        .eq("semester_aktif", semester_aktif)
        .in_("status", list(statuses_counted_for_sks()))
        .execute()
    )
    rows = q.data or []
    if not rows:
        return 0
    mk_ids = list({r["mata_kuliah_id"] for r in rows if r.get("mata_kuliah_id")})
    if not mk_ids:
        return 0
    mq = client.table("mata_kuliah").select("id,sks").in_("id", mk_ids).execute()
    sks_map = {r["id"]: int(r.get("sks") or 0) for r in (mq.data or [])}
    total = 0
    for r in rows:
        mid = r.get("mata_kuliah_id")
        if mid in sks_map:
            total += sks_map[mid]
    return total


def summary_sks_for_mahasiswa(client, mahasiswa_id, semester_aktif):
    q = (
        client.table("krs")
        .select("id,status,mata_kuliah_id")
        .eq("mahasiswa_id", mahasiswa_id)
        .eq("semester_aktif", semester_aktif)
        .execute()
    )
    rows = q.data or []
    mk_ids = list({r["mata_kuliah_id"] for r in rows if r.get("mata_kuliah_id")})
    sks_map = {}
    if mk_ids:
        mq = client.table("mata_kuliah").select("id,sks").in_("id", mk_ids).execute()
        sks_map = {r["id"]: int(r.get("sks") or 0) for r in (mq.data or [])}

    by_status = {"diajukan": 0, "disetujui": 0, "ditolak": 0}
    total_counted = 0
    for row in rows:
        st = row.get("status") or ""
        sks = sks_map.get(row.get("mata_kuliah_id"), 0)
        if st in by_status:
            by_status[st] += sks
        if st in statuses_counted_for_sks():
            total_counted += sks
    return {
        "semester_aktif": semester_aktif,
        "total_sks_diajukan_disetujui": total_counted,
        "sks_by_status": by_status,
        "jumlah_item": len(rows),
    }
