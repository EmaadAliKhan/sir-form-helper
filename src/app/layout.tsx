import type { Metadata, Viewport } from "next";
import { NavBar } from "@/components/NavBar";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "SIR Enumeration Form",
  description: "Self-enumeration form assistant for Sanathnagar voters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        <AuthProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
