"use client";

import { useActionState } from "react";

import { saveProviderProfileAction, type ActionState } from "@/app/org/[slug]/actions";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldInput, FieldLabel, FieldTextarea } from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

const initialState: ActionState = {
  error: null,
  success: null,
};

type ProviderProfileFormProps = {
  organizationSlug: string;
  providerProfileId?: string;
  defaultValues?: {
    specialty?: string | null;
    licenseNumber?: string | null;
    timezone?: string | null;
    bio?: string | null;
  };
};

export function ProviderProfileForm({
  organizationSlug,
  providerProfileId,
  defaultValues,
}: ProviderProfileFormProps) {
  const [state, formAction, isPending] = useActionState(saveProviderProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      {providerProfileId ? <input type="hidden" name="providerProfileId" value={providerProfileId} /> : null}
      <FieldGroup>
        <FieldLabel htmlFor="specialty">Specialty</FieldLabel>
        <FieldInput id="specialty" name="specialty" defaultValue={defaultValues?.specialty ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="licenseNumber">License number</FieldLabel>
        <FieldInput
          id="licenseNumber"
          name="licenseNumber"
          defaultValue={defaultValues?.licenseNumber ?? ""}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
        <FieldInput id="timezone" name="timezone" defaultValue={defaultValues?.timezone ?? "UTC"} required />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="bio">Bio</FieldLabel>
        <FieldTextarea id="bio" name="bio" rows={4} defaultValue={defaultValues?.bio ?? ""} />
      </FieldGroup>
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save provider profile"}
      </Button>
    </form>
  );
}
