"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { RequireRole } from "@/components/auth/require-role";
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
import type { Mahasiswa } from "@/types/models";

export default function MahasiswaBimbinganPage() {
  const { token } = useAuthStore();
  const [rows, setRows] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      const r = await apiRequest<Mahasiswa[]>("/api/mahasiswa", { token });
      setRows(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    })();
  }, [token]);

  return (
    <RequireRole roles={["dosen"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mahasiswa Bimbingan</h1>
          <p className="text-sm text-muted-foreground">
            Daftar mahasiswa dengan Anda sebagai dosen PA.
          </p>
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
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sem.</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead className="text-right">KRS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono">{m.nim}</TableCell>
                      <TableCell>{m.nama}</TableCell>
                      <TableCell className="text-muted-foreground">{m.email}</TableCell>
                      <TableCell>{m.semester}</TableCell>
                      <TableCell>{m.jurusan ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/mahasiswa-bimbingan/${m.id}`}>Lihat KRS</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loading && rows.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Tidak ada mahasiswa bimbingan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
