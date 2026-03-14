"use client";

import { useActionState } from "react";

import { createPatientIntakeAction, type ActionState } from "@/app/org/[slug]/actions";
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
};

type ProviderOption = {
  profileId: string;
  label: string;
};

export function PatientIntakeForm({
  organizationSlug,
  providerOptions,
}: {
  organizationSlug: string;
  providerOptions: ProviderOption[];
}) {
  const [state, formAction, isPending] = useActionState(createPatientIntakeAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      <FieldGroup>
        <FieldLabel htmlFor="fullName">Full name</FieldLabel>
        <FieldInput id="fullName" name="fullName" required />
      </FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
          <FieldInput id="dob" name="dob" type="date" />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="sex">Sex</FieldLabel>
          <FieldSelect id="sex" name="sex">
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </FieldSelect>
        </FieldGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <FieldInput id="phone" name="phone" type="tel" />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldInput id="email" name="email" type="email" />
        </FieldGroup>
      </div>
      <FieldGroup>
        <FieldLabel htmlFor="providerProfileId">Assign provider (optional)</FieldLabel>
        <FieldSelect id="providerProfileId" name="providerProfileId">
          <option value="">Assign later</option>
          {providerOptions.map((provider) => (
            <option key={provider.profileId} value={provider.profileId}>
              {provider.label}
            </option>
          ))}
        </FieldSelect>
        <FieldHint>
          Optional provider assignment for continuity. Leave empty to assign later during booking.
        </FieldHint>
      </FieldGroup>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="intakeCompleted" defaultChecked />
          Mark intake as completed
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="consentAccepted" defaultChecked />
          Telehealth consent accepted
        </label>
        <FieldHint>Consent acceptance is stored in the patient and consents records.</FieldHint>
      </div>
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save intake"}
      </Button>
    </form>
  );
}
