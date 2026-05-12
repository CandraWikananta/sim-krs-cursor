"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/models";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, role } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!role || !roles.includes(role)) {
      if (role === "admin") router.replace("/admin/mahasiswa");
      else router.replace("/dashboard");
    }
  }, [mounted, token, role, roles, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-40" />
      </div>
    );
  }

  if (!token || !role || !roles.includes(role)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-10 w-64" />
      </div>
    );
  }

  return <>{children}</>;
}
