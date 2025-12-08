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

describe("Multi-Category Selection Logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("allows selecting 2 categories simultaneously", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Breakfast Dish",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Lunch Dish",
                category: "lunch",
                tags: "",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: false,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result = await dishesByCategoriesDbFirst(["breakfast", "lunch"], [], []);
        expect(result.length).toBe(2);
        expect(result.map((d) => d.category)).toContain("breakfast");
        expect(result.map((d) => d.category)).toContain("lunch");
    });

    it("allows selecting 3 categories simultaneously", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Lunch",
                category: "lunch",
                tags: "",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "3",
                name: "Dinner",
                category: "dinner",
                tags: "",
                allergens: "",
                costBand: 3,
                timeBand: 3,
                isHealthy: false,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result = await dishesByCategoriesDbFirst(["breakfast", "lunch", "dinner"], [], []);
        expect(result.length).toBe(3);
        const categories = result.map((d) => d.category);
        expect(categories).toContain("breakfast");
        expect(categories).toContain("lunch");
        expect(categories).toContain("dinner");
    });

    it("allows selecting 4 categories simultaneously", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Brunch",
                category: "brunch",
                tags: "",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "3",
                name: "Lunch",
                category: "lunch",
                tags: "",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "4",
                name: "Dinner",
                category: "dinner",
                tags: "",
                allergens: "",
                costBand: 3,
                timeBand: 3,
                isHealthy: false,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result = await dishesByCategoriesDbFirst(["breakfast", "brunch", "lunch", "dinner"], [], []);
        expect(result.length).toBe(4);
    });

    it("maintains selection state across toggle operations", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Lunch",
                category: "lunch",
                tags: "",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        // First selection
        const result1 = await dishesByCategoriesDbFirst(["breakfast"], [], []);
        expect(result1.map((d) => d.category)).toContain("breakfast");

        // Toggle on lunch
        const result2 = await dishesByCategoriesDbFirst(["breakfast", "lunch"], [], []);
        expect(result2.length).toBe(2);

        // Verify breakfast is still present
        expect(result2.map((d) => d.category)).toContain("breakfast");
    });

    it("validates at least one category is selected before operations", async () => {
        const result = await dishesByCategoriesDbFirst([], [], []);
        expect(result.length).toBe(0);
    });

    it("handles duplicate categories gracefully", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result = await dishesByCategoriesDbFirst(["breakfast", "breakfast"], [], []);
        expect(result.length).toBeGreaterThan(0);
    });

    it("preserves category selection during async loading", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(
            new Promise((resolve) => {
                setTimeout(() => resolve(mockDishes), 10);
            })
        );

        const categories = ["breakfast"];
        const result = await dishesByCategoriesDbFirst(categories, [], []);
        expect(result.map((d) => d.category)).toContain("breakfast");
    });

    it("filters dishes correctly with tags across multiple categories", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Healthy Breakfast",
                category: "breakfast",
                tags: "healthy",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Unhealthy Breakfast",
                category: "breakfast",
                tags: "indulgent",
                allergens: "",
                costBand: 3,
                timeBand: 3,
                isHealthy: false,
                ytQuery: null,
            },
            {
                id: "3",
                name: "Healthy Lunch",
                category: "lunch",
                tags: "healthy",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result = await dishesByCategoriesDbFirst(["breakfast", "lunch"], ["healthy"], []);
        expect(result.every((d) => d.isHealthy)).toBe(true);
    });

    it("filters dishes by allergens across multiple categories", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Dairy-Free Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Dairy Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "dairy",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "3",
                name: "Dairy-Free Lunch",
                category: "lunch",
                tags: "",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result = await dishesByCategoriesDbFirst(["breakfast", "lunch"], [], ["dairy"]);
        expect(result.every((d) => !d.allergens.includes("dairy"))).toBe(true);
    });

    it("combines multiple filters across categories", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Healthy Dairy-Free Breakfast",
                category: "breakfast",
                tags: "healthy",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Unhealthy Dairy Breakfast",
                category: "breakfast",
                tags: "indulgent",
                allergens: "dairy",
                costBand: 3,
                timeBand: 3,
                isHealthy: false,
                ytQuery: null,
            },
            {
                id: "3",
                name: "Healthy Dairy-Free Lunch",
                category: "lunch",
                tags: "healthy",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result = await dishesByCategoriesDbFirst(["breakfast", "lunch"], ["healthy"], ["dairy"]);
        expect(result.every((d) => d.isHealthy && !d.allergens.includes("dairy"))).toBe(true);
    });

    it("returns correct count when adding and removing categories", async () => {
        const mockDishes = [
            {
                id: "1",
                name: "Breakfast",
                category: "breakfast",
                tags: "",
                allergens: "",
                costBand: 1,
                timeBand: 1,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "2",
                name: "Lunch",
                category: "lunch",
                tags: "",
                allergens: "",
                costBand: 2,
                timeBand: 2,
                isHealthy: true,
                ytQuery: null,
            },
            {
                id: "3",
                name: "Dinner",
                category: "dinner",
                tags: "",
                allergens: "",
                costBand: 3,
                timeBand: 3,
                isHealthy: false,
                ytQuery: null,
            },
        ];
        (prisma.dish.findMany as any).mockResolvedValue(mockDishes);

        const result1 = await dishesByCategoriesDbFirst(["breakfast", "lunch"], [], []);
        expect(result1.length).toBe(2);

        const result2 = await dishesByCategoriesDbFirst(["breakfast", "lunch", "dinner"], [], []);
        expect(result2.length).toBe(3);
    });
});
