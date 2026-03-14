"use client";

import { useActionState } from "react";

import { deleteProviderAction, type ActionState } from "@/app/org/[slug]/actions";
import { StateBanner } from "@/components/ui/state-banner";

const initialState: ActionState = {
  error: null,
  success: null,
  invitationLink: null,
};

export function DeleteProviderButton({
  organizationSlug,
  providerProfileId,
  providerName,
}: {
  organizationSlug: string;
  providerProfileId: string;
  providerName: string;
}) {
  const [state, formAction, isPending] = useActionState(deleteProviderAction, initialState);

  return (
    <div className="space-y-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Delete provider \"${providerName}\"? This action cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="organizationSlug" value={organizationSlug} />
        <input type="hidden" name="providerProfileId" value={providerProfileId} />
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-semibold text-sky-900 underline disabled:opacity-50"
        >
          {isPending ? "Deleting..." : "Delete"}
        </button>
      </form>
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
    </div>
  );
}
