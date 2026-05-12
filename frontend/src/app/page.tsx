import Link from "next/link";
import { ArrowRight, BookOpen, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const uni = process.env.NEXT_PUBLIC_APP_UNIVERSITY ?? "Kampus Anda";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 md:p-12">
        <p className="text-sm font-medium text-primary">{uni}</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Kelola KRS secara terpusat, aman, dan transparan.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Mahasiswa mengajukan mata kuliah, dosen PA menyetujui, dan admin
          mengatur data akademik — dengan validasi SKS dan kuota otomatis.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Masuk ke akun
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Daftar mahasiswa baru</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary" />
            <CardTitle>Mahasiswa</CardTitle>
            <CardDescription>
              Ajukan KRS, pantau status persetujuan, dan kelola profil.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 text-accent" />
            <CardTitle>Dosen PA</CardTitle>
            <CardDescription>
              Setujui atau tolak pengajuan KRS mahasiswa bimbingan Anda.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle>Admin</CardTitle>
            <CardDescription>
              CRUD mahasiswa, dosen, mata kuliah, dan pemetaan dosen PA.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
