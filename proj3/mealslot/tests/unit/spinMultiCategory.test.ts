import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as SpinRoute from "@/app/api/spin/route";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    spin: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/dishes", () => ({
  dishesByCategoriesDbFirst: vi.fn(),
}));

vi.mock("@/lib/scoring", () => ({
  weightedSpin: vi.fn(),
}));

function toNextRequest(path: string, method: string, body?: any) {
  const url = new URL(`http://localhost${path}`);
  const init: RequestInit = {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };
  // @ts-expect-error - Next types aren't perfect in Vitest env
  return new NextRequest(new Request(url, init));
}

describe("Spin API - Multi-category support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { dishesByCategoriesDbFirst } = require("@/lib/dishes");
    const { weightedSpin } = require("@/lib/scoring");
    
    dishesByCategoriesDbFirst.mockResolvedValue([
      { id: "1", name: "Dish 1", category: "breakfast", tags: [], allergens: [], costBand: 1, timeBand: 1, isHealthy: true, ytQuery: "" },
      { id: "2", name: "Dish 2", category: "lunch", tags: [], allergens: [], costBand: 1, timeBand: 1, isHealthy: true, ytQuery: "" },
    ]);
    
    weightedSpin.mockReturnValue([
      { id: "1", name: "Dish 1", category: "breakfast", tags: [], allergens: [], costBand: 1, timeBand: 1, isHealthy: true, ytQuery: "" },
    ]);
  });

  it("accepts multiple categories in request", async () => {
    const req = toNextRequest("/api/spin", "POST", {
      categories: ["breakfast", "lunch"],
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.selection).toBeDefined();
  });

  it("supports backwards compatibility with single category", async () => {
    const req = toNextRequest("/api/spin", "POST", {
      category: "breakfast",
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
  });

  it("rejects request with no categories", async () => {
    const req = toNextRequest("/api/spin", "POST", {
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it("handles empty categories array", async () => {
    const req = toNextRequest("/api/spin", "POST", {
      categories: [],
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it("processes multiple categories correctly", async () => {
    const { dishesByCategoriesDbFirst } = require("@/lib/dishes");
    const req = toNextRequest("/api/spin", "POST", {
      categories: ["breakfast", "lunch", "dinner"],
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
    expect(dishesByCategoriesDbFirst).toHaveBeenCalledWith(
      ["breakfast", "lunch", "dinner"],
      [],
      []
    );
  });

  it("applies tags filter with multiple categories", async () => {
    const { dishesByCategoriesDbFirst } = require("@/lib/dishes");
    const req = toNextRequest("/api/spin", "POST", {
      categories: ["breakfast", "lunch"],
      tags: ["quick", "healthy"],
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
    expect(dishesByCategoriesDbFirst).toHaveBeenCalledWith(
      ["breakfast", "lunch"],
      ["quick", "healthy"],
      []
    );
  });

  it("applies allergen filter with multiple categories", async () => {
    const { dishesByCategoriesDbFirst } = require("@/lib/dishes");
    const req = toNextRequest("/api/spin", "POST", {
      categories: ["breakfast", "lunch"],
      allergens: ["dairy", "gluten"],
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
    expect(dishesByCategoriesDbFirst).toHaveBeenCalledWith(
      ["breakfast", "lunch"],
      [],
      ["dairy", "gluten"]
    );
  });

  it("handles all four categories together", async () => {
    const { dishesByCategoriesDbFirst } = require("@/lib/dishes");
    const req = toNextRequest("/api/spin", "POST", {
      categories: ["breakfast", "lunch", "dinner", "dessert"],
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
    expect(dishesByCategoriesDbFirst).toHaveBeenCalledWith(
      ["breakfast", "lunch", "dinner", "dessert"],
      [],
      []
    );
  });

  it("prefers categories array over category field", async () => {
    const { dishesByCategoriesDbFirst } = require("@/lib/dishes");
    const req = toNextRequest("/api/spin", "POST", {
      category: "breakfast",
      categories: ["lunch", "dinner"],
      dishCount: 1,
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
    expect(dishesByCategoriesDbFirst).toHaveBeenCalledWith(
      ["lunch", "dinner"],
      [],
      []
    );
  });
});

