import type { DashboardNavigation, PageTemplateDefinition, RouteOwnership } from "@/types/contracts";

export const ROUTE_OWNERSHIP: RouteOwnership[] = [
  { path: "/login", group: "auth", owner: "auth", allowedRoles: ["patient", "provider", "admin"] },
  { path: "/signup", group: "auth", owner: "auth", allowedRoles: ["patient", "provider", "admin"] },

  { path: "/patient", group: "patient", owner: "patients", allowedRoles: ["patient"] },
  { path: "/patient/onboarding", group: "patient", owner: "patients", allowedRoles: ["patient"] },
  { path: "/patient/appointments", group: "patient", owner: "appointments", allowedRoles: ["patient"] },
  {
    path: "/patient/appointments/[appointmentId]",
    group: "patient",
    owner: "appointments",
    allowedRoles: ["patient"],
  },
  { path: "/patient/records", group: "patient", owner: "medicalRecords", allowedRoles: ["patient"] },
  { path: "/patient/messages", group: "patient", owner: "messages", allowedRoles: ["patient"] },
  { path: "/patient/consents", group: "patient", owner: "consents", allowedRoles: ["patient"] },

  { path: "/provider", group: "provider", owner: "providerQueue", allowedRoles: ["provider"] },
  { path: "/provider/queue", group: "provider", owner: "providerQueue", allowedRoles: ["provider"] },
  { path: "/provider/schedule", group: "provider", owner: "appointments", allowedRoles: ["provider"] },
  {
    path: "/provider/appointments/[appointmentId]",
    group: "provider",
    owner: "appointments",
    allowedRoles: ["provider"],
  },
  {
    path: "/provider/patients/[patientId]",
    group: "provider",
    owner: "patients",
    allowedRoles: ["provider"],
  },
  {
    path: "/provider/patients/[patientId]/notes",
    group: "provider",
    owner: "clinicalNotes",
    allowedRoles: ["provider"],
  },
  { path: "/provider/workflows", group: "provider", owner: "workflows", allowedRoles: ["provider"] },

  { path: "/admin", group: "admin", owner: "organizations", allowedRoles: ["admin"] },
  { path: "/admin/organizations", group: "admin", owner: "organizations", allowedRoles: ["admin"] },
  { path: "/admin/rbac", group: "admin", owner: "rbac", allowedRoles: ["admin"] },
  { path: "/admin/integrations", group: "admin", owner: "integrations", allowedRoles: ["admin"] },
  {
    path: "/admin/compliance/audit-logs",
    group: "admin",
    owner: "audit",
    allowedRoles: ["admin"],
  },
  {
    path: "/admin/compliance/policy-health",
    group: "admin",
    owner: "compliance",
    allowedRoles: ["admin"],
  },
  {
    path: "/admin/developer/api-usage",
    group: "admin",
    owner: "apiGovernance",
    allowedRoles: ["admin"],
  },
];

export const DASHBOARD_NAVIGATION: DashboardNavigation = {
  patient: [
    { label: "Dashboard", href: "/patient", group: "patient" },
    { label: "Onboarding", href: "/patient/onboarding", group: "patient" },
    { label: "Appointments", href: "/patient/appointments", group: "patient" },
    { label: "Records", href: "/patient/records", group: "patient" },
    { label: "Messages", href: "/patient/messages", group: "patient" },
    { label: "Consents", href: "/patient/consents", group: "patient" },
  ],
  provider: [
    { label: "Dashboard", href: "/provider", group: "provider" },
    { label: "Queue", href: "/provider/queue", group: "provider" },
    { label: "Schedule", href: "/provider/schedule", group: "provider" },
    { label: "Workflows", href: "/provider/workflows", group: "provider" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", group: "admin" },
    { label: "Organizations", href: "/admin/organizations", group: "admin" },
    { label: "RBAC", href: "/admin/rbac", group: "admin" },
    { label: "Integrations", href: "/admin/integrations", group: "admin" },
    { label: "Compliance", href: "/admin/compliance/audit-logs", group: "admin" },
    { label: "API Usage", href: "/admin/developer/api-usage", group: "admin" },
  ],
};

export const PAGE_TEMPLATE_LOCKS: PageTemplateDefinition[] = [
  {
    type: "list",
    requiredSections: ["header", "filters", "result-table-or-cards", "pagination", "states"],
  },
  {
    type: "detail",
    requiredSections: ["header", "primary-details", "related-artifacts", "actions", "states"],
  },
  {
    type: "form",
    requiredSections: ["header", "sections", "inline-validation", "submit-footer", "states"],
  },
  {
    type: "audit",
    requiredSections: ["header", "filters", "event-table", "event-drawer", "export"],
  },
];
