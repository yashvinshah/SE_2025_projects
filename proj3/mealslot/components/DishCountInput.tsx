// --- path: components/DishCountInput.tsx ---
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type DishCountInputProps = {
  value: number;
  onChange: (newCount: number) => void;
};

export default function DishCountInput({ value, onChange }: DishCountInputProps) {
  const [input, setInput] = useState(value.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string so user can delete and type
    if (/^\d*$/.test(val)) {
      setInput(val);
      if (val === "") return;
      const parsed = Math.max(0, parseInt(val, 10) || 0);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    // Normalize empty to previous value (or 0)
    if (input === "") {
      setInput(String(value ?? 0));
      onChange(value ?? 0);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <label className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        Number of Dishes:
      </label>
      <motion.input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={input}
        onChange={handleChange}
        onBlur={handleBlur}
        className={[
          "w-20 rounded-lg border-2 px-4 py-2 text-center text-base font-semibold transition-all",
          // ✅ explicit light-mode styles
          "bg-white text-neutral-900 placeholder:text-neutral-500 border-neutral-300",
          // ✅ dark-mode styles
          "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:border-neutral-700",
          // focus states
          "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500",
          "dark:focus:ring-orange-500/50 dark:focus:border-orange-500",
        ].join(" ")}
        placeholder="0"
        aria-label="Number of dishes"
        whileFocus={{ scale: 1.05 }}
      />
    </div>
  );
}
