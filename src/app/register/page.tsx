import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/auth/resolve");
  }

  // Fetch organizations using service role (public page, no user session).
  // Support both schema variants used across environments.
  const admin = createServiceRoleClient();
  const { data: activeOrganizations, error: activeOrganizationsError } = await admin
    .from("organizations")
    .select("id, name, status")
    .eq("status", "active")
    .order("name");

  let organizations = (activeOrganizations ?? []).map((org) => ({
    id: org.id,
    name: org.name,
  }));

  let organizationsLoadError = activeOrganizationsError?.message ?? null;

  if (!organizations.length) {
    const { data: fallbackOrganizations, error: fallbackOrganizationsError } = await admin
      .from("organizations")
      .select("id, name, status")
      .order("name");

    organizations = (fallbackOrganizations ?? [])
      .filter((org) => !("status" in org) || org.status !== "inactive")
      .map((org) => ({ id: org.id, name: org.name }));

    if (fallbackOrganizationsError) {
      organizationsLoadError = fallbackOrganizationsError.message;
    }
  }

  if (!organizations.length) {
    const { data: legacyOrganizations, error: legacyOrganizationsError } = await admin
      .from("Organizations")
      .select("id, name")
      .order("name");

    organizations = (legacyOrganizations ?? []).map((org) => ({
      id: org.id,
      name: org.name,
    }));

    if (legacyOrganizationsError) {
      organizationsLoadError = legacyOrganizationsError.message;
    }
  }

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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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
                  Join Virtual Health Center<br />Patient Registration
                </h2>
                <p className="text-indigo-100 text-sm leading-relaxed max-w-sm font-medium">
                  Register to securely manage your virtual appointments, view your chart, and join video visits smoothly.
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
                <h1 className="text-3xl font-bold text-[#1a1d2d] mb-3 tracking-tight">Sign Up</h1>
                <p className="text-sm font-medium text-slate-500">Create a patient account to begin.</p>
              </div>

              <RegisterForm organizations={organizations} organizationsLoadError={organizationsLoadError} />

              <p className="mt-8 text-sm font-semibold text-slate-500 pt-6 border-t border-slate-100">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[#306bf3] hover:text-[#1a1d2d] transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
