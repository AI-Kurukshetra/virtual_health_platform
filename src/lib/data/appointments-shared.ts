import type { AppRole, AppointmentStatus } from "@/types/app";

export function getAppointmentStatusBadgeVariant(status: AppointmentStatus) {
  if (status === "completed") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  if (status === "in_progress" || status === "checked_in") {
    return "warning";
  }

  return "info";
}

export function formatAppointmentStatus(status: AppointmentStatus) {
  return status.replace("_", " ");
}

const patientTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["checked_in", "cancelled"],
  checked_in: ["cancelled"],
  in_progress: [],
  completed: [],
  cancelled: [],
};

const staffTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["checked_in", "in_progress", "cancelled"],
  checked_in: ["in_progress", "cancelled"],
  in_progress: [],
  completed: [],
  cancelled: [],
};

export function getAllowedAppointmentStatusTransitions(role: AppRole, status: AppointmentStatus) {
  if (role === "patient") {
    return patientTransitions[status];
  }

  return staffTransitions[status];
}

export function canEditSoapNote(role: AppRole, status: AppointmentStatus, noteSignedAt?: string | null) {
  if (role !== "org_admin" && role !== "provider") {
    return false;
  }

  if (noteSignedAt) {
    return false;
  }

  return status === "in_progress";
}
