"use client";

import React from "react"
import { Dish } from "@/lib/schemas";
import { cn } from "./ui/cn";
import { motion, AnimatePresence } from "framer-motion";
import TriedButton from "@/components/TriedButton";

type Props = {
  dish?: Dish;
  reelIndex?: number;
  locked: boolean;
  onToggle(): void;
  isSpinning?: boolean;
  isRevealing?: boolean;
};

export default function SlotReel({ dish, reelIndex, locked, onToggle, isSpinning = false, isRevealing = false }: Props) {
  return (
    <motion.div
      className="flex h-48 w-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-md p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-[#303237] dark:bg-[#1c1e23]/90 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
      initial={false}
      animate={{
        scale: isRevealing && dish ? 1.05 : 1,
        boxShadow: isRevealing && dish 
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
          : "0 4px 12px rgba(0, 0, 0, 0.08)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <div className="min-h-16 overflow-hidden">
        <AnimatePresence>
          {dish ? (
            <motion.div
              key={`${dish.id}_${reelIndex ?? ""}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: isRevealing ? 1.1 : 1,
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                opacity: { duration: 0.3 },
                scale: isRevealing ? {
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  repeat: 1,
                  repeatType: "reverse" as const,
                } : { type: "spring", stiffness: 300, damping: 25 },
              }}
            >
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {dish.name}
              </div>
              <div className="mt-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                {dish.category}
              </div>
            </motion.div>
          ) : isSpinning ? (
            <motion.div
              key="spinning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                y: [0, -10, 0],
              }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{
                opacity: {
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                y: {
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="text-base font-semibold text-neutral-400 dark:text-neutral-500"
            >
              Spinning...
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="text-base font-semibold text-neutral-300 dark:text-neutral-600"
            >
              —
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col items-stretch">
        <motion.button
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors shadow-sm",
            locked 
              ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100" 
              : "bg-[#f0ece6] text-gray-800 border-neutral-200 hover:bg-[#e9e4dd] dark:bg-[#26282d] dark:text-neutral-200 dark:border-[#303237] dark:hover:bg-[#303237]"
          )}
          onClick={onToggle}
          aria-pressed={locked}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSpinning || !dish}
        >
          {locked ? "🔒 Locked" : "🔓 Lock"}
        </motion.button>
        <TriedButton dishId={dish?.id ?? ""} dishName={dish?.name} />
      </div>
    </motion.div>
  );
}
