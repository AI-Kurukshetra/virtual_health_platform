"use client";

import { useActionState } from "react";

import { saveSoapNoteAction, type ActionState } from "@/app/org/[slug]/actions";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLabel, FieldTextarea } from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

const initialState: ActionState = {
  error: null,
  success: null,
};

export function SoapNoteForm({
  organizationSlug,
  appointmentId,
  defaultValues,
}: {
  organizationSlug: string;
  appointmentId: string;
  defaultValues?: {
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(saveSoapNoteAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <FieldGroup>
        <FieldLabel htmlFor="subjective">Subjective</FieldLabel>
        <FieldTextarea
          id="subjective"
          name="subjective"
          rows={4}
          required
          defaultValue={defaultValues?.subjective ?? ""}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="objective">Objective</FieldLabel>
        <FieldTextarea
          id="objective"
          name="objective"
          rows={4}
          required
          defaultValue={defaultValues?.objective ?? ""}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="assessment">Assessment</FieldLabel>
        <FieldTextarea
          id="assessment"
          name="assessment"
          rows={4}
          required
          defaultValue={defaultValues?.assessment ?? ""}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="plan">Plan</FieldLabel>
        <FieldTextarea id="plan" name="plan" rows={4} required defaultValue={defaultValues?.plan ?? ""} />
      </FieldGroup>
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing..." : "Sign and save SOAP note"}
      </Button>
    </form>
  );
}
