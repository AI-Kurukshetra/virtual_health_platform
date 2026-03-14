export type AppRole = "platform_admin" | "org_admin" | "provider" | "patient";

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled";

export type EncounterStatus = "open" | "closed";

export type TenantMembership = {
  id: string;
  organization_id: string;
  profile_id: string;
  role: AppRole;
  status: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
};

export type TenantContext = {
  profileId: string;
  profileName: string;
  email: string;
  role: AppRole;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
};
