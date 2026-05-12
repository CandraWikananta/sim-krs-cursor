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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Dosen } from "@/types/models";

const schema = z.object({
  nidn: z.string().min(1).max(20),
  nama: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  bidang_keahlian: z.string().optional(),
  max_mahasiswa_bimbingan: z.coerce.number().min(1).max(500),
});

type FormValues = z.infer<typeof schema>;

export default function AdminDosenPage() {
  const { token } = useAuthStore();
  const [rows, setRows] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dosen | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nidn: "",
      nama: "",
      email: "",
      password: "",
      bidang_keahlian: "",
      max_mahasiswa_bimbingan: 20,
    },
  });

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const r = await apiRequest<Dosen[]>("/api/dosen", { token });
    setRows(Array.isArray(r.data) ? r.data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      nidn: "",
      nama: "",
      email: "",
      password: "",
      bidang_keahlian: "",
      max_mahasiswa_bimbingan: 20,
    });
    setOpen(true);
  };

  const openEdit = (d: Dosen) => {
    setEditing(d);
    form.reset({
      nidn: d.nidn,
      nama: d.nama,
      email: d.email,
      password: "",
      bidang_keahlian: d.bidang_keahlian ?? "",
      max_mahasiswa_bimbingan: d.max_mahasiswa_bimbingan,
    });
    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    if (!editing && (!data.password || data.password.length < 8)) {
      toast.error("Password wajib untuk dosen baru");
      return;
    }
    if (editing) {
      const body: Record<string, unknown> = {
        nama: data.nama,
        email: data.email,
        bidang_keahlian: data.bidang_keahlian || null,
        max_mahasiswa_bimbingan: data.max_mahasiswa_bimbingan,
        nidn: data.nidn,
      };
      if (data.password && data.password.length >= 8) {
        body.password = data.password;
      }
      const r = await apiRequest(`/api/dosen/${editing.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify(body),
      });
      if (!r.success) {
        toast.error(r.message ?? "Gagal menyimpan");
        return;
      }
      toast.success("Dosen diperbarui");
    } else {
      const r = await apiRequest("/api/auth/register/dosen", {
        method: "POST",
        token,
        body: JSON.stringify({
          nidn: data.nidn,
          nama: data.nama,
          email: data.email,
          password: data.password,
          bidang_keahlian: data.bidang_keahlian || undefined,
          max_mahasiswa_bimbingan: data.max_mahasiswa_bimbingan,
        }),
      });
      if (!r.success) {
        toast.error(r.message ?? "Gagal menambah");
        return;
      }
      toast.success("Dosen ditambahkan");
    }
    setOpen(false);
    load();
  });

  const remove = async (d: Dosen) => {
    if (!token || !confirm(`Hapus ${d.nama}?`)) return;
    const r = await apiRequest(`/api/dosen/${d.id}`, { method: "DELETE", token });
    if (!r.success) {
      toast.error(r.message ?? "Gagal menghapus");
      return;
    }
    toast.success("Dihapus");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Dosen</h1>
          <p className="text-sm text-muted-foreground">CRUD data dosen.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah dosen
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
                  <TableHead>NIDN</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Kuota bimbingan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono">{d.nidn}</TableCell>
                    <TableCell>{d.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{d.email}</TableCell>
                    <TableCell>{d.max_mahasiswa_bimbingan}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => remove(d)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit dosen" : "Dosen baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>NIDN</Label>
              <Input {...form.register("nidn")} />
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input {...form.register("nama")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" {...form.register("password")} />
              </div>
            )}
            {editing && (
              <div className="space-y-2">
                <Label>Password baru (opsional)</Label>
                <Input type="password" {...form.register("password")} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Bidang keahlian</Label>
              <Input {...form.register("bidang_keahlian")} />
            </div>
            <div className="space-y-2">
              <Label>Max mahasiswa bimbingan</Label>
              <Input type="number" min={1} {...form.register("max_mahasiswa_bimbingan")} />
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
