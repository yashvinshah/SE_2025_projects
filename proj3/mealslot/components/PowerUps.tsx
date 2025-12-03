"use client";

import React from "react"
import { PowerUpsInput } from "@/lib/schemas";
import { cn } from "./ui/cn";
import { motion } from "framer-motion";

export function PowerUps({
  value,
  onChange
}: {
  value: PowerUpsInput;
  onChange: (v: PowerUpsInput) => void;
}) {
  const toggle = (k: keyof PowerUpsInput) => onChange({ ...value, [k]: !value[k] });
  
  const powerUps = [
    { key: "healthy" as keyof PowerUpsInput, label: "Healthy", emoji: "🥗", color: "from-green-500 to-green-600" },
    { key: "cheap" as keyof PowerUpsInput, label: "Cheap", emoji: "💰", color: "from-yellow-500 to-yellow-600" },
    { key: "max30m" as keyof PowerUpsInput, label: "≤30m", emoji: "⏱️", color: "from-purple-500 to-purple-600" },
  ];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-md p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-[#303237] dark:bg-[#1c1e23]/90 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">Power-Ups</h2>
      <div className="flex flex-wrap gap-3">
        {powerUps.map(({ key, label, emoji, color }) => (
          <motion.button
            key={key}
            onClick={() => toggle(key)}
            className={cn(
              "rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-all",
              value[key]
                ? `bg-gradient-to-r ${color} text-white border-transparent shadow-md`
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700"
            )}
            aria-pressed={!!value[key]}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {emoji} {label}
          </motion.button>
        ))}
      </div>
    </section>
  );
}