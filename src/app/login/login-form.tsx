"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldHint, FieldInput, FieldLabel } from "@/components/ui/form-field";
import { StateBanner } from "@/components/ui/state-banner";

import {
  resendVerificationEmail,
  signInWithPassword,
  type LoginState,
  type ResendVerificationState,
} from "./actions";

const initialLoginState: LoginState = { error: null };
const initialResendState: ResendVerificationState = { error: null, success: null };

type LoginFormProps = {
  notice?: string | null;
  prefilledEmail?: string | null;
};

export function LoginForm({ notice, prefilledEmail }: LoginFormProps) {
  const [email, setEmail] = useState(prefilledEmail ?? "");
  const [loginState, loginAction, isLoginPending] = useActionState(signInWithPassword, initialLoginState);
  const [resendState, resendAction, isResendPending] = useActionState(
    resendVerificationEmail,
    initialResendState,
  );

  const resendEmail = useMemo(
    () => loginState.submittedEmail?.trim() || email.trim(),
    [email, loginState.submittedEmail],
  );

  return (
    <div className="space-y-4">
      {notice ? (
        <StateBanner variant="info" role="status" aria-live="polite">
          {notice}
        </StateBanner>
      ) : null}

      <form action={loginAction} className="space-y-4" noValidate>
        <FieldGroup>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <FieldInput id="password" name="password" type="password" autoComplete="current-password" required />
          <FieldHint>Enter the password you used during registration.</FieldHint>
        </FieldGroup>
        {loginState.error ? (
          <StateBanner variant="error" role="alert" aria-live="polite">
            {loginState.error}
          </StateBanner>
        ) : null}
        <Button className="w-full" type="submit" disabled={isLoginPending}>
          {isLoginPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {loginState.requiresEmailVerification ? (
        <form action={resendAction} className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3">
          <input type="hidden" name="email" value={resendEmail} />
          <p className="text-sm text-sky-900">
            Didn&apos;t receive your verification email?
            <span className="ml-1 font-medium">Resend to {resendEmail || "your email"}.</span>
          </p>
          {resendState.error ? (
            <StateBanner variant="error" role="alert" aria-live="polite">
              {resendState.error}
            </StateBanner>
          ) : null}
          {resendState.success ? (
            <StateBanner variant="info" role="status" aria-live="polite">
              {resendState.success}
            </StateBanner>
          ) : null}
          <Button type="submit" variant="secondary" disabled={isResendPending || !resendEmail}>
            {isResendPending ? "Resending..." : "Resend verification email"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
