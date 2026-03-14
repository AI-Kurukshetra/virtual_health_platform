"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldHint,
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldError,
} from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

import { signUpPatient, type RegisterState } from "./actions";

const initialState: RegisterState = { error: null, fieldErrors: {} };

type Organization = {
  id: string;
  name: string;
};

export function RegisterForm({
  organizations,
  organizationsLoadError,
}: {
  organizations: Organization[];
  organizationsLoadError?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(signUpPatient, initialState);
  const hasOrganizations = organizations.length > 0;
  const formError = state.error && Object.keys(state.fieldErrors).length === 0 ? state.error : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {!hasOrganizations ? (
        <StateBanner variant="error" role="alert" aria-live="polite">
          No organizations are currently available for registration.
          {organizationsLoadError ? ` Details: ${organizationsLoadError}` : ""}
        </StateBanner>
      ) : null}

      {/* Account credentials */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-800">Account details</legend>
        <FieldGroup>
          <FieldLabel htmlFor="fullName">Full name *</FieldLabel>
          <FieldInput
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            aria-invalid={Boolean(state.fieldErrors.fullName)}
            aria-describedby={state.fieldErrors.fullName ? "fullName-error" : undefined}
          />
          {state.fieldErrors.fullName ? (
            <FieldError id="fullName-error" role="alert">
              {state.fieldErrors.fullName}
            </FieldError>
          ) : null}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="email">Email *</FieldLabel>
          <FieldInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={254}
            aria-invalid={Boolean(state.fieldErrors.email)}
            aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
          />
          {state.fieldErrors.email ? (
            <FieldError id="email-error" role="alert">
              {state.fieldErrors.email}
            </FieldError>
          ) : null}
        </FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="password">Password *</FieldLabel>
            <FieldInput
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              aria-invalid={Boolean(state.fieldErrors.password)}
              aria-describedby={state.fieldErrors.password ? "password-error" : "password-hint"}
            />
            <FieldHint id="password-hint">Use 8-72 characters.</FieldHint>
            {state.fieldErrors.password ? (
              <FieldError id="password-error" role="alert">
                {state.fieldErrors.password}
              </FieldError>
            ) : null}
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="confirmPassword">Confirm password *</FieldLabel>
            <FieldInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              aria-invalid={Boolean(state.fieldErrors.confirmPassword)}
              aria-describedby={state.fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
            />
            {state.fieldErrors.confirmPassword ? (
              <FieldError id="confirmPassword-error" role="alert">
                {state.fieldErrors.confirmPassword}
              </FieldError>
            ) : null}
          </FieldGroup>
        </div>
      </fieldset>

      {/* Patient information */}
      <fieldset className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <legend className="text-sm font-semibold text-slate-800">Patient information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
            <FieldInput
              id="dob"
              name="dob"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              aria-invalid={Boolean(state.fieldErrors.dob)}
              aria-describedby={state.fieldErrors.dob ? "dob-error" : undefined}
            />
            {state.fieldErrors.dob ? (
              <FieldError id="dob-error" role="alert">
                {state.fieldErrors.dob}
              </FieldError>
            ) : null}
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="sex">Sex</FieldLabel>
            <FieldSelect
              id="sex"
              name="sex"
              aria-invalid={Boolean(state.fieldErrors.sex)}
              aria-describedby={state.fieldErrors.sex ? "sex-error" : undefined}
            >
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </FieldSelect>
            {state.fieldErrors.sex ? (
              <FieldError id="sex-error" role="alert">
                {state.fieldErrors.sex}
              </FieldError>
            ) : null}
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <FieldInput
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={20}
            aria-invalid={Boolean(state.fieldErrors.phone)}
            aria-describedby={state.fieldErrors.phone ? "phone-error" : undefined}
          />
          {state.fieldErrors.phone ? (
            <FieldError id="phone-error" role="alert">
              {state.fieldErrors.phone}
            </FieldError>
          ) : null}
        </FieldGroup>
      </fieldset>

      {/* Organization selection */}
      <FieldGroup>
        <FieldLabel htmlFor="organizationId">Organization *</FieldLabel>
        <FieldSelect id="organizationId" name="organizationId" required disabled={!hasOrganizations}>
          <option value="">Select a clinic</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </FieldSelect>
        <FieldHint>
          {hasOrganizations
            ? "Choose the clinic you want to register with."
            : "Ask an org admin to create/activate an organization first."}
        </FieldHint>
        {state.fieldErrors.organizationId ? (
          <FieldError>{state.fieldErrors.organizationId}</FieldError>
        ) : null}
      </FieldGroup>

      {/* Consent */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="consentAccepted"
            defaultChecked
            aria-invalid={Boolean(state.fieldErrors.consentAccepted)}
            aria-describedby={state.fieldErrors.consentAccepted ? "consent-error" : undefined}
          />
          I accept the telehealth consent and agree to receive virtual care.
        </label>
        <FieldHint>Consent is stored in your patient record and the consents table.</FieldHint>
        {state.fieldErrors.consentAccepted ? (
          <FieldError id="consent-error" role="alert">
            {state.fieldErrors.consentAccepted}
          </FieldError>
        ) : null}
      </div>

      {formError ? (
        <StateBanner variant="error" role="alert" aria-live="polite">
          {formError}
        </StateBanner>
      ) : null}
      <Button className="w-full" type="submit" disabled={isPending || !hasOrganizations}>
        {isPending ? "Creating account..." : "Create patient account"}
      </Button>
    </form>
  );
}
