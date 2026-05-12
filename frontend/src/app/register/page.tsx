"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { registerMahasiswaSchema } from "@/lib/schemas";
import { useAuthStore } from "@/stores/auth-store";

type Form = z.infer<typeof registerMahasiswaSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const form = useForm<Form>({
    resolver: zodResolver(registerMahasiswaSchema),
    defaultValues: {
      nim: "",
      nama: "",
      email: "",
      password: "",
      confirm: "",
      semester: 1,
      jurusan: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const r = await apiRequest<{ user: Record<string, unknown>; token: string }>(
      "/api/auth/register/mahasiswa",
      {
        method: "POST",
        body: JSON.stringify({
          nim: data.nim,
          nama: data.nama,
          email: data.email,
          password: data.password,
          semester: data.semester,
          jurusan: data.jurusan || undefined,
        }),
      },
    );
    if (!r.success || !r.data?.token) {
      toast.error(r.message ?? "Registrasi gagal");
      return;
    }
    setAuth(r.data.token, r.data.user as Record<string, unknown>, "mahasiswa");
    toast.success("Akun berhasil dibuat");
    router.push("/dashboard");
    router.refresh();
  });

  return (
    <div className="mx-auto max-w-lg">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Daftar Mahasiswa</CardTitle>
          <CardDescription>
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nim">NIM</Label>
              <Input id="nim" {...form.register("nim")} />
              {form.formState.errors.nim && (
                <p className="text-sm text-red-600">{form.formState.errors.nim.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nama">Nama lengkap</Label>
              <Input id="nama" {...form.register("nama")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester akademik (angka)</Label>
              <Input id="semester" type="number" min={1} {...form.register("semester")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jurusan">Jurusan</Label>
              <Input id="jurusan" {...form.register("jurusan")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Ulangi password</Label>
              <Input id="confirm" type="password" {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="text-sm text-red-600">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Mendaftar…" : "Buat akun"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
