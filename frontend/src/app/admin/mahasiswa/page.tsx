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
import type { Dosen, Mahasiswa } from "@/types/models";

const formSchema = z.object({
  nim: z.string().min(1).max(20),
  nama: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  semester: z.coerce.number().min(1).max(20),
  jurusan: z.string().optional(),
  dosen_pa_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminMahasiswaPage() {
  const { token } = useAuthStore();
  const [rows, setRows] = useState<Mahasiswa[]>([]);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mahasiswa | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nim: "",
      nama: "",
      email: "",
      password: "",
      semester: 1,
      jurusan: "",
      dosen_pa_id: "",
    },
  });

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const [m, d] = await Promise.all([
      apiRequest<Mahasiswa[]>("/api/mahasiswa", { token }),
      apiRequest<Dosen[]>("/api/dosen", { token }),
    ]);
    setRows(Array.isArray(m.data) ? m.data : []);
    setDosenList(Array.isArray(d.data) ? d.data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      nim: "",
      nama: "",
      email: "",
      password: "",
      semester: 1,
      jurusan: "",
      dosen_pa_id: "",
    });
    setOpen(true);
  };

  const openEdit = (m: Mahasiswa) => {
    setEditing(m);
    form.reset({
      nim: m.nim,
      nama: m.nama,
      email: m.email,
      password: "",
      semester: m.semester,
      jurusan: m.jurusan ?? "",
      dosen_pa_id: m.dosen_pa_id ?? "",
    });
    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    if (!editing && (!data.password || data.password.length < 8)) {
      toast.error("Password minimal 8 karakter untuk mahasiswa baru");
      return;
    }
    const dosenId = data.dosen_pa_id || undefined;
    if (editing) {
      const body: Record<string, unknown> = {
        nama: data.nama,
        email: data.email,
        semester: data.semester,
        jurusan: data.jurusan || null,
        dosen_pa_id: dosenId ?? null,
      };
      if (editing.nim !== data.nim) body.nim = data.nim;
      const r = await apiRequest(`/api/mahasiswa/${editing.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify(body),
      });
      if (!r.success) {
        toast.error(r.message ?? "Gagal menyimpan");
        return;
      }
      toast.success("Mahasiswa diperbarui");
    } else {
      const r = await apiRequest("/api/mahasiswa", {
        method: "POST",
        token,
        body: JSON.stringify({
          nim: data.nim,
          nama: data.nama,
          email: data.email,
          password: data.password,
          semester: data.semester,
          jurusan: data.jurusan || undefined,
          dosen_pa_id: dosenId,
        }),
      });
      if (!r.success) {
        toast.error(r.message ?? "Gagal menambah");
        return;
      }
      toast.success("Mahasiswa ditambahkan");
    }
    setOpen(false);
    load();
  });

  const remove = async (m: Mahasiswa) => {
    if (!token || !confirm(`Hapus ${m.nama}?`)) return;
    const r = await apiRequest(`/api/mahasiswa/${m.id}`, { method: "DELETE", token });
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
          <h1 className="text-2xl font-bold">Mahasiswa</h1>
          <p className="text-sm text-muted-foreground">Kelola data mahasiswa.</p>
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
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sem.</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono">{m.nim}</TableCell>
                    <TableCell>{m.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>{m.semester}</TableCell>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit mahasiswa" : "Mahasiswa baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>NIM</Label>
              <Input {...form.register("nim")} disabled={!!editing} />
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
                <Label>Password awal</Label>
                <Input type="password" {...form.register("password")} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Semester akademik (angka)</Label>
              <Input type="number" min={1} {...form.register("semester")} />
            </div>
            <div className="space-y-2">
              <Label>Jurusan</Label>
              <Input {...form.register("jurusan")} />
            </div>
            <div className="space-y-2">
              <Label>Dosen PA</Label>
              <Select
                value={form.watch("dosen_pa_id") || "__none__"}
                onValueChange={(v) =>
                  form.setValue("dosen_pa_id", v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opsional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tidak ada —</SelectItem>
                  {dosenList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
