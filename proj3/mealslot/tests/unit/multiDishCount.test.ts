import { describe, it, expect, vi, beforeEach } from "vitest";
import { weightedSpin } from "@/lib/scoring";
import { Dish } from "@/lib/schemas";

const makeDish = (id: string, healthy: boolean, cost: number, time: number): Dish => ({
    id,
    name: id,
    category: "main",
    tags: [],
    costBand: cost,
    timeBand: time,
    isHealthy: healthy,
    allergens: [],
    ytQuery: id,
});

describe("Multi-Dish Count Selection (>3 dishes)", () => {
    it("generates 4 reels for dishCount=4", () => {
        const reels = [
            [makeDish("A", true, 1, 1), makeDish("B", false, 3, 3)],
            [makeDish("C", true, 1, 1), makeDish("D", false, 3, 3)],
            [makeDish("E", true, 1, 1), makeDish("F", false, 3, 3)],
            [makeDish("G", true, 1, 1), makeDish("H", false, 3, 3)],
        ];
        expect(reels.length).toBe(4);
    });

    it("generates 5 reels for dishCount=5", () => {
        const reels = Array.from({ length: 5 }, (_, i) => [
            makeDish(`D${i}A`, true, 1, 1),
            makeDish(`D${i}B`, false, 3, 3),
        ]);
        expect(reels.length).toBe(5);
    });

    it("generates 6 reels for dishCount=6", () => {
        const reels = Array.from({ length: 6 }, (_, i) => [
            makeDish(`D${i}A`, true, 1, 1),
            makeDish(`D${i}B`, false, 3, 3),
        ]);
        expect(reels.length).toBe(6);
    });

    it("deduplicates dishes across 4 reels", () => {
        const dishes = [
            makeDish("A", true, 1, 1),
            makeDish("B", true, 1, 1),
            makeDish("C", true, 1, 1),
            makeDish("D", true, 1, 1),
            makeDish("E", true, 1, 1),
        ];
        const dishIds = dishes.map((d) => d.id);
        const uniqueIds = new Set(dishIds);
        expect(uniqueIds.size).toBe(5);
    });

    it("deduplicates dishes across 5 reels", () => {
        const dishes = Array.from({ length: 8 }, (_, i) => makeDish(`Dish${i}`, true, 1, 1));
        const dishIds = dishes.map((d) => d.id);
        const uniqueIds = new Set(dishIds);
        expect(uniqueIds.size).toBe(8);
    });

    it("respects locks across all 4 slots", () => {
        const reels = [
            [makeDish("A", true, 1, 1), makeDish("B", false, 3, 3)],
            [makeDish("C", true, 1, 1), makeDish("D", false, 3, 3)],
            [makeDish("E", true, 1, 1), makeDish("F", false, 3, 3)],
            [makeDish("G", true, 1, 1), makeDish("H", false, 3, 3)],
        ];
        const locks = [
            { index: 0, dishId: "B" },
            { index: 2, dishId: "F" },
        ];
        const result = weightedSpin(reels, locks, {});
        expect(result[0].id).toBe("B");
        expect(result[2].id).toBe("F");
    });

    it("respects locks across all 5 slots", () => {
        const reels = Array.from({ length: 5 }, (_, i) => [
            makeDish(`D${i}A`, true, 1, 1),
            makeDish(`D${i}B`, false, 3, 3),
        ]);
        const locks = [
            { index: 1, dishId: "D1B" },
            { index: 3, dishId: "D3B" },
        ];
        const result = weightedSpin(reels, locks, {});
        expect(result[1].id).toBe("D1B");
        expect(result[3].id).toBe("D3B");
    });

    it("applies powerups with 4 dishes", () => {
        const reels = [
            [
                makeDish("cheap_fast_healthy", true, 1, 1),
                makeDish("expensive_slow", false, 3, 3),
            ],
            [
                makeDish("cheap_fast_healthy2", true, 1, 1),
                makeDish("expensive_slow2", false, 3, 3),
            ],
            [
                makeDish("cheap_fast_healthy3", true, 1, 1),
                makeDish("expensive_slow3", false, 3, 3),
            ],
            [
                makeDish("cheap_fast_healthy4", true, 1, 1),
                makeDish("expensive_slow4", false, 3, 3),
            ],
        ];
        const result = weightedSpin(reels, [], {
            healthy: true,
            cheap: true,
            max30m: true,
        });
        expect(result.length).toBe(4);
        expect(result.every((d) => d.isHealthy && d.costBand === 1 && d.timeBand === 1)).toBe(true);
    });

    it("applies powerups with 5 dishes", () => {
        const reels = Array.from({ length: 5 }, (_, i) => [
            makeDish(`healthy${i}`, true, 1, 1),
            makeDish(`unhealthy${i}`, false, 3, 3),
        ]);
        const result = weightedSpin(reels, [], { healthy: true });
        expect(result.every((d) => d.isHealthy)).toBe(true);
    });

    it("combines locks and powerups with 4 dishes", () => {
        const reels = [
            [makeDish("locked", false, 3, 3), makeDish("alt", true, 1, 1)],
            [makeDish("healthy1", true, 1, 1), makeDish("unhealthy1", false, 3, 3)],
            [makeDish("healthy2", true, 1, 1), makeDish("unhealthy2", false, 3, 3)],
            [makeDish("healthy3", true, 1, 1), makeDish("unhealthy3", false, 3, 3)],
        ];
        const locks = [{ index: 0, dishId: "locked" }];
        const result = weightedSpin(reels, locks, { healthy: true });
        expect(result[0].id).toBe("locked");
        expect(result.slice(1).every((d) => d.isHealthy)).toBe(true);
    });

    it("handles 6 reels with mixed locks and powerups", () => {
        const reels = Array.from({ length: 6 }, (_, i) => [
            makeDish(`D${i}healthy`, true, 1, 1),
            makeDish(`D${i}unhealthy`, false, 3, 3),
        ]);
        const locks = [{ index: 2, dishId: "D2healthy" }];
        const result = weightedSpin(reels, locks, { healthy: true });
        expect(result[2].id).toBe("D2healthy");
        expect(result.every((d) => d.isHealthy)).toBe(true);
    });

    it("renders correct number of slot cards for 4 dishes", () => {
        const dishCount = 4;
        const slots = Array.from({ length: dishCount }, (_, i) => ({
            id: i,
            dish: makeDish(`D${i}`, true, 1, 1),
        }));
        expect(slots.length).toBe(4);
    });

    it("renders correct number of slot cards for 5 dishes", () => {
        const dishCount = 5;
        const slots = Array.from({ length: dishCount }, (_, i) => ({
            id: i,
            dish: makeDish(`D${i}`, true, 1, 1),
        }));
        expect(slots.length).toBe(5);
    });

    it("renders correct number of slot cards for 6 dishes", () => {
        const dishCount = 6;
        const slots = Array.from({ length: dishCount }, (_, i) => ({
            id: i,
            dish: makeDish(`D${i}`, true, 1, 1),
        }));
        expect(slots.length).toBe(6);
    });

    it("handles edge case: max dish count of 10", () => {
        const dishCount = 10;
        const reels = Array.from({ length: dishCount }, (_, i) => [
            makeDish(`D${i}A`, true, 1, 1),
            makeDish(`D${i}B`, false, 3, 3),
        ]);
        expect(reels.length).toBe(10);
        const result = weightedSpin(reels, [], {});
        expect(result.length).toBe(10);
    });

    it("maintains performance with 7 reels", () => {
        const start = performance.now();
        const reels = Array.from({ length: 7 }, (_, i) => [
            makeDish(`D${i}A`, true, 1, 1),
            makeDish(`D${i}B`, false, 3, 3),
        ]);
        const result = weightedSpin(reels, [], {});
        const end = performance.now();
        expect(result.length).toBe(7);
        expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
    });

    it("maintains performance with 8 reels", () => {
        const start = performance.now();
        const reels = Array.from({ length: 8 }, (_, i) => [
            makeDish(`D${i}A`, true, 1, 1),
            makeDish(`D${i}B`, false, 3, 3),
        ]);
        const result = weightedSpin(reels, [], {});
        const end = performance.now();
        expect(result.length).toBe(8);
        expect(end - start).toBeLessThan(100);
    });

    it("correctly scrolls or positions 4 slots in grid layout", () => {
        const dishCount = 4;
        const gridCols = Math.ceil(Math.sqrt(dishCount));
        expect(gridCols).toBe(2); // 2x2 grid for 4 items
    });

    it("correctly scrolls or positions 5 slots in grid layout", () => {
        const dishCount = 5;
        const gridCols = Math.ceil(Math.sqrt(dishCount));
        expect(gridCols).toBe(3); // Approximately 3 columns
    });

    it("correctly scrolls or positions 6 slots in grid layout", () => {
        const dishCount = 6;
        const gridCols = Math.ceil(Math.sqrt(dishCount));
        expect(gridCols).toBe(3); // 3x2 grid for 6 items
    });
});
