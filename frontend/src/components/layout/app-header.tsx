"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/models";
import { getBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Sistem KRS";

type NavItem = { href: string; label: string; icon: ReactNode };

function navForRole(role: Role | null): NavItem[] {
  if (role === "mahasiswa") {
    return [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/krs", label: "KRS Saya", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/krs/tambah", label: "Tambah KRS", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/profil", label: "Profil", icon: <User className="h-4 w-4" /> },
    ];
  }
  if (role === "dosen") {
    return [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/mahasiswa-bimbingan", label: "Mahasiswa", icon: <GraduationCap className="h-4 w-4" /> },
      { href: "/krs-approval", label: "Approval KRS", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/profil", label: "Profil", icon: <User className="h-4 w-4" /> },
    ];
  }
  if (role === "admin") {
    return [
      { href: "/admin/mahasiswa", label: "Mahasiswa", icon: <GraduationCap className="h-4 w-4" /> },
      { href: "/admin/dosen", label: "Dosen", icon: <User className="h-4 w-4" /> },
      { href: "/admin/mata-kuliah", label: "Mata Kuliah", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/admin/assign-pa", label: "Assign PA", icon: <LayoutDashboard className="h-4 w-4" /> },
    ];
  }
  return [];
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, role, logout } = useAuthStore();
  const items = navForRole(role);

  const handleLogout = async () => {
    try {
      await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: "POST",
      });
    } catch {
      /* ignore */
    }
    logout();
    router.push("/login");
    router.refresh();
  };

  if (!token || pathname === "/login" || pathname === "/register") {
    return (
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <GraduationCap className="h-7 w-7 text-primary" />
            {appName}
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Daftar Mahasiswa</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={role === "admin" ? "/admin/mahasiswa" : "/dashboard"} className="flex shrink-0 items-center gap-2 font-semibold">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="hidden sm:inline">{appName}</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 md:hidden">
              {items.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <User className="h-4 w-4" />
                <span className="max-w-[120px] truncate text-left text-sm">
                  {(user?.nama as string) ?? "Akun"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {role}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
