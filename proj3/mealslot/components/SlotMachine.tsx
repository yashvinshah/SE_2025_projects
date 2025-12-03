"use client";

import React from "react"
import { useEffect, useMemo, useState } from "react";
import SlotReel from "./SlotReel";
import { Dish } from "@/lib/schemas";
import { cn } from "./ui/cn";
import { motion, AnimatePresence } from "framer-motion";

type Locked = { index: number; dishId: string };
type Props = {
  reelCount: number; // number of reels
  onSpin(locked: Locked[]): Promise<void> | void;
  cooldownMs: number; // remaining ms from parent
  busy?: boolean;
  selection?: Dish[];
};

export function SlotMachine({ reelCount, onSpin, cooldownMs, busy, selection }: Props) {
  const [locked, setLocked] = useState<Record<number, string>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [spinningReels, setSpinningReels] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLocked({});
  }, [reelCount]);

  const lockedArray: Locked[] = useMemo(
    () =>
      Object.entries(locked)
        .filter(([, id]) => !!id)
        .map(([i, id]) => ({ index: Number(i), dishId: id })),
    [locked]
  );

  const dishesByIndex: (Dish | undefined)[] = useMemo(() => {
    const out: (Dish | undefined)[] = [];
    for (let i = 0; i < reelCount; i++) {
      out.push(selection?.[i]);
    }
    return out;
  }, [reelCount, selection]);

  // Preserve locks when selection changes - only clear if dish ID no longer matches
  useEffect(() => {
    setLocked((prev) => {
      const next: Record<number, string> = {};
      // Preserve all existing locks that still match their dishes
      dishesByIndex.forEach((d, i) => {
        const currentLocked = prev[i];
        if (currentLocked) {
          // Keep the lock if the dish at this index matches the locked dish ID
          if (d && currentLocked === d.id) {
            next[i] = currentLocked;
          } else if (!d) {
            // If no dish yet, preserve the lock (during spin animation)
            next[i] = currentLocked;
          }
          // Otherwise, the dish changed and doesn't match the lock, so we clear it
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection && selection.map((d) => d?.id ?? "").join("|")]);

  // Handle spin animation
  useEffect(() => {
    if (busy && !isSpinning) {
      setIsSpinning(true);
      setIsRevealing(false);
      // Mark all unlocked reels as spinning
      const spinning = new Set<number>();
      for (let i = 0; i < reelCount; i++) {
        if (!locked[i]) {
          spinning.add(i);
        }
      }
      setSpinningReels(spinning);
    } else if (busy && isSpinning) {
      // We're still busy but might have dishes now - stop spinning for reels that have dishes
      if (selection && selection.length > 0) {
        setSpinningReels((prev) => {
          const next = new Set(prev);
          for (let i = 0; i < reelCount; i++) {
            // If this reel has a dish in the selection, remove it from spinning
            if (selection[i] && selection[i].id) {
              next.delete(i);
            }
          }
          return next;
        });
      }
    } else if (!busy && isSpinning && selection && selection.length > 0) {
      // Start reveal animation
      setIsSpinning(false);
      setIsRevealing(true);
      setSpinningReels(new Set());
      
      // Stop revealing after animation completes
      setTimeout(() => {
        setIsRevealing(false);
      }, 1500);
    } else if (!busy && isSpinning) {
      setIsSpinning(false);
      setSpinningReels(new Set());
    }
  }, [busy, isSpinning, selection, reelCount, locked]);

  const toggleLock = (i: number) => {
    setLocked((prev) => {
      const cur = { ...prev };
      const currentDish = dishesByIndex[i];
      if (!currentDish) return cur;
      if (cur[i]) delete cur[i];
      else cur[i] = currentDish.id;
      return cur;
    });
  };

  const canSpin = !busy && cooldownMs <= 0 && reelCount > 0;

  return (
    <motion.section
      className="rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-md p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-[#303237] dark:bg-[#1c1e23]/90 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <motion.h2
          className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          🎰 MealSlot Machine
        </motion.h2>
        <motion.div
          className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {cooldownMs > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              ⏱️ {(Math.max(0, cooldownMs) / 1000).toFixed(1)}s
            </span>
          ) : (
            <span className="text-neutral-400">Ready to spin!</span>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {Array.from({ length: reelCount }, (_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: i * 0.05,
              }}
            >
              <SlotReel
                dish={dishesByIndex[i]}
                reelIndex={i}
                locked={!!locked[i]}
                onToggle={() => toggleLock(i)}
                isSpinning={spinningReels.has(i)}
                isRevealing={isRevealing && dishesByIndex[i] !== undefined}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center">
        <motion.button
          className={cn(
            "relative rounded-xl px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200",
            canSpin
              ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95"
              : "bg-neutral-300 text-neutral-500 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-400"
          )}
          onClick={() => onSpin(lockedArray)}
          disabled={!canSpin}
          aria-disabled={!canSpin}
          whileHover={canSpin ? { scale: 1.05, boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.4)" } : {}}
          whileTap={canSpin ? { scale: 0.95 } : {}}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isSpinning ? (
            <motion.span
              className="inline-flex items-center gap-2"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🎰
              </motion.span>
              Spinning...
            </motion.span>
          ) : (
            <span className="inline-flex items-center gap-2">
              🎰 Spin the Reels!
            </span>
          )}
        </motion.button>
      </div>
    </motion.section>
  );
}