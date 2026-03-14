"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

// Minimal inline SVG icons for the sidebar
const Icons = {
  Logo: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
  ItemIcon: ({ label }: { label: string }) => {
    const l = label.toLowerCase();
    if (l.includes("dashboard")) return <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
    if (l.includes("patient")) return <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    if (l.includes("provider") || l.includes("doctor")) return <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/></svg>;
    if (l.includes("appointment")) return <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
    return <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
  }
};

export function AppShell({ orgName, roleLabel, navItems, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full bg-[#dfdce4] overflow-hidden font-sans">
      {/* Dark left sidebar */}
      <aside className="w-[260px] bg-[#1a1d2d] text-slate-300 flex flex-col h-full shrink-0 shadow-xl z-20">
        <div className="flex items-center gap-3 px-6 h-20 shrink-0 text-white mt-2">
          <div className="bg-indigo-500 rounded-lg p-1.5 shadow-lg shadow-indigo-500/20">
            <Icons.Logo />
          </div>
          <span className="text-xl font-bold tracking-wide">Virtual Health Center</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 mt-4">
          {navItems.map((item) => {
            // Check active state
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icons.ItemIcon label={item.label} />
                <span>{item.label}</span>
                {/* Arrow icon just for inactive items */}
                {!isActive && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 ml-auto opacity-50">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Optional footer branding or logout */}
        <div className="p-6 shrink-0 border-t border-white/5">
          <p className="text-xs uppercase tracking-widest text-[#4b5563] font-bold mb-2">{roleLabel.replace("_", " ")}</p>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
               {orgName.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{orgName}</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#dedfdf] bg-gradient-to-br from-[#e4e4e9] to-[#d8d8de]">
        {/* Top matching bar with background, user action area */}
        <header className="h-[88px] flex items-center justify-end px-8 shrink-0 relative z-10 scale-[0.98] origin-top mt-2">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl p-1 shadow-sm shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition border border-white overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-orange-100 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${orgName}`} alt="User Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <form action="/logout" method="post" className="ml-2">
              <button className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider py-2 cursor-pointer">
                Log Out
              </button>
            </form>
          </div>
        </header>

        {/* Zoomed out effect constraint using scale and padding */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <div className="w-full h-full transform scale-[0.93] origin-top mx-auto max-w-[1500px] transition-transform duration-300 relative">
            {children}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
