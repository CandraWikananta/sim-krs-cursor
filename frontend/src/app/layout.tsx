import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import { AppHeader } from "@/components/layout/app-header";
import { Providers } from "@/app/providers";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title:
    process.env.NEXT_PUBLIC_APP_NAME?.concat(" — KRS") ?? "Sistem KRS",
  description: "Kartu Rencana Studi — mahasiswa, dosen, dan admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={dmSans.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <AppHeader />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
