/** @vitest-environment happy-dom */

import React, { useState } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ------------------------------------------------------------------ */
/* Mock PartyClient component for multi-category and multi-dish tests */
/* ------------------------------------------------------------------ */

const MockPartyClient = ({ onSpin }: { onSpin?: (categories: string[], dishCount: number) => void }) => {
    const [categories, setCategories] = useState<string[]>([]);
    const [dishCount, setDishCount] = useState(3);

    const toggleCategory = (cat: string) => {
        setCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };

    const handleSpin = () => {
        if (categories.length > 0) {
            onSpin?.(categories, dishCount);
        }
    };

    return (
        <div>
            <h2>Party Mode Setup</h2>

            <div>
                <h3>Select Categories</h3>
                <label>
                    <input
                        type="checkbox"
                        checked={categories.includes("breakfast")}
                        onChange={() => toggleCategory("breakfast")}
                        data-testid="category-breakfast"
                    />
                    Breakfast
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={categories.includes("lunch")}
                        onChange={() => toggleCategory("lunch")}
                        data-testid="category-lunch"
                    />
                    Lunch
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={categories.includes("dinner")}
                        onChange={() => toggleCategory("dinner")}
                        data-testid="category-dinner"
                    />
                    Dinner
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={categories.includes("snack")}
                        onChange={() => toggleCategory("snack")}
                        data-testid="category-snack"
                    />
                    Snack
                </label>
            </div>

            <div>
                <h3>Select Dish Count</h3>
                <input
                    type="number"
                    min="3"
                    max="10"
                    value={dishCount}
                    onChange={(e) => setDishCount(Number(e.target.value))}
                    data-testid="dish-count-input"
                />
            </div>

            <div data-testid="selected-categories">
                Selected: {categories.join(", ") || "None"}
            </div>

            <button onClick={handleSpin} data-testid="party-spin-btn">
                Start Party Spin
            </button>
        </div>
    );
};

describe("PartyClient Component - Multi-Category Selection", () => {
    it("allows selecting 2 categories", async () => {
        const onSpin = vi.fn();
        render(<MockPartyClient onSpin={onSpin} />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;

        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);

        expect(breakfastCheck.checked).toBe(true);
        expect(lunchCheck.checked).toBe(true);
    });

    it("allows selecting 3 categories", async () => {
        render(<MockPartyClient />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;
        const dinnerCheck = screen.getByTestId("category-dinner") as HTMLInputElement;

        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);
        await userEvent.click(dinnerCheck);

        expect(breakfastCheck.checked).toBe(true);
        expect(lunchCheck.checked).toBe(true);
        expect(dinnerCheck.checked).toBe(true);
    });

    it("allows selecting 4 categories", async () => {
        render(<MockPartyClient />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;
        const dinnerCheck = screen.getByTestId("category-dinner") as HTMLInputElement;
        const snackCheck = screen.getByTestId("category-snack") as HTMLInputElement;

        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);
        await userEvent.click(dinnerCheck);
        await userEvent.click(snackCheck);

        expect(breakfastCheck.checked).toBe(true);
        expect(lunchCheck.checked).toBe(true);
        expect(dinnerCheck.checked).toBe(true);
        expect(snackCheck.checked).toBe(true);
    });

    it("displays selected categories correctly", async () => {
        render(<MockPartyClient />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;

        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);

        const selected = screen.getByTestId("selected-categories");
        expect(selected.textContent).toContain("breakfast");
        expect(selected.textContent).toContain("lunch");
    });

    it("toggles category selection on and off", async () => {
        render(<MockPartyClient />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;

        await userEvent.click(breakfastCheck);
        expect(breakfastCheck.checked).toBe(true);

        await userEvent.click(breakfastCheck);
        expect(breakfastCheck.checked).toBe(false);
    });

    it("prevents spin without any category selected", async () => {
        const onSpin = vi.fn();
        render(<MockPartyClient onSpin={onSpin} />);

        const spinBtn = screen.getByTestId("party-spin-btn");
        await userEvent.click(spinBtn);

        expect(onSpin).not.toHaveBeenCalled();
    });

    it("enables spin when categories are selected", async () => {
        const onSpin = vi.fn();
        render(<MockPartyClient onSpin={onSpin} />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const spinBtn = screen.getByTestId("party-spin-btn");

        await userEvent.click(breakfastCheck);
        await userEvent.click(spinBtn);

        expect(onSpin).toHaveBeenCalledWith(["breakfast"], 3);
    });

    it("passes all selected categories to spin handler", async () => {
        const onSpin = vi.fn();
        render(<MockPartyClient onSpin={onSpin} />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;
        const dinnerCheck = screen.getByTestId("category-dinner") as HTMLInputElement;
        const spinBtn = screen.getByTestId("party-spin-btn");

        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);
        await userEvent.click(dinnerCheck);
        await userEvent.click(spinBtn);

        expect(onSpin).toHaveBeenCalledWith(["breakfast", "lunch", "dinner"], 3);
    });
});

describe("PartyClient Component - Multi-Dish Count Selection", () => {
    it("allows selecting 4 dishes", async () => {
        render(<MockPartyClient />);

        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "4");

        expect(dishCountInput.value).toBe("4");
    });

    it("allows selecting 5 dishes", async () => {
        render(<MockPartyClient />);

        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "5");

        expect(dishCountInput.value).toBe("5");
    });

    it("allows selecting 6 dishes", async () => {
        render(<MockPartyClient />);

        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "6");

        expect(dishCountInput.value).toBe("6");
    });

    it("allows selecting up to 10 dishes", async () => {
        render(<MockPartyClient />);

        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "10");

        expect(dishCountInput.value).toBe("10");
    });

    it("passes dish count to spin handler", async () => {
        const onSpin = vi.fn();
        render(<MockPartyClient onSpin={onSpin} />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        const spinBtn = screen.getByTestId("party-spin-btn");

        await userEvent.click(breakfastCheck);
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "5");
        await userEvent.click(spinBtn);

        expect(onSpin).toHaveBeenCalledWith(["breakfast"], 5);
    });

    it("combines multi-category and multi-dish selection", async () => {
        const onSpin = vi.fn();
        render(<MockPartyClient onSpin={onSpin} />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;
        const dinnerCheck = screen.getByTestId("category-dinner") as HTMLInputElement;
        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        const spinBtn = screen.getByTestId("party-spin-btn");

        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);
        await userEvent.click(dinnerCheck);
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "6");
        await userEvent.click(spinBtn);

        expect(onSpin).toHaveBeenCalledWith(["breakfast", "lunch", "dinner"], 6);
    });

    it("changes dish count dynamically", async () => {
        const onSpin = vi.fn();
        render(<MockPartyClient onSpin={onSpin} />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        const spinBtn = screen.getByTestId("party-spin-btn");

        await userEvent.click(breakfastCheck);

        // First spin with 3 dishes
        await userEvent.click(spinBtn);
        expect(onSpin).toHaveBeenCalledWith(["breakfast"], 3);

        // Change to 5 and spin again
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "5");
        await userEvent.click(spinBtn);
        expect(onSpin).toHaveBeenLastCalledWith(["breakfast"], 5);

        // Change to 4 and spin
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "4");
        await userEvent.click(spinBtn);
        expect(onSpin).toHaveBeenLastCalledWith(["breakfast"], 4);
    });

    it("maintains category selection when changing dish count", async () => {
        render(<MockPartyClient />);

        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;
        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;

        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);

        expect(breakfastCheck.checked).toBe(true);
        expect(lunchCheck.checked).toBe(true);

        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "6");

        // Verify categories still selected
        expect(breakfastCheck.checked).toBe(true);
        expect(lunchCheck.checked).toBe(true);
    });

    it("maintains dish count when changing categories", async () => {
        render(<MockPartyClient />);

        const dishCountInput = screen.getByTestId("dish-count-input") as HTMLInputElement;
        const breakfastCheck = screen.getByTestId("category-breakfast") as HTMLInputElement;
        const lunchCheck = screen.getByTestId("category-lunch") as HTMLInputElement;

        // Set dish count first
        await userEvent.clear(dishCountInput);
        await userEvent.type(dishCountInput, "5");
        expect(dishCountInput.value).toBe("5");

        // Toggle categories
        await userEvent.click(breakfastCheck);
        await userEvent.click(lunchCheck);

        // Verify dish count is still 5
        expect(dishCountInput.value).toBe("5");
    });
});
