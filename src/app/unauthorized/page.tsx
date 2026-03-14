import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-12">
      <Card className="w-full bg-gradient-to-br from-white to-rose-50">
        <CardHeader>
          <CardTitle>Access denied for this workspace</CardTitle>
          <CardDescription>
            Your account does not have permission to access this organization route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-sky-900/80">
          <p>
            This usually means your role is missing required privileges, or your current account is not assigned to the
            tenant you are trying to access.
          </p>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-xl bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            Return to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
