"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";
import { loginAdminSchema, loginMahasiswaDosenSchema } from "@/lib/schemas";
import { useAuthStore } from "@/stores/auth-store";
import type { z } from "zod";

type MhsDosenForm = z.infer<typeof loginMahasiswaDosenSchema>;
type AdminForm = z.infer<typeof loginAdminSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const mhsDosen = useForm<MhsDosenForm>({
    resolver: zodResolver(loginMahasiswaDosenSchema),
    defaultValues: { email: "", password: "" },
  });

  const admin = useForm<AdminForm>({
    resolver: zodResolver(loginAdminSchema),
    defaultValues: { username: "", password: "" },
  });

  const onMhs = mhsDosen.handleSubmit(async (data) => {
    const r = await apiRequest<{ user: Record<string, unknown>; token: string; role: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          role: "mahasiswa",
          email: data.email,
          password: data.password,
        }),
      },
    );
    if (!r.success || !r.data?.token) {
      toast.error(r.message ?? "Login gagal");
      return;
    }
    setAuth(r.data.token, r.data.user as Record<string, unknown>, "mahasiswa");
    toast.success("Selamat datang");
    router.push("/dashboard");
    router.refresh();
  });

  const onDosen = mhsDosen.handleSubmit(async (data) => {
    const r = await apiRequest<{ user: Record<string, unknown>; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          role: "dosen",
          email: data.email,
          password: data.password,
        }),
      },
    );
    if (!r.success || !r.data?.token) {
      toast.error(r.message ?? "Login gagal");
      return;
    }
    setAuth(r.data.token, r.data.user as Record<string, unknown>, "dosen");
    toast.success("Selamat datang");
    router.push("/dashboard");
    router.refresh();
  });

  const onAdmin = admin.handleSubmit(async (data) => {
    const r = await apiRequest<{ user: Record<string, unknown>; token: string }>(
      "/api/auth/login/admin",
      {
        method: "POST",
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      },
    );
    if (!r.success || !r.data?.token) {
      toast.error(r.message ?? "Login gagal");
      return;
    }
    setAuth(r.data.token, r.data.user as Record<string, unknown>, "admin");
    toast.success("Login admin berhasil");
    router.push("/admin/mahasiswa");
    router.refresh();
  });

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Masuk</CardTitle>
          <CardDescription>
            Pilih peran Anda. Belum punya akun mahasiswa?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Daftar
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mahasiswa" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mahasiswa">Mahasiswa</TabsTrigger>
              <TabsTrigger value="dosen">Dosen</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="mahasiswa" className="space-y-4">
              <form onSubmit={onMhs} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="m-email">Email</Label>
                  <Input
                    id="m-email"
                    type="email"
                    autoComplete="email"
                    {...mhsDosen.register("email")}
                  />
                  {mhsDosen.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {mhsDosen.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-pass">Password</Label>
                  <Input
                    id="m-pass"
                    type="password"
                    autoComplete="current-password"
                    {...mhsDosen.register("password")}
                  />
                  {mhsDosen.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {mhsDosen.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={mhsDosen.formState.isSubmitting}>
                  {mhsDosen.formState.isSubmitting ? "Memproses…" : "Masuk sebagai Mahasiswa"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="dosen" className="space-y-4">
              <form onSubmit={onDosen} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="d-email">Email</Label>
                  <Input
                    id="d-email"
                    type="email"
                    {...mhsDosen.register("email")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-pass">Password</Label>
                  <Input
                    id="d-pass"
                    type="password"
                    {...mhsDosen.register("password")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={mhsDosen.formState.isSubmitting}>
                  {mhsDosen.formState.isSubmitting ? "Memproses…" : "Masuk sebagai Dosen"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={onAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="a-user">Username</Label>
                  <Input id="a-user" autoComplete="username" {...admin.register("username")} />
                  {admin.formState.errors.username && (
                    <p className="text-sm text-red-600">
                      {admin.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-pass">Password</Label>
                  <Input
                    id="a-pass"
                    type="password"
                    {...admin.register("password")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={admin.formState.isSubmitting}>
                  {admin.formState.isSubmitting ? "Memproses…" : "Masuk sebagai Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
