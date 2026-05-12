"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { RequireRole } from "@/components/auth/require-role";
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
import type { KrsSummary, Mahasiswa, MataKuliah } from "@/types/models";

const semesterAktif =
  process.env.NEXT_PUBLIC_SEMESTER_AKTIF ?? "2024/2025 Ganjil";
const maxSks = 24;

const schema = z.object({
  mata_kuliah_id: z
    .string()
    .min(1, "Pilih mata kuliah")
    .uuid("Pilih mata kuliah yang valid"),
});

type Form = z.infer<typeof schema>;

export default function KrsTambahPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const uid = user?.id as string | undefined;
  const [mhs, setMhs] = useState<Mahasiswa | null>(null);
  const [mkList, setMkList] = useState<MataKuliah[]>([]);
  const [summary, setSummary] = useState<KrsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { mata_kuliah_id: "" },
  });
  const selectedId = form.watch("mata_kuliah_id");

  useEffect(() => {
    if (!token || !uid) return;
    let c = false;
    (async () => {
      setLoading(true);
      const [mRes, kRes, sRes] = await Promise.all([
        apiRequest<Mahasiswa>(`/api/mahasiswa/${uid}`, { token }),
        apiRequest<MataKuliah[]>("/api/mata-kuliah", { token }),
        apiRequest<KrsSummary>(
          `/api/krs/summary/${uid}?semester_aktif=${encodeURIComponent(semesterAktif)}`,
          { token },
        ),
      ]);
      if (c) return;
      setMhs(mRes.data ?? null);
      setMkList(Array.isArray(kRes.data) ? kRes.data : []);
      setSummary(sRes.data ?? null);
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [token, uid]);

  const filteredMk = useMemo(() => {
    if (!mhs?.semester) return mkList;
    return mkList.filter((m) => m.semester == null || m.semester === mhs.semester);
  }, [mkList, mhs?.semester]);

  const selectedMk = filteredMk.find((m) => m.id === selectedId);
  const currentSks = summary?.total_sks_diajukan_disetujui ?? 0;
  const afterSks = currentSks + (selectedMk?.sks ?? 0);
  const overLimit = afterSks > maxSks;

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    if (overLimit) {
      toast.error(`Melebihi batas ${maxSks} SKS`);
      return;
    }
    const r = await apiRequest("/api/krs", {
      method: "POST",
      token,
      body: JSON.stringify({
        mata_kuliah_id: data.mata_kuliah_id,
        semester_aktif: semesterAktif,
      }),
    });
    if (!r.success) {
      toast.error(r.message ?? "Gagal mengajukan");
      return;
    }
    toast.success("KRS diajukan");
    router.push("/krs");
    router.refresh();
  });

  return (
    <RequireRole roles={["mahasiswa"]}>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pengajuan KRS</h1>
          <p className="text-sm text-muted-foreground">
            Semester kuliah aktif: {semesterAktif}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pilih mata kuliah</CardTitle>
            <CardDescription>
              Hanya MK yang sesuai semester akademik Anda ditampilkan. SKS saat
              ini: <strong>{currentSks}</strong> / {maxSks}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Mata kuliah</Label>
                  <Select
                    value={selectedId || undefined}
                    onValueChange={(v) => form.setValue("mata_kuliah_id", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih…" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMk.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.kode_mk} — {m.nama_mk} ({m.sks} SKS, kuota {m.kuota})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.mata_kuliah_id && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.mata_kuliah_id.message}
                    </p>
                  )}
                </div>

                {selectedMk && (
                  <div
                    className={`rounded-lg border p-4 text-sm ${
                      overLimit
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-border bg-muted/40"
                    }`}
                  >
                    <p>
                      Setelah mengambil MK ini:{" "}
                      <strong>
                        {afterSks} SKS
                      </strong>
                    </p>
                    {overLimit && (
                      <p className="mt-1 font-medium">
                        Melebihi batas {maxSks} SKS — pilih MK lain atau batalkan
                        pengajuan yang ada.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={form.formState.isSubmitting || overLimit || !selectedId}>
                    {form.formState.isSubmitting ? "Mengirim…" : "Ajukan"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/krs">Batal</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
