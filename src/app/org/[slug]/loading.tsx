import { Card } from "@/components/ui/card";

export default function OrgLoadingPage() {
  return (
    <div className="space-y-4">
      <Card className="h-24 animate-pulse bg-gradient-to-r from-sky-50 to-cyan-50" />
      <Card className="h-64 animate-pulse bg-gradient-to-r from-cyan-50 to-amber-50" />
    </div>
  );
}
