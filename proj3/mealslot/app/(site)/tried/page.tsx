"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import TriedCard from "@/components/TriedCard";

export default function TriedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.id) return setItems([]);
      setLoading(true);
      try {
        const r = await fetch(`/api/tried?userId=${user.id}`);
        if (!r.ok) return;
        const j = await r.json();
        if (!mounted) return;
        setItems(j);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
    return ()=>{ mounted=false; };
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Tried Dishes</h1>
      {!user ? (
        <div className="text-sm">Please log in to view your tried dishes.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? <div className="text-sm dark:text-neutral-300">Loading…</div> : (
            items.length === 0 ? <div className="text-sm text-neutral-500 dark:text-neutral-400">You haven't marked any dishes yet.</div>
            : items.map(it => (
              <TriedCard key={it.id} item={it} onDelete={() => setItems(items.filter(x => x.id !== it.id))} onUpdate={(notes,rating)=>{
                setItems(items.map(x => x.id===it.id ? { ...x, notes, rating } : x));
              }} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
