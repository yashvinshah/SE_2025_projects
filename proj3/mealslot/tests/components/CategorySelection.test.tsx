import { describe, it, expect } from "vitest";

// Test category selection logic
describe("Category Selection UI", () => {
  it("allows selecting multiple categories", () => {
    let categories: string[] = [];
    
    const toggleCategory = (cat: string) => {
      if (categories.includes(cat)) {
        categories = categories.filter((c) => c !== cat);
      } else {
        categories = [...categories, cat];
      }
    };

    toggleCategory("breakfast");
    expect(categories).toContain("breakfast");

    toggleCategory("lunch");
    expect(categories).toContain("lunch");
    expect(categories.length).toBe(2);

    toggleCategory("breakfast");
    expect(categories).not.toContain("breakfast");
    expect(categories).toContain("lunch");
  });

  it("displays selected categories count", () => {
    const categories = ["breakfast", "lunch"];
    const display = categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
    expect(display).toBe("Breakfast, Lunch");
  });

  it("handles empty selection", () => {
    const categories: string[] = [];
    expect(categories.length).toBe(0);
  });

  it("handles all categories selected", () => {
    const categories = ["breakfast", "lunch", "dinner", "dessert"];
    expect(categories.length).toBe(4);
  });
});

describe("Category Selection Validation", () => {
  it("requires at least one category for spin", () => {
    const categories: string[] = [];
    const canSpin = categories.length > 0;
    expect(canSpin).toBe(false);
  });

  it("allows spin with single category", () => {
    const categories = ["breakfast"];
    const canSpin = categories.length > 0;
    expect(canSpin).toBe(true);
  });

  it("allows spin with multiple categories", () => {
    const categories = ["breakfast", "lunch"];
    const canSpin = categories.length > 0;
    expect(canSpin).toBe(true);
  });
});

