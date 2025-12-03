"use client";

import React, { useState } from "react";

export default function TriedCard({ item, onDelete, onUpdate }: { item: any; onDelete?: () => void; onUpdate?: (notes?: string, rating?: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [rating, setRating] = useState<number | undefined>(item.rating ?? undefined);

  const save = async () => {
    try {
      const r = await fetch(`/api/tried/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes, rating }) });
      if (r.ok) {
        setEditing(false);
        onUpdate?.(notes, rating);
      }
    } catch (e) { console.error(e); }
  };

  const remove = async () => {
    try {
      const r = await fetch(`/api/tried/${item.id}`, { method: "DELETE" });
      if (r.ok) onDelete?.();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-md p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-[#303237] dark:bg-[#1c1e23]/90 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">{item.dish?.name ?? item.dishName}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(item.dateTried).toLocaleString()}</div>
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">{item.rating ? `★ ${item.rating}` : null}</div>
      </div>

      <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{!editing ? (item.notes ?? <span className="opacity-60">No notes</span>) : (
        <textarea className="w-full rounded-lg border border-neutral-300 bg-white p-2 dark:border-[#303237] dark:bg-[#26282d] dark:text-neutral-200" value={notes} onChange={(e)=>setNotes(e.target.value)} />
      )}</div>

      <div className="mt-3 flex items-center gap-2">
        {editing ? (
          <>
            <button onClick={save} className="rounded-lg bg-sky-600 px-3 py-1 text-white text-sm font-medium shadow-sm hover:bg-sky-700">Save</button>
            <button onClick={()=>setEditing(false)} className="rounded-lg border border-neutral-300 px-3 py-1 text-sm dark:border-[#303237] dark:hover:bg-[#26282d]">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={()=>setEditing(true)} className="rounded-lg border border-neutral-300 px-3 py-1 text-sm dark:border-[#303237] dark:hover:bg-[#26282d]">Edit</button>
            <button onClick={remove} className="rounded-lg border border-red-300 px-3 py-1 text-red-600 text-sm dark:border-red-900 dark:text-red-400">Remove</button>
          </>
        )}
      </div>
    </div>
  );
}
