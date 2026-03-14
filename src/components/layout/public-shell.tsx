import type { ReactNode } from "react";
import Link from "next/link";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-amber-50">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-cyan-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-60 w-80 -translate-x-1/2 rounded-full bg-amber-300/30 blur-3xl" />

      <header className="relative border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-base font-semibold tracking-tight text-sky-950">
            Virtual Health Platform
          </Link>
          <nav className="flex items-center gap-3 text-sm text-sky-700">
            <Link href="/login" className="rounded-md px-2 py-1 transition hover:bg-sky-100 hover:text-sky-900">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
