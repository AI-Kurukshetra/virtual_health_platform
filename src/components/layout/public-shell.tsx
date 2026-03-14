"use client";

import type { ReactNode } from "react";
import Link from "next/link";

const Icons = {
  Logo: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
};

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#eff0f1] to-[#cbd1d8] font-sans">
      <header className="absolute top-0 w-full z-50 py-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#1a1d2d]">
            <div className="flex items-center justify-center p-1.5 rounded-lg bg-indigo-600 text-white">
              <Icons.Logo />
            </div>
            Virtual Health Center
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login">
               <button className="bg-[#1a1d2d] text-white px-7 py-3 rounded-full text-sm font-semibold hover:bg-black transition-colors shadow-lg shadow-[#1a1d2d]/20 cursor-pointer">
                 Log In
               </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl px-4 pt-36 pb-0 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
