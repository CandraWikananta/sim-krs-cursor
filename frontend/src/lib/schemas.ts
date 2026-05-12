import { z } from "zod";

export const loginMahasiswaDosenSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Minimal 8 karakter"),
});

export const loginAdminSchema = z.object({
  username: z.string().min(1, "Username wajib"),
  password: z.string().min(8, "Minimal 8 karakter"),
});

export const registerMahasiswaSchema = z
  .object({
    nim: z.string().min(1, "NIM wajib").max(20),
    nama: z.string().min(1, "Nama wajib").max(100),
    email: z.string().email(),
    password: z.string().min(8, "Minimal 8 karakter"),
    confirm: z.string(),
    semester: z.coerce.number().min(1).max(20),
    jurusan: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Password tidak sama",
    path: ["confirm"],
  });

export const profilMahasiswaSchema = z.object({
  nama: z.string().min(1).max(100),
  email: z.string().email(),
  jurusan: z.string().optional(),
});

export const profilDosenSchema = z.object({
  nama: z.string().min(1).max(100),
  email: z.string().email(),
  bidang_keahlian: z.string().optional(),
  password: z.string().optional(),
}).refine(
  (d) => !d.password || d.password.length >= 8,
  { message: "Minimal 8 karakter", path: ["password"] },
);
