// --- path: app/(site)/layout.tsx ---
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteNav from "@/components/SiteNav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/" || pathname === "/login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#fefefe] to-[#f5f4f2] text-neutral-900 dark:bg-gradient-to-br dark:from-[#1b1d22] dark:via-[#1e2026] dark:to-[#111215] dark:text-neutral-100">
      {!isLandingPage && (
        <header className="sticky top-0 z-50 site-header">
          <SiteNav />
        </header>
      )}
      <main className={isLandingPage ? "" : "mx-auto max-w-6xl px-4 py-6"}>{children}</main>
    </div>
  );
}