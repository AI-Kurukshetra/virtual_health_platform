"use client";

import { useActionState, useState } from "react";

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
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isPending ? "Deleting..." : "Delete provider"}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Delete {providerName}?</h3>
            <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
              Are you sure you want to delete this provider? This action will remove their access and assignments. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 mt-8 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <form action={formAction}>
                 <input type="hidden" name="organizationSlug" value={organizationSlug} />
                 <input type="hidden" name="providerProfileId" value={providerProfileId} />
                 <button
                   type="submit"
                   disabled={isPending}
                   onClick={() => setTimeout(() => setShowConfirm(false), 500)}
                   className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                 >
                   {isPending ? "Deleting..." : "Yes, Delete"}
                 </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {state.error ? <StateBanner variant="error">{state.error}</StateBanner> : null}
      {state.success ? <StateBanner>{state.success}</StateBanner> : null}
    </div>
  );
}
