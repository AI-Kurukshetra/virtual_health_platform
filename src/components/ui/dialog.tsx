"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type DialogProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  children: ReactNode;
};

export function Dialog({ title, description, triggerLabel, children }: DialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sky-950/35 p-4 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-2xl border border-sky-100 bg-white p-5 shadow-2xl shadow-sky-300/30">
            <header className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-sky-950">{title}</h3>
              {description ? <p className="text-sm text-sky-800/80">{description}</p> : null}
            </header>
            <div className="space-y-4">{children}</div>
            <footer className="mt-5 flex justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
