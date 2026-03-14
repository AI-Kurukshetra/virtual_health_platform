"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { StateBanner } from "@/components/ui/state-banner";

export default function OrgErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep logging local for fast debugging during MVP iteration.
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4">
      <StateBanner variant="error">Something failed while loading this workspace.</StateBanner>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
