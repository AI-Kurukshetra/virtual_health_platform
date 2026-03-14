import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/auth/resolve");
  }

  const verifyEmail = params.verify_email === "1";
  const resendFailed = params.resend_failed === "1";
  const prefilledEmail =
    typeof params.email === "string" && params.email.includes("@") ? params.email : null;

  const notice = verifyEmail
    ? resendFailed
      ? "Registration complete. We could not confirm email delivery, so please use 'Resend verification email' below before logging in."
      : "Registration complete. Please verify your email before logging in."
    : null;

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-[1000px] px-4 flex justify-center py-4 sm:py-10">
        <div className="w-full flex flex-col md:flex-row bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10 min-h-[650px] border border-white/60 relative z-10">

          {/* Left Column (Branding/Image) */}
          <div className="md:w-1/2 relative flex flex-col bg-slate-50 hidden md:flex border-r border-slate-100">
            <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center bg-[#f8f9fa]">
              <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-300/20 blur-[60px] rounded-full"></div>
              <div className="absolute bottom-20 right-10 w-64 h-64 bg-slate-300/30 blur-[60px] rounded-full"></div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="h-[120px] w-[120px] text-indigo-400/40">
                <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" /><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /><path d="m2 16 6 6" /><circle cx="16" cy="9" r="2.9" /><circle cx="6" cy="5" r="3" />
              </svg>
            </div>
            {/* Bottom blue banner */}
            <div className="bg-[#306bf3] p-10 text-white shrink-0 relative z-10">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="flex items-center justify-center rounded-full bg-white text-[#306bf3] p-1.5 w-8 h-8">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </div>
                  <span className="font-bold tracking-tight text-xl">Virtual Health Center</span>
                </div>
                <h2 className="text-2xl lg:text-[28px] font-semibold leading-snug mb-4">
                  Welcome to Virtual Health Center
                </h2>
                <p className="text-indigo-100 text-sm leading-relaxed max-w-sm font-medium">
                  Cloud based streamline management system with centralized user friendly platform
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Form) */}
          <div className="md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
            <div className="max-w-[360px] mx-auto w-full">
              <div className="flex items-center gap-2 mb-10 md:hidden">
                <div className="flex items-center justify-center p-1.5 rounded-lg bg-[#306bf3] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-[#1a1d2d]">Virtual Health Center</span>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#1a1d2d] mb-3 tracking-tight">Login</h1>
                <p className="text-sm font-medium text-slate-500">Enter your credentials to login to your account</p>
              </div>

              <LoginForm notice={notice} prefilledEmail={prefilledEmail} />
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
