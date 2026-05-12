"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

function statusVariant(s: KrsStatus): "warning" | "success" | "danger" {
  if (s === "disetujui") return "success";
  if (s === "ditolak") return "danger";
  return "warning";
}

export default function KrsListPage() {
  const { token } = useAuthStore();
  const [rows, setRows] = useState<KrsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const r = await apiRequest<KrsRow[]>("/api/krs", { token });
    if (!r.success) toast.error(r.message ?? "Gagal memuat KRS");
    setRows(Array.isArray(r.data) ? r.data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const cancel = async (id: string) => {
    if (!token) return;
    const r = await apiRequest(`/api/krs/${id}`, { method: "DELETE", token });
    if (!r.success) {
      toast.error(r.message ?? "Gagal membatalkan");
      return;
    }
    toast.success("KRS dibatalkan");
    load();
  };

  return (
    <RequireRole roles={["mahasiswa"]}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">KRS Saya</h1>
            <p className="text-sm text-muted-foreground">
              Status pengajuan per mata kuliah.
            </p>
          </div>
          <Button asChild>
            <Link href="/krs/tambah">Tambah pengajuan</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada KRS.{" "}
                <Link href="/krs/tambah" className="text-primary hover:underline">
                  Ajukan sekarang
                </Link>
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Mata kuliah</TableHead>
                    <TableHead>SKS</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">
                        {row.mata_kuliah?.kode_mk}
                      </TableCell>
                      <TableCell>{row.mata_kuliah?.nama_mk}</TableCell>
                      <TableCell>{row.mata_kuliah?.sks}</TableCell>
                      <TableCell>{row.semester_aktif}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === "diajukan" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancel(row.id)}
                          >
                            Batalkan
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
