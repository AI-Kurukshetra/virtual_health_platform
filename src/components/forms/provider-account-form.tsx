"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createProviderAccountAction, type ActionState } from "@/app/org/[slug]/actions";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldHint,
  FieldInput,
  FieldLabel,
  FieldTextarea,
} from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

const initialState: ActionState = {
  error: null,
  success: null,
  invitationLink: null,
};

export function ProviderAccountForm({ organizationSlug }: { organizationSlug: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProviderAccountAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <FieldInput id="fullName" name="fullName" autoComplete="name" required />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldInput id="email" name="email" type="email" autoComplete="email" required />
        </FieldGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="password">Temporary password</FieldLabel>
          <FieldInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <FieldInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </FieldGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="specialty">Specialty</FieldLabel>
          <FieldInput id="specialty" name="specialty" />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="licenseNumber">License number</FieldLabel>
          <FieldInput id="licenseNumber" name="licenseNumber" />
        </FieldGroup>
      </div>
      <FieldGroup>
        <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
        <FieldInput id="timezone" name="timezone" defaultValue="America/New_York" required />
        <FieldHint>Use an IANA timezone such as `America/New_York` or `Asia/Kolkata`.</FieldHint>
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="bio">Bio</FieldLabel>
        <FieldTextarea id="bio" name="bio" rows={4} />
      </FieldGroup>
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating provider..." : "Create provider"}
      </Button>
    </form>
  );
}
