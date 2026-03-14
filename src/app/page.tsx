import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
   const supabase = await createClient();
   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (user) {
      redirect("/auth/resolve");
   }

   return (
      <PublicShell>
         <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl lg:text-[70px] font-bold tracking-tight text-[#1a1d2d] leading-[1.1] max-w-4xl mx-auto">
               Transform <span className="text-indigo-600">Healthcare</span> Efficiency with Cutting-Edge Technology
            </h1>
            <p className="mt-7 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
               Manage patients, staff, finances, and more with our comprehensive, user-friendly system.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
               <Link href="/login">
                  <div className="flex items-center gap-2 bg-[#1a1d2d] text-white pl-7 pr-2.5 py-2.5 rounded-full hover:bg-black transition-colors cursor-pointer group shadow-xl shadow-[#1a1d2d]/20">
                     <span className="text-[15px] font-semibold mr-2">Get Started</span>
                     <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                           <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                     </div>
                  </div>
               </Link>
               
            </div>

            {/* Dashboard mock element */}
            <div className="mt-20 w-full max-w-[1050px] mx-auto relative perspective-[2000px]">
               {/* Background glow behind browser frame */}
               <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-indigo-300/40 blur-[80px] rounded-full pointer-events-none" />

               {/* Browser window frame */}
               <div className="relative rounded-t-3xl border border-white bg-white/30 p-2 sm:p-4 backdrop-blur-2xl shadow-2xl">
                  <div className="rounded-2xl overflow-hidden bg-[#e9e9ee] shadow-inner aspect-[16/10] sm:aspect-[16/11] relative flex flex-col border border-white/60">

                     {/* Browser topbar */}
                     <div className="h-12 border-b border-black/5 flex items-center px-4 gap-4 bg-white/70 shrink-0">
                        <div className="flex gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                           <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                           <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                        </div>
                        <div className="mx-auto flex w-64 h-7 bg-white/80 rounded-full items-center justify-center text-[11px] text-slate-400 font-semibold shadow-sm">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1.5 opacity-60"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                           https://virtualhealthplatform.vercel.app/
                        </div>
                        <div className="w-12"></div>
                     </div>

                     <div className="flex-1 flex p-4 sm:p-6 gap-4 sm:gap-6 overflow-hidden relative">
                        {/* Left Sidebar mock */}
                        <div className="w-24 sm:w-48 rounded-2xl bg-white shadow-sm shrink-0 flex flex-col p-3 sm:p-5 space-y-4">
                           {/* Logo Mock */}
                           <div className="flex items-center gap-2 mb-4">
                              <div className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-indigo-600 text-white w-7 h-7 sm:w-9 sm:h-9">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                 </svg>
                              </div>
                              <div className="h-4 w-16 bg-slate-200 rounded hidden sm:block"></div>
                           </div>

                           {/* Menu items mock */}
                           <div className="w-full h-8 sm:h-11 bg-[#1a1d2d] rounded-xl"></div>
                           <div className="w-full h-8 sm:h-11 bg-slate-100 rounded-xl"></div>
                           <div className="w-full h-8 sm:h-11 bg-slate-100 rounded-xl"></div>
                           <div className="w-full h-8 sm:h-11 bg-slate-100 rounded-xl"></div>
                           <div className="w-full h-8 sm:h-11 bg-slate-100 rounded-xl hidden sm:block"></div>
                           <div className="w-full h-8 sm:h-11 bg-slate-100 rounded-xl hidden sm:block"></div>
                        </div>

                        {/* Main content area mock */}
                        <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                           {/* Top bar mock */}
                           <div className="h-10 sm:h-12 w-full flex items-center justify-between pointer-events-none">
                              <div className="w-32 sm:w-64 h-full bg-white shadow-sm rounded-xl"></div>
                              <div className="flex gap-2 sm:gap-3">
                                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm"></div>
                                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm"></div>
                                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl shadow-sm hidden sm:block"></div>
                              </div>
                           </div>

                           {/* Top Stats */}
                           <div className="flex gap-3 sm:gap-5">
                              <div className="h-20 sm:h-28 flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5 flex flex-col justify-between">
                                 <div className="w-12 sm:w-20 h-2 sm:h-3 bg-slate-100 rounded"></div>
                                 <div className="flex justify-between items-end">
                                    <div className="w-10 sm:w-16 h-4 sm:h-6 bg-[#1a1d2d] rounded"></div>
                                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-indigo-50 rounded-full flex items-center justify-center hidden sm:flex">
                                       <div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 rounded-md"></div>
                                    </div>
                                 </div>
                              </div>
                              <div className="h-20 sm:h-28 flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5 flex flex-col justify-between">
                                 <div className="w-12 sm:w-20 h-2 sm:h-3 bg-slate-100 rounded"></div>
                                 <div className="flex justify-between items-end">
                                    <div className="w-10 sm:w-16 h-4 sm:h-6 bg-[#1a1d2d] rounded"></div>
                                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-emerald-50 rounded-full flex items-center justify-center hidden sm:flex">
                                       <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-md"></div>
                                    </div>
                                 </div>
                              </div>
                              <div className="h-20 sm:h-28 flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5 flex flex-col justify-between">
                                 <div className="w-12 sm:w-20 h-2 sm:h-3 bg-slate-100 rounded"></div>
                                 <div className="flex justify-between items-end">
                                    <div className="w-10 sm:w-16 h-4 sm:h-6 bg-[#1a1d2d] rounded"></div>
                                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-purple-50 rounded-full flex items-center justify-center hidden sm:flex">
                                       <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-md"></div>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Graph Area / Table mockup */}
                           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col gap-4">
                              <div className="w-24 sm:w-32 h-3 sm:h-4 bg-slate-100 rounded"></div>
                              <div className="flex-1 flex items-end gap-1.5 sm:gap-2 sm:pb-2">
                                 {/* bars */}
                                 {[40, 70, 45, 90, 60, 85, 55, 100, 75, 50, 80, 45, 60, 95].map((h, i) => (
                                    <div key={i} className={`flex-1 rounded-t-sm sm:rounded-t-md ${i % 2 === 0 ? 'bg-indigo-300' : 'bg-indigo-500'}`} style={{ height: `${h}%` }}></div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Fade the bottom so it blends smoothly */}
                     <div className="absolute -bottom-10 left-0 right-0 h-40 bg-gradient-to-t from-[#eff0f1] to-transparent pointer-events-none" />
                  </div>
               </div>
            </div>
         </div>
      </PublicShell>
   );
}
