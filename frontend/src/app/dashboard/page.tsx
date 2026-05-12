"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";

import { RequireRole } from "@/components/auth/require-role";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Dosen, KrsRow, KrsSummary, Mahasiswa } from "@/types/models";

const semesterAktif =
  process.env.NEXT_PUBLIC_SEMESTER_AKTIF ?? "2024/2025 Ganjil";
const maxSks = 24;

function MahasiswaDashboard() {
  const { token, user } = useAuthStore();
  const uid = user?.id as string | undefined;
  const [summary, setSummary] = useState<KrsSummary | null>(null);
  const [mhs, setMhs] = useState<Mahasiswa | null>(null);
  const [pa, setPa] = useState<Dosen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !uid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [sRes, mRes] = await Promise.all([
        apiRequest<KrsSummary>(
          `/api/krs/summary/${uid}?semester_aktif=${encodeURIComponent(semesterAktif)}`,
          { token },
        ),
        apiRequest<Mahasiswa>(`/api/mahasiswa/${uid}`, { token }),
      ]);
      if (cancelled) return;
      setSummary(sRes.data ?? null);
      setMhs(mRes.data ?? null);
      const paId = mRes.data?.dosen_pa_id;
      if (paId) {
        const dRes = await apiRequest<Dosen>(`/api/dosen/${paId}`, { token });
        if (!cancelled) setPa(dRes.data ?? null);
      } else setPa(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, uid]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const sks = summary?.total_sks_diajukan_disetujui ?? 0;
  const diajukan = summary?.sks_by_status?.diajukan ?? 0;
  const disetujui = summary?.sks_by_status?.disetujui ?? 0;
  const ditolak = summary?.sks_by_status?.ditolak ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Mahasiswa</h1>
        <p className="text-muted-foreground">
          Semester kuliah aktif: <Badge variant="secondary">{semesterAktif}</Badge>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SKS (diajukan + disetujui)</CardDescription>
            <CardTitle className="text-3xl">
              {sks} / {maxSks}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Batas maksimal {maxSks} SKS per semester.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status KRS (SKS)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="warning">Diajukan: {diajukan}</Badge>
            <Badge variant="success">Disetujui: {disetujui}</Badge>
            <Badge variant="danger">Ditolak: {ditolak}</Badge>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Dosen PA
            </CardDescription>
            <CardTitle className="text-lg">
              {pa?.nama ?? "Belum ditetapkan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {pa?.email && <p>{pa.email}</p>}
            {mhs && (
              <p className="mt-1">
                Anda semester {mhs.semester}
                {mhs.jurusan ? ` — ${mhs.jurusan}` : ""}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5" />
            Cepat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a
            href="/krs/tambah"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          >
            Ajukan KRS baru
          </a>
          <a
            href="/krs"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
          >
            Lihat daftar KRS
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

function DosenDashboard() {
  const { token } = useAuthStore();
  const [countMhs, setCountMhs] = useState(0);
  const [pending, setPending] = useState<KrsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [mRes, pRes] = await Promise.all([
        apiRequest<Mahasiswa[]>("/api/mahasiswa", { token }),
        apiRequest<KrsRow[]>("/api/krs/pending-approval", { token }),
      ]);
      if (cancelled) return;
      setCountMhs(Array.isArray(mRes.data) ? mRes.data.length : 0);
      setPending(Array.isArray(pRes.data) ? pRes.data : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Dosen</h1>
        <p className="text-muted-foreground">Ringkasan bimbingan akademik Anda.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Mahasiswa bimbingan</CardDescription>
            <CardTitle className="text-4xl">{countMhs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>KRS menunggu persetujuan</CardDescription>
            <CardTitle className="text-4xl">{pending.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="/krs-approval"
              className="text-sm font-medium text-primary hover:underline"
            >
              Proses approval →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const role = useAuthStore((s) => s.role);
  const router = useRouter();

  useEffect(() => {
    if (role === "admin") router.replace("/admin/mahasiswa");
  }, [role, router]);

  if (role === "admin") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <RequireRole roles={["mahasiswa", "dosen"]}>
      {role === "mahasiswa" ? <MahasiswaDashboard /> : <DosenDashboard />}
    </RequireRole>
  );
}
