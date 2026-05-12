"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { RequireRole } from "@/components/auth/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function MahasiswaKrsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuthStore();
  const [rows, setRows] = useState<KrsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      setLoading(true);
      const r = await apiRequest<KrsRow[]>(`/api/mahasiswa/${id}/krs`, { token });
      setRows(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    })();
  }, [token, id]);

  return (
    <RequireRole roles={["dosen"]}>
      <div className="space-y-6">
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
      </div>
    </RequireRole>
  );
}
