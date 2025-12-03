// --- path: app/layout.tsx ---
import "./globals.css";
import type { ReactNode } from "react";
import ThemeProvider from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "MealSlot",
  description: "Spin for meals that fit your mood",
};

const noFoucScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');           // "dark" | "light" | null
    var prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? (stored === 'dark') : prefers;
    document.documentElement.classList.toggle('dark', !!dark);

    // expose a tiny debugger hook so you can flip from DevTools
    window.__flipTheme = function() {
      var now = document.documentElement.classList.contains('dark');
      var next = !now;
      document.documentElement.classList.toggle('dark', next);
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
      return next;
    };
    // Remove known extension-injected attributes (e.g. Grammarly) before React hydration
    try {
      var attrs = ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
      attrs.forEach(function(a) {
        document.querySelectorAll('['+a+']').forEach(function(el){ el.removeAttribute(a); });
      });
    } catch(e) {}
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFoucScript }} />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#fefefe] to-[#f5f4f2] text-neutral-900 dark:bg-gradient-to-br dark:from-[#1b1d22] dark:via-[#1e2026] dark:to-[#111215] dark:text-neutral-100">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
