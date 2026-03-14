import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-sky-300 bg-sky-50/65 p-6 text-sm text-sky-800",
        className,
      )}
      {...props}
    />
  );
}
