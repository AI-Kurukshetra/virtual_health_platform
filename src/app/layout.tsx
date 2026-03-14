import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Virtual Health Platform",
  description: "Multi-tenant virtual care MVP with Next.js and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
