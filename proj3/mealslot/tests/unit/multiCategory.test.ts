import { describe, it, expect, vi, beforeEach } from "vitest";
import { dishesByCategoriesDbFirst } from "@/lib/dishes";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    dish: {
      findMany: vi.fn(),
    },
  },
}));

describe("Multi-category selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no categories provided", async () => {
    const result = await dishesByCategoriesDbFirst([], [], []);
    expect(result).toEqual([]);
  });

  it("handles single category correctly", async () => {
    const mockDishes = [
      { id: "1", name: "Dish 1", category: "breakfast", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast"], [], []);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].category).toBe("breakfast");
  });

  it("combines dishes from multiple categories", async () => {
    const mockDishes = [
      { id: "1", name: "Breakfast Dish", category: "breakfast", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "2", name: "Lunch Dish", category: "lunch", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "3", name: "Dinner Dish", category: "dinner", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast", "lunch", "dinner"], [], []);
    expect(result.length).toBe(3);
    const categories = result.map(d => d.category);
    expect(categories).toContain("breakfast");
    expect(categories).toContain("lunch");
    expect(categories).toContain("dinner");
  });

  it("removes duplicate dishes by id", async () => {
    const mockDishes = [
      { id: "1", name: "Dish 1", category: "breakfast", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "1", name: "Dish 1", category: "lunch", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast", "lunch"], [], []);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by tags correctly across categories", async () => {
    const mockDishes = [
      { id: "1", name: "Quick Breakfast", category: "breakfast", tags: "quick,healthy", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "2", name: "Slow Breakfast", category: "breakfast", tags: "slow", allergens: "", costBand: 1, timeBand: 1, isHealthy: false, ytQuery: null },
      { id: "3", name: "Quick Lunch", category: "lunch", tags: "quick", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast", "lunch"], ["quick"], []);
    expect(result.length).toBe(2);
    expect(result.every(d => d.tags.includes("quick"))).toBe(true);
  });

  it("excludes dishes with selected allergens", async () => {
    const mockDishes = [
      { id: "1", name: "Dairy Dish", category: "breakfast", tags: "", allergens: "dairy", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "2", name: "Gluten Dish", category: "lunch", tags: "", allergens: "gluten", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "3", name: "Safe Dish", category: "dinner", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast", "lunch", "dinner"], [], ["dairy", "gluten"]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("3");
  });

  it("handles empty tags and allergens arrays", async () => {
    const mockDishes = [
      { id: "1", name: "Dish 1", category: "breakfast", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast"], [], []);
    expect(result.length).toBe(1);
  });

  it("handles case-insensitive tag matching", async () => {
    const mockDishes = [
      { id: "1", name: "Dish 1", category: "breakfast", tags: "QUICK,HEALTHY", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast"], ["quick"], []);
    expect(result.length).toBe(1);
  });

  it("handles multiple categories with complex filters", async () => {
    const mockDishes = [
      { id: "1", name: "Quick Healthy Breakfast", category: "breakfast", tags: "quick,healthy", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "2", name: "Quick Healthy Lunch", category: "lunch", tags: "quick,healthy", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "3", name: "Slow Dessert", category: "dessert", tags: "slow", allergens: "", costBand: 1, timeBand: 1, isHealthy: false, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast", "lunch", "dessert"], ["quick", "healthy"], []);
    expect(result.length).toBe(2);
    expect(result.every(d => d.tags.includes("quick") && d.tags.includes("healthy"))).toBe(true);
  });

  it("handles all four categories together", async () => {
    const mockDishes = [
      { id: "1", name: "Breakfast", category: "breakfast", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "2", name: "Lunch", category: "lunch", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "3", name: "Dinner", category: "dinner", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
      { id: "4", name: "Dessert", category: "dessert", tags: "", allergens: "", costBand: 1, timeBand: 1, isHealthy: true, ytQuery: null },
    ];
    (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

    const result = await dishesByCategoriesDbFirst(["breakfast", "lunch", "dinner", "dessert"], [], []);
    expect(result.length).toBe(4);
  });
});

