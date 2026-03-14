import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export type AppNavigationItem = {
  href: string;
  label: string;
};

type AppShellProps = {
  orgName: string;
  roleLabel: string;
  navItems: AppNavigationItem[];
  children: ReactNode;
};

export function AppShell({ orgName, roleLabel, navItems, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-amber-50">
      <header className="border-b border-white/70 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-700">{roleLabel.replace("_", " ")}</p>
            <h1 className="text-lg font-semibold text-sky-950">{orgName}</h1>
          </div>
          <form action="/logout" method="post">
            <Button variant="secondary" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-lg shadow-sky-100/80 backdrop-blur">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Workspace Modules</p>
          <nav aria-label="Role navigation" className="space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl border border-transparent bg-sky-50/40 px-3 py-2 text-sm font-medium text-sky-900 transition hover:border-sky-200 hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
