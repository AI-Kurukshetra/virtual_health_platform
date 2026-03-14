"use client";

import { useActionState } from "react";

import { invitePatientAction, type ActionState } from "@/app/org/[slug]/actions";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldHint,
  FieldInput,
  FieldLabel,
  FieldSelect,
} from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

const initialState: ActionState = {
  error: null,
  success: null,
  invitationLink: null,
};

type ProviderOption = {
  profileId: string;
  label: string;
};

export function PatientInviteForm({
  organizationSlug,
  providerOptions,
}: {
  organizationSlug: string;
  providerOptions: ProviderOption[];
}) {
  const [state, formAction, isPending] = useActionState(invitePatientAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      <FieldGroup>
        <FieldLabel htmlFor="inviteEmail">Patient email</FieldLabel>
        <FieldInput id="inviteEmail" name="email" type="email" required />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="inviteFullName">Patient full name (optional)</FieldLabel>
        <FieldInput id="inviteFullName" name="fullName" />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="inviteProviderProfileId">Preferred provider (optional)</FieldLabel>
        <FieldSelect id="inviteProviderProfileId" name="providerProfileId">
          <option value="">Assign later</option>
          {providerOptions.map((provider) => (
            <option key={provider.profileId} value={provider.profileId}>
              {provider.label}
            </option>
          ))}
        </FieldSelect>
        <FieldHint>
          If selected, the provider relationship is preserved when the patient completes registration.
        </FieldHint>
      </FieldGroup>
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
      {state.invitationLink ? (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
          <p className="font-medium">Invitation link</p>
          <p className="mt-1 break-all">{state.invitationLink}</p>
          <p className="mt-1 text-xs text-cyan-800/80">
            Keep this secure. Share manually only if email delivery fails.
          </p>
        </div>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending invitation..." : "Send patient invitation"}
      </Button>
    </form>
  );
}
