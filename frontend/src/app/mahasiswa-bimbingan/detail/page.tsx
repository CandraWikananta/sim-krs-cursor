"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { RequireRole } from "@/components/auth/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { KrsRow, KrsStatus } from "@/types/models";

function v(s: KrsStatus): "warning" | "success" | "danger" {
  if (s === "disetujui") return "success";
  if (s === "ditolak") return "danger";
  return "warning";
}

function MahasiswaKrsDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { token } = useAuthStore();
  const [rows, setRows] = useState<KrsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    let c = false;
    (async () => {
      setLoading(true);
      const r = await apiRequest<KrsRow[]>(`/api/mahasiswa/${id}/krs`, { token });
      if (!c) {
        setRows(Array.isArray(r.data) ? r.data : []);
        setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [token, id]);

  if (!id) {
    return (
      <p className="text-center text-muted-foreground">
        Parameter <code className="text-foreground">id</code> tidak ada.{" "}
        <Link href="/mahasiswa-bimbingan" className="text-primary underline">
          Kembali ke daftar
        </Link>
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/mahasiswa-bimbingan">← Kembali</Link>
        </Button>
        <h1 className="text-2xl font-bold">KRS Mahasiswa</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Mata kuliah</TableHead>
                  <TableHead>SKS</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono">{row.mata_kuliah?.kode_mk}</TableCell>
                    <TableCell>{row.mata_kuliah?.nama_mk}</TableCell>
                    <TableCell>{row.mata_kuliah?.sks}</TableCell>
                    <TableCell>{row.semester_aktif}</TableCell>
                    <TableCell>
                      <Badge variant={v(row.status)}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && rows.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Belum ada KRS.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function MahasiswaKrsDetailPage() {
  return (
    <RequireRole roles={["dosen"]}>
      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Skeleton className="h-10 w-64" />
            </div>
          }
        >
          <MahasiswaKrsDetailInner />
        </Suspense>
      </div>
    </RequireRole>
  );
}
