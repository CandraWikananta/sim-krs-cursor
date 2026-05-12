"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Dosen, Mahasiswa } from "@/types/models";

const schema = z.object({
  mahasiswa_id: z.string().uuid(),
  dosen_pa_id: z.string().uuid(),
});

export default function AdminAssignPaPage() {
  const { token } = useAuthStore();
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { mahasiswa_id: "", dosen_pa_id: "" },
  });

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      const [m, d] = await Promise.all([
        apiRequest<Mahasiswa[]>("/api/mahasiswa", { token }),
        apiRequest<Dosen[]>("/api/dosen", { token }),
      ]);
      setMahasiswa(Array.isArray(m.data) ? m.data : []);
      setDosen(Array.isArray(d.data) ? d.data : []);
      setLoading(false);
    })();
  }, [token]);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    const r = await apiRequest("/api/dosen/assign-pa", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
    if (!r.success) {
      toast.error(r.message ?? "Gagal assign");
      return;
    }
    toast.success("Dosen PA berhasil ditetapkan");
    const m = await apiRequest<Mahasiswa[]>("/api/mahasiswa", { token });
    setMahasiswa(Array.isArray(m.data) ? m.data : []);
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pemetaan Dosen PA</h1>
        <p className="text-sm text-muted-foreground">
          Tetapkan dosen pembimbing akademik untuk mahasiswa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign</CardTitle>
          <CardDescription>Pilih mahasiswa dan dosen PA.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Mahasiswa</Label>
              <Select
                value={form.watch("mahasiswa_id") || undefined}
                onValueChange={(v) => form.setValue("mahasiswa_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mahasiswa" />
                </SelectTrigger>
                <SelectContent>
                  {mahasiswa.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nim} — {m.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dosen PA</Label>
              <Select
                value={form.watch("dosen_pa_id") || undefined}
                onValueChange={(v) => form.setValue("dosen_pa_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dosen" />
                </SelectTrigger>
                <SelectContent>
                  {dosen.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama} ({d.nidn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Simpan pemetaan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
