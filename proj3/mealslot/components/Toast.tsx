// --- path: components/Toast.tsx ---
"use client";

import { useEffect } from "react";

export type ToastMsg = { id: string; text: string; ttl?: number };

export default function ToastStack({
  items,
  onExpire,
}: {
  items: ToastMsg[];
  onExpire: (id: string) => void;
}) {
  useEffect(() => {
    const timers = items.map((t) =>
      setTimeout(() => onExpire(t.id), t.ttl ?? 2600)
    );
    return () => { for (const timer of timers) clearTimeout(timer as any); };
  }, [items, onExpire]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-lg border border-neutral-200 bg-white/90 px-3 py-2 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-[#303237] dark:bg-[#1c1e23]/90 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
