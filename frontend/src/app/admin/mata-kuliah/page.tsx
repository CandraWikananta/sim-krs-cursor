"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Dosen, MataKuliah } from "@/types/models";

const schema = z.object({
  kode_mk: z.string().min(1).max(20),
  nama_mk: z.string().min(1).max(100),
  sks: z.coerce.number().min(1).max(6),
  kuota: z.coerce.number().min(1).max(500),
  dosen_pengampu_id: z.string().optional(),
  semester: z.preprocess(
    (v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    },
    z.number().min(1).max(20).optional(),
  ),
});

type FormValues = z.infer<typeof schema>;

export default function AdminMataKuliahPage() {
  const { token } = useAuthStore();
  const [rows, setRows] = useState<MataKuliah[]>([]);
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MataKuliah | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kode_mk: "",
      nama_mk: "",
      sks: 3,
      semester: undefined,
      kuota: 30,
      dosen_pengampu_id: "",
    },
  });

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const [mk, d] = await Promise.all([
      apiRequest<MataKuliah[]>("/api/mata-kuliah", { token }),
      apiRequest<Dosen[]>("/api/dosen", { token }),
    ]);
    setRows(Array.isArray(mk.data) ? mk.data : []);
    setDosen(Array.isArray(d.data) ? d.data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      kode_mk: "",
      nama_mk: "",
      sks: 3,
      semester: undefined,
      kuota: 30,
      dosen_pengampu_id: "",
    });
    setOpen(true);
  };

  const openEdit = (m: MataKuliah) => {
    setEditing(m);
    form.reset({
      kode_mk: m.kode_mk,
      nama_mk: m.nama_mk,
      sks: m.sks,
      semester: m.semester ?? undefined,
      kuota: m.kuota,
      dosen_pengampu_id: m.dosen_pengampu_id ?? "",
    });
    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    const body: Record<string, unknown> = {
      kode_mk: data.kode_mk,
      nama_mk: data.nama_mk,
      sks: data.sks,
      kuota: data.kuota,
      semester: data.semester ?? null,
      dosen_pengampu_id: data.dosen_pengampu_id || null,
    };
    if (editing) {
      const r = await apiRequest(`/api/mata-kuliah/${editing.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify(body),
      });
      if (!r.success) {
        toast.error(r.message ?? "Gagal menyimpan");
        return;
      }
      toast.success("Mata kuliah diperbarui");
    } else {
      const r = await apiRequest("/api/mata-kuliah", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...body,
          semester: data.semester,
          dosen_pengampu_id: data.dosen_pengampu_id || undefined,
        }),
      });
      if (!r.success) {
        toast.error(r.message ?? "Gagal menambah");
        return;
      }
      toast.success("Mata kuliah ditambahkan");
    }
    setOpen(false);
    load();
  });

  const remove = async (m: MataKuliah) => {
    if (!token || !confirm(`Hapus ${m.kode_mk}?`)) return;
    const r = await apiRequest(`/api/mata-kuliah/${m.id}`, { method: "DELETE", token });
    if (!r.success) {
      toast.error(r.message ?? "Gagal menghapus");
      return;
    }
    toast.success("Dihapus");
    load();
  };

  const dosenName = (id: string | null) =>
    dosen.find((x) => x.id === id)?.nama ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Mata kuliah</h1>
          <p className="text-sm text-muted-foreground">CRUD mata kuliah.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>SKS</TableHead>
                  <TableHead>Sem.</TableHead>
                  <TableHead>Kuota</TableHead>
                  <TableHead>Pengampu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono">{m.kode_mk}</TableCell>
                    <TableCell>{m.nama_mk}</TableCell>
                    <TableCell>{m.sks}</TableCell>
                    <TableCell>{m.semester ?? "—"}</TableCell>
                    <TableCell>{m.kuota}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">
                      {dosenName(m.dosen_pengampu_id)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => remove(m)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit MK" : "Mata kuliah baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input {...form.register("kode_mk")} />
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input {...form.register("nama_mk")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKS</Label>
                <Input type="number" min={1} max={6} {...form.register("sks")} />
              </div>
              <div className="space-y-2">
                <Label>Semester (angka)</Label>
                <Input type="number" min={1} placeholder="Opsional" {...form.register("semester")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kuota</Label>
              <Input type="number" min={1} {...form.register("kuota")} />
            </div>
            <div className="space-y-2">
              <Label>Dosen pengampu</Label>
              <Select
                value={form.watch("dosen_pengampu_id") || "__none__"}
                onValueChange={(v) =>
                  form.setValue("dosen_pengampu_id", v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opsional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tidak ada —</SelectItem>
                  {dosen.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
