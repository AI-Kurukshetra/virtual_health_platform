"use client";

import { useActionState } from "react";

import { bookAppointmentAction, type ActionState } from "@/app/org/[slug]/actions";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldInput, FieldLabel } from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

const initialState: ActionState = {
  error: null,
  success: null,
};

export function AppointmentBookingForm({
  organizationSlug,
  providerId,
  scheduledStart,
  scheduledEnd,
  meetingUrl,
}: {
  organizationSlug: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  meetingUrl?: string;
}) {
  const [state, formAction, isPending] = useActionState(bookAppointmentAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="scheduledStart" value={scheduledStart} />
      <input type="hidden" name="scheduledEnd" value={scheduledEnd} />
      {meetingUrl ? <input type="hidden" name="meetingUrl" value={meetingUrl} /> : null}
      <FieldGroup>
        <FieldLabel htmlFor={`reason-${scheduledStart}`}>Reason (optional)</FieldLabel>
        <FieldInput id={`reason-${scheduledStart}`} name="reason" placeholder="Brief reason for visit" />
      </FieldGroup>
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Booking..." : "Book this slot"}
      </Button>
    </form>
  );
}
