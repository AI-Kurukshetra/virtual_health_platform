import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type StateVariant = "info" | "error";

type StateBannerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: StateVariant;
};

const variantClasses: Record<StateVariant, string> = {
  info: "border-cyan-200 bg-cyan-50 text-cyan-900",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

export function StateBanner({ className, variant = "info", ...props }: StateBannerProps) {
  return (
    <div
      className={cn("rounded-xl border px-3 py-2 text-sm", variantClasses[variant], className)}
      {...props}
    />
  );
}
