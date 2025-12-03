"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

type LocalTried = { id: string; dishId: string; dishName?: string; dateTried: string; notes?: string; rating?: number };

export default function TriedButton({ dishId, dishName }: { dishId: string; dishName?: string }) {
  const { user } = useAuth();
  const [isTried, setIsTried] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (user?.id) {
        try {
          const r = await fetch(`/api/tried?userId=${user.id}&dishId=${encodeURIComponent(dishId)}`);
          if (!r.ok) return;
          const j = await r.json();
          if (!mounted) return;
          setIsTried(Array.isArray(j) ? j.length > 0 : false);
        } catch (e) {
          // ignore
        }
      } else {
        try {
          const raw = localStorage.getItem("mealslot_tried");
          const arr: LocalTried[] = raw ? JSON.parse(raw) : [];
          setIsTried(arr.some(x => x.dishId === dishId));
        } catch (e) {
          setIsTried(false);
        }
      }
    }
    check();
    return () => { mounted = false; };
  }, [user?.id, dishId]);

  const onClick = async () => {
    setLoading(true);
    try {
      if (isTried) {
        // no-op for now: unmarking could be added
        setLoading(false);
        return;
      }

      if (user?.id) {
        const r = await fetch(`/api/tried`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, dishId, notes: "", rating: null }),
        });
        if (r.ok) setIsTried(true);
      } else {
        // persist locally
        const raw = localStorage.getItem("mealslot_tried");
        const arr: LocalTried[] = raw ? JSON.parse(raw) : [];
        arr.unshift({ id: crypto.randomUUID(), dishId, dishName, dateTried: new Date().toISOString() });
        localStorage.setItem("mealslot_tried", JSON.stringify(arr));
        setIsTried(true);
      }
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={[
        "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-all shadow-sm",
        isTried
          ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
          : "bg-[#f0ece6] text-gray-800 border border-neutral-200 hover:bg-[#e9e4dd] dark:bg-[#26282d] dark:text-neutral-200 dark:border-[#303237] dark:hover:bg-[#303237]",
      ].join(" ")}
    >
      {isTried ? "Tried ✅" : "Tried it"}
    </button>
  );
}
