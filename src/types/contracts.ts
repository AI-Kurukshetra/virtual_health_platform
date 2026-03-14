export type AppRole = "patient" | "provider" | "admin";

export type RouteGroup = "auth" | "patient" | "provider" | "admin" | "system";

export type ServiceOwner =
  | "auth"
  | "patients"
  | "appointments"
  | "medicalRecords"
  | "clinicalNotes"
  | "providerQueue"
  | "messages"
  | "consents"
  | "workflows"
  | "organizations"
  | "rbac"
  | "integrations"
  | "audit"
  | "apiGovernance"
  | "compliance";

export type ApiError = {
  code: string;
  message: string;
  field?: string;
};

export type ApiResponseEnvelope<TData, TMeta = Record<string, unknown>> = {
  data: TData | null;
  error: ApiError | null;
  meta?: TMeta;
};

export type NavigationItem = {
  label: string;
  href: string;
  group: RouteGroup;
};

export type DashboardNavigation = Record<AppRole, NavigationItem[]>;

export type PageTemplateType = "list" | "detail" | "form" | "audit";

export type PageTemplateDefinition = {
  type: PageTemplateType;
  requiredSections: string[];
};

export type RouteOwnership = {
  path: string;
  group: RouteGroup;
  owner: ServiceOwner;
  allowedRoles: AppRole[];
};
