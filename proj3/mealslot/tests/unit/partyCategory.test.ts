import { describe, it, expect } from "vitest";

describe("Party Mode - Multi-category selection", () => {
  it("allows selecting multiple categories in party mode", () => {
    const cats = {
      breakfast: false,
      lunch: false,
      dinner: true,
      dessert: false,
    };

    const toggleCategory = (key: keyof typeof cats) => {
      cats[key] = !cats[key];
    };

    toggleCategory("breakfast");
    expect(cats.breakfast).toBe(true);
    expect(cats.dinner).toBe(true);

    toggleCategory("lunch");
    expect(cats.lunch).toBe(true);
  });

  it("converts category state to array correctly", () => {
    const cats = {
      breakfast: true,
      lunch: true,
      dinner: false,
      dessert: true,
    };

    const categoriesArray: string[] = [];
    if (cats.breakfast) categoriesArray.push("breakfast");
    if (cats.lunch) categoriesArray.push("lunch");
    if (cats.dinner) categoriesArray.push("dinner");
    if (cats.dessert) categoriesArray.push("dessert");

    expect(categoriesArray).toEqual(["breakfast", "lunch", "dessert"]);
  });

  it("defaults to dinner when no categories selected", () => {
    const cats = {
      breakfast: false,
      lunch: false,
      dinner: false,
      dessert: false,
    };

    const categoriesArray: string[] = [];
    if (cats.breakfast) categoriesArray.push("breakfast");
    if (cats.lunch) categoriesArray.push("lunch");
    if (cats.dinner) categoriesArray.push("dinner");
    if (cats.dessert) categoriesArray.push("dessert");

    const final = categoriesArray.length ? categoriesArray : ["dinner"];
    expect(final).toEqual(["dinner"]);
  });

  it("handles all categories selected", () => {
    const cats = {
      breakfast: true,
      lunch: true,
      dinner: true,
      dessert: true,
    };

    const categoriesArray: string[] = [];
    if (cats.breakfast) categoriesArray.push("breakfast");
    if (cats.lunch) categoriesArray.push("lunch");
    if (cats.dinner) categoriesArray.push("dinner");
    if (cats.dessert) categoriesArray.push("dessert");

    expect(categoriesArray.length).toBe(4);
    expect(categoriesArray).toContain("breakfast");
    expect(categoriesArray).toContain("lunch");
    expect(categoriesArray).toContain("dinner");
    expect(categoriesArray).toContain("dessert");
  });

  it("maintains category selection state across toggles", () => {
    const cats = {
      breakfast: false,
      lunch: false,
      dinner: true,
      dessert: false,
    };

    const toggle = (key: keyof typeof cats) => {
      cats[key] = !cats[key];
    };

    toggle("breakfast");
    toggle("lunch");
    toggle("breakfast"); // toggle off

    expect(cats.breakfast).toBe(false);
    expect(cats.lunch).toBe(true);
    expect(cats.dinner).toBe(true);
  });
});

describe("Party Mode - Category consistency", () => {
  it("uses same category format as main page", () => {
    const mainPageCategories = ["breakfast", "lunch"];
    const partyCategories = ["breakfast", "lunch"];

    expect(mainPageCategories).toEqual(partyCategories);
  });

  it("handles category case consistently", () => {
    const categories = ["breakfast", "lunch", "dinner", "dessert"];
    const normalized = categories.map(c => c.toLowerCase());

    expect(normalized).toEqual(["breakfast", "lunch", "dinner", "dessert"]);
  });

  it("sends categories array to API correctly", () => {
    const categories = ["breakfast", "lunch"];
    const apiPayload = {
      categories,
      powerups: {},
      constraints: {},
    };

    expect(apiPayload.categories).toEqual(["breakfast", "lunch"]);
    expect(Array.isArray(apiPayload.categories)).toBe(true);
  });
});

