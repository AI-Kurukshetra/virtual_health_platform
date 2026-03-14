"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  FieldError,
  FieldGroup,
  FieldHint,
  FieldInput,
  FieldLabel,
  FieldSelect,
} from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

import { completeInvitationRegistration, type InviteRegisterState } from "./actions";

const initialState: InviteRegisterState = {
  error: null,
  fieldErrors: {},
};

export function InviteRegisterForm({
  token,
  invitedEmail,
  defaultFullName,
  organizationName,
}: {
  token: string;
  invitedEmail: string;
  defaultFullName: string;
  organizationName: string;
}) {
  const [state, formAction, isPending] = useActionState(completeInvitationRegistration, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <StateBanner>
        Invitation for <strong>{invitedEmail}</strong> to join <strong>{organizationName}</strong>.
      </StateBanner>

      <FieldGroup>
        <FieldLabel htmlFor="fullName">Full name *</FieldLabel>
        <FieldInput id="fullName" name="fullName" defaultValue={defaultFullName} required />
        {state.fieldErrors.fullName ? <FieldError>{state.fieldErrors.fullName}</FieldError> : null}
      </FieldGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="password">Password *</FieldLabel>
          <FieldInput id="password" name="password" type="password" autoComplete="new-password" required />
          <FieldHint>Use 8-72 characters.</FieldHint>
          {state.fieldErrors.password ? <FieldError>{state.fieldErrors.password}</FieldError> : null}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="confirmPassword">Confirm password *</FieldLabel>
          <FieldInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
          {state.fieldErrors.confirmPassword ? (
            <FieldError>{state.fieldErrors.confirmPassword}</FieldError>
          ) : null}
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
          <FieldInput id="dob" name="dob" type="date" />
          {state.fieldErrors.dob ? <FieldError>{state.fieldErrors.dob}</FieldError> : null}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="sex">Sex</FieldLabel>
          <FieldSelect id="sex" name="sex">
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </FieldSelect>
          {state.fieldErrors.sex ? <FieldError>{state.fieldErrors.sex}</FieldError> : null}
        </FieldGroup>
      </div>

      <FieldGroup>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <FieldInput id="phone" name="phone" type="tel" />
        {state.fieldErrors.phone ? <FieldError>{state.fieldErrors.phone}</FieldError> : null}
      </FieldGroup>

      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-sm text-sky-900">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="consentAccepted" defaultChecked />
          I accept telehealth consent and agree to receive virtual care.
        </label>
        {state.fieldErrors.consentAccepted ? (
          <FieldError>{state.fieldErrors.consentAccepted}</FieldError>
        ) : null}
      </div>

      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Completing registration..." : "Complete registration"}
      </Button>
    </form>
  );
}
