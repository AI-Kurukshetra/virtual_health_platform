import type { AppRole } from "@/types/app";

export type NavItem = {
  href: string;
  label: string;
};

export function getRoleNavigation(role: AppRole, orgSlug: string): NavItem[] {
  const base = `/org/${orgSlug}`;

  if (role === "org_admin") {
    return [
      { href: `${base}/dashboard`, label: "Dashboard" },
      { href: `${base}/patients`, label: "Patients" },
      { href: `${base}/patients/new`, label: "Register patient" },
      { href: `${base}/providers`, label: "Providers" },
      { href: `${base}/providers/availability`, label: "Provider availability" },
      { href: `${base}/appointments`, label: "Appointments" },
    ];
  }

  if (role === "provider") {
    return [
      { href: `${base}/dashboard`, label: "Dashboard" },
      { href: `${base}/patients`, label: "Patients" },
      { href: `${base}/providers/profile`, label: "My profile" },
      { href: `${base}/providers/availability`, label: "Availability" },
      { href: `${base}/appointments`, label: "Appointments" },
    ];
  }

  if (role === "patient") {
    return [
      { href: `${base}/dashboard`, label: "Dashboard" },
      { href: `${base}/appointments/book`, label: "Book visit" },
      { href: `${base}/appointments`, label: "My appointments" },
      { href: `${base}/patients`, label: "My chart" },
    ];
  }

  return [{ href: `${base}/dashboard`, label: "Dashboard" }];
}
