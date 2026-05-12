"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { RequireRole } from "@/components/auth/require-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { profilDosenSchema, profilMahasiswaSchema } from "@/lib/schemas";
import { useAuthStore } from "@/stores/auth-store";
import type { Dosen, Mahasiswa } from "@/types/models";
import type { z } from "zod";

function MahasiswaProfil() {
  const { token, user, setAuth } = useAuthStore();
  const uid = user?.id as string;
  const form = useForm<z.infer<typeof profilMahasiswaSchema>>({
    resolver: zodResolver(profilMahasiswaSchema),
    defaultValues: { nama: "", email: "", jurusan: "" },
  });

  useEffect(() => {
    if (!token || !uid) return;
    (async () => {
      const r = await apiRequest<Mahasiswa>(`/api/mahasiswa/${uid}`, { token });
      if (r.data) {
        form.reset({
          nama: r.data.nama,
          email: r.data.email,
          jurusan: r.data.jurusan ?? "",
        });
      }
    })();
  }, [token, uid, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    const r = await apiRequest<Mahasiswa>(`/api/mahasiswa/${uid}`, {
      method: "PUT",
      token,
      body: JSON.stringify({
        nama: data.nama,
        email: data.email,
        jurusan: data.jurusan || null,
      }),
    });
    if (!r.success) {
      toast.error(r.message ?? "Gagal menyimpan");
      return;
    }
    toast.success("Profil diperbarui");
    if (r.data) {
      setAuth(token, { ...user, ...r.data } as Record<string, unknown>, "mahasiswa");
    }
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Profil Mahasiswa</CardTitle>
        <CardDescription>Ubah nama, email, dan jurusan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" {...form.register("nama")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jurusan">Jurusan</Label>
            <Input id="jurusan" {...form.register("jurusan")} />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DosenProfil() {
  const { token, user, setAuth } = useAuthStore();
  const uid = user?.id as string;
  const form = useForm<z.infer<typeof profilDosenSchema>>({
    resolver: zodResolver(profilDosenSchema),
    defaultValues: { nama: "", email: "", bidang_keahlian: "", password: "" },
  });

  useEffect(() => {
    if (!token || !uid) return;
    (async () => {
      const r = await apiRequest<Dosen>(`/api/dosen/${uid}`, { token });
      if (r.data) {
        form.reset({
          nama: r.data.nama,
          email: r.data.email,
          bidang_keahlian: r.data.bidang_keahlian ?? "",
          password: "",
        });
      }
    })();
  }, [token, uid, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    const body: Record<string, unknown> = {
      nama: data.nama,
      email: data.email,
      bidang_keahlian: data.bidang_keahlian || null,
    };
    if (data.password && data.password.length >= 8) {
      body.password = data.password;
    }
    const r = await apiRequest<Dosen>(`/api/dosen/${uid}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    });
    if (!r.success) {
      toast.error(r.message ?? "Gagal menyimpan");
      return;
    }
    toast.success("Profil diperbarui");
    form.setValue("password", "");
    if (r.data) {
      setAuth(token, { ...user, ...r.data } as Record<string, unknown>, "dosen");
    }
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Profil Dosen</CardTitle>
        <CardDescription>Perbarui data diri dan password (opsional).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dnama">Nama</Label>
            <Input id="dnama" {...form.register("nama")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demail">Email</Label>
            <Input id="demail" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bidang">Bidang keahlian</Label>
            <Input id="bidang" {...form.register("bidang_keahlian")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dpass">Password baru (opsional)</Label>
            <Input id="dpass" type="password" autoComplete="new-password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ProfilPage() {
  const role = useAuthStore((s) => s.role);

  return (
    <RequireRole roles={["mahasiswa", "dosen"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profil</h1>
        {role === "mahasiswa" ? <MahasiswaProfil /> : <DosenProfil />}
      </div>
    </RequireRole>
  );
}
