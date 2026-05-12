"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";

export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/mahasiswa");
  }, [router]);
  return (
    <div className="flex justify-center py-16">
      <Skeleton className="h-10 w-48" />
    </div>
  );
}
