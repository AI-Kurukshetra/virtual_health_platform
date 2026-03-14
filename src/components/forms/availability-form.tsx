"use client";

import { useActionState } from "react";

import { addAvailabilityAction, type ActionState } from "@/app/org/[slug]/actions";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldInput, FieldLabel, FieldSelect } from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

const initialState: ActionState = {
  error: null,
  success: null,
};

export function AvailabilityForm({
  organizationSlug,
  providerId,
}: {
  organizationSlug: string;
  providerId?: string;
}) {
  const [state, formAction, isPending] = useActionState(addAvailabilityAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-5">
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      {providerId ? <input type="hidden" name="providerId" value={providerId} /> : null}
      <FieldGroup>
        <FieldLabel htmlFor="dayOfWeek">Day</FieldLabel>
        <FieldSelect id="dayOfWeek" name="dayOfWeek" defaultValue="1">
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
        </FieldSelect>
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="startTime">Start</FieldLabel>
        <FieldInput id="startTime" name="startTime" type="time" defaultValue="09:00" required />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="endTime">End</FieldLabel>
        <FieldInput id="endTime" name="endTime" type="time" defaultValue="12:00" required />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="slotMinutes">Slot (mins)</FieldLabel>
        <FieldInput id="slotMinutes" name="slotMinutes" type="number" min={15} max={120} defaultValue={30} required />
      </FieldGroup>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Adding..." : "Add"}
        </Button>
      </div>
      {state.error ? (
        <StateBanner className="sm:col-span-5" variant="error">
          {state.error}
        </StateBanner>
      ) : null}
      {state.success ? <StateBanner className="sm:col-span-5">{state.success}</StateBanner> : null}
    </form>
  );
}
