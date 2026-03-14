"use client";

import { useState, useTransition } from "react";
import { deleteAvailabilityAction } from "@/app/org/[slug]/actions";

export function DeleteAvailabilityButton({ 
  organizationSlug, 
  availabilityId 
}: { 
  organizationSlug: string; 
  availabilityId: string; 
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("organizationSlug", organizationSlug);
      formData.append("availabilityId", availabilityId);
      await deleteAvailabilityAction(formData);
      setShowConfirm(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Remove
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Remove availability slot?</h3>
            <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
              Are you sure you want to remove this weekly availability window? It will no longer generate future bookable appointments.
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
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Removing...
                  </>
                ) : (
                  "Yes, Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
