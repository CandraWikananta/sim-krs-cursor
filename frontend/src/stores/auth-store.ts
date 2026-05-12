"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role } from "@/types/models";

export type AuthUser = Record<string, unknown> & {
  id?: string;
  nama?: string;
  email?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  role: Role | null;
  setAuth: (token: string, user: AuthUser, role: Role) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      setAuth: (token, user, role) => set({ token, user, role }),
      logout: () => set({ token: null, user: null, role: null }),
    }),
    { name: "sim-krs-auth" },
  ),
);
