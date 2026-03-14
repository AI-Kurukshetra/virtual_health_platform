import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function FieldGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-sky-900", className)} {...props} />;
}

export function FieldInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-sky-950 outline-none transition placeholder:text-sky-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
        className,
      )}
      {...props}
    />
  );
}

export function FieldSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-sky-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
        className,
      )}
      {...props}
    />
  );
}

export function FieldTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-sky-950 outline-none transition placeholder:text-sky-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-rose-700", className)} {...props} />;
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-sky-700/75", className)} {...props} />;
}
