"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { RequireRole } from "@/components/auth/require-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { KrsRow } from "@/types/models";

const rejectSchema = z.object({
  catatan: z.string().min(1, "Catatan wajib"),
});

export default function KrsApprovalPage() {
  const { token } = useAuthStore();
  const [rows, setRows] = useState<KrsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const form = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { catatan: "" },
  });

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const r = await apiRequest<KrsRow[]>("/api/krs/pending-approval", { token });
    if (!r.success) toast.error(r.message ?? "Gagal memuat");
    setRows(Array.isArray(r.data) ? r.data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const approve = async (id: string) => {
    if (!token) return;
    const r = await apiRequest(`/api/krs/${id}/approve`, { method: "PUT", token });
    if (!r.success) {
      toast.error(r.message ?? "Gagal menyetujui");
      return;
    }
    toast.success("KRS disetujui");
    load();
  };

  const onReject = form.handleSubmit(async (data) => {
    if (!token || !rejectId) return;
    const r = await apiRequest(`/api/krs/${rejectId}/reject`, {
      method: "PUT",
      token,
      body: JSON.stringify({ catatan: data.catatan }),
    });
    if (!r.success) {
      toast.error(r.message ?? "Gagal menolak");
      return;
    }
    toast.success("KRS ditolak");
    setRejectId(null);
    form.reset();
    load();
  });

  return (
    <RequireRole roles={["dosen"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Approval KRS</h1>
          <p className="text-sm text-muted-foreground">
            Pengajuan dari mahasiswa bimbingan Anda.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Menunggu tindakan</CardTitle>
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
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Mata kuliah</TableHead>
                    <TableHead>SKS</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.mahasiswa?.nama}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.mahasiswa?.nim}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.mata_kuliah?.kode_mk} — {row.mata_kuliah?.nama_mk}
                      </TableCell>
                      <TableCell>{row.mata_kuliah?.sks}</TableCell>
                      <TableCell>{row.semester_aktif}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => approve(row.id)}>
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRejectId(row.id);
                            form.reset({ catatan: "" });
                          }}
                        >
                          Tolak
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loading && rows.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Tidak ada pengajuan yang menunggu.
              </p>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak KRS</DialogTitle>
            </DialogHeader>
            <form onSubmit={onReject} className="space-y-4">
              <div className="space-y-2">
                <Label>Catatan untuk mahasiswa</Label>
                <Textarea {...form.register("catatan")} rows={4} />
                {form.formState.errors.catatan && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.catatan.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRejectId(null)}>
                  Batal
                </Button>
                <Button type="submit" variant="destructive">
                  Tolak pengajuan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RequireRole>
  );
}
