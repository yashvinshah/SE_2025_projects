import "server-only";
export const runtime = "nodejs"; // ensure Prisma runs in Node

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategoryDbFirst, dishesByCategoriesDbFirst } from "@/lib/dishes";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { weightedSpin } from "@/lib/scoring";
import { prisma } from "@/lib/db";

const Body = z
  .object({
    category: z.string().min(1).optional(), // backwards compatibility
    categories: z.array(z.string()).optional(), // new multi-category support
    tags: z.array(z.string()).optional().default([]),
    allergens: z.array(z.string()).optional().default([]),
    locked: z
      .array(
        z.union([
          z.object({
            index: z.number().int().min(0).max(5),
            dishId: z.string(),
          }),
          z.number().int().min(0).max(5), // allow index-only; we'll normalize
        ])
      )
      .optional()
      .default([]),
    powerups: z
      .object({
        healthy: z.boolean().optional(),
        cheap: z.boolean().optional(),
        max30m: z.boolean().optional(),
      })
      .optional()
      .default({}),
    dishCount: z.number().int().min(1).optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(raw);

    if (!parsed.success) {
      return Response.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const {
      category,
      categories,
      tags,
      allergens,
      powerups,
      locked,
      dishCount,
    } = parsed.data as {
      category?: string;
      categories?: string[];
      tags: string[];
      allergens: string[];
      powerups: PowerUpsInput;
      locked: Array<number | { index: number; dishId: string }>;
      dishCount?: number;
    };

    // Support both old single category and new multi-category
    const categoryList: string[] = categories && categories.length > 0
      ? categories
      : category
        ? [category]
        : [];

    if (categoryList.length === 0) {
      return Response.json({ message: "At least one category is required" }, { status: 400 });
    }

    const lockedInput = (locked ?? []).flatMap((x) => {
      if (typeof x === "number") return [];
      if (x && typeof x === "object" && "index" in x && "dishId" in x) return [x];
      return [];
    }) as Array<{ index: number; dishId: string }>;

    const reels: Dish[][] = [];
    const count = dishCount ?? 1;
    for (let i = 0; i < count; i++) {
      console.log(`[spin] Fetching reel ${i + 1}/${count} for categories:`, categoryList, `tags:`, tags, `allergens:`, allergens);

      const dishes = await dishesByCategoriesDbFirst(categoryList, tags, allergens);

      console.log(`[spin] Got ${dishes.length} dishes for reel ${i + 1}`);

      if (dishes.length === 0) {
        console.error(`[spin] No dishes found for categories: ${categoryList.join(", ")}, tags: ${tags.join(", ")}, allergens: ${allergens.join(", ")}`);
        return Response.json(
          { message: `No dishes available for selected categories: ${categoryList.join(", ")}. Please try different filters.` },
          { status: 404 }
        );
      }
      reels.push(dishes);
    }

    if (reels.length === 0 || reels.every(reel => reel.length === 0)) {
      console.error("All reels are empty");
      return Response.json(
        { message: "No dishes available. Please try different categories or filters." },
        { status: 404 }
      );
    }

    const selection = weightedSpin(reels, lockedInput, powerups);

    if (!selection || selection.length === 0) {
      console.error("weightedSpin returned empty selection");
      return Response.json(
        { message: "Failed to select dishes. Please try again." },
        { status: 500 }
      );
    }

    try {
      await prisma.spin.create({
        data: {
          reelsJson: JSON.stringify(reels.map((r) => r.map((d) => d.id))),
          lockedJson: JSON.stringify(lockedInput),
          resultDishIds: JSON.stringify(selection.map((d) => d.id)),
          powerupsJson: JSON.stringify(powerups),
        },
      });
    } catch (e) {
      console.warn("spin persist failed (non-fatal):", (e as Error).message);
    }

    return Response.json({ spinId: `spin_${Date.now()}`, reels, selection });
  } catch (err) {
    console.error("spin route error:", err);
    return Response.json(
      { code: "INTERNAL_ERROR", message: (err as Error)?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
