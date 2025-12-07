import { describe, it, expect, beforeEach } from "vitest";

const triedStore = {
    triedDishes: new Map<string, any>(),
    add(userId: string, dishId: string, dishName: string) {
        const id = `tried_${userId}_${dishId}`;
        if (this.triedDishes.has(id)) return null;
        this.triedDishes.set(id, {
            id,
            userId,
            dishId,
            dishName,
            dateTried: new Date().toISOString(),
            notes: "",
            rating: null,
        });
        return this.triedDishes.get(id);
    },
    getByUserAndDish(userId: string, dishId: string) {
        const entries = Array.from(this.triedDishes.values());
        return entries.filter((item) => item.userId === userId && item.dishId === dishId);
    },
    getByUser(userId: string) {
        return Array.from(this.triedDishes.values()).filter((item) => item.userId === userId);
    },
    update(id: string, notes?: string, rating?: number) {
        const item = this.triedDishes.get(id);
        if (!item) return null;
        if (notes !== undefined) item.notes = notes;
        if (rating !== undefined) item.rating = rating;
        return item;
    },
    delete(id: string) {
        return this.triedDishes.delete(id);
    },
    clear() {
        this.triedDishes.clear();
    },
};

async function getTriedRoute(userId: string, dishId?: string) {
    if (dishId) {
        const items = triedStore.getByUserAndDish(userId, dishId);
        return new Response(JSON.stringify(items), { status: 200 });
    }
    const items = triedStore.getByUser(userId);
    return new Response(JSON.stringify(items), { status: 200 });
}

async function postTriedRoute(req: Request) {
    const { userId, dishId, dishName } = await req.json();
    const existing = triedStore.getByUserAndDish(userId, dishId);
    if (existing.length > 0) {
        return new Response(JSON.stringify({ code: "ALREADY_TRIED" }), { status: 409 });
    }
    const item = triedStore.add(userId, dishId, dishName);
    return new Response(JSON.stringify(item), { status: 201 });
}

async function patchTriedRoute(id: string, req: Request) {
    const { notes, rating } = await req.json();
    const item = triedStore.update(id, notes, rating);
    if (!item) {
        return new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 });
    }
    return new Response(JSON.stringify(item), { status: 200 });
}

async function deleteTriedRoute(id: string) {
    const exists = triedStore.triedDishes.has(id);
    if (!exists) {
        return new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 });
    }
    triedStore.delete(id);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

const jsonReq = (body: any) =>
    new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

const jsonPatchReq = (body: any) =>
    new Request("http://local", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

describe("Tried Dishes - Core Functionality", () => {
    beforeEach(() => {
        triedStore.clear();
    });

    it("marks a dish as tried by user", async () => {
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Margherita Pizza",
            })
        );
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.dishId).toBe("dish-pizza");
    });

    it("prevents marking same dish as tried twice", async () => {
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );

        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        expect(res.status).toBe(409);
    });

    it("checks if a dish is tried by user", async () => {
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );

        const res = await getTriedRoute("user-1", "dish-pizza");
        const data = await res.json();
        expect(data.length).toBe(1);
    });

    it("retrieves all tried dishes for a user", async () => {
        await postTriedRoute(jsonReq({ userId: "user-1", dishId: "dish-pizza", dishName: "Pizza" }));
        await postTriedRoute(jsonReq({ userId: "user-1", dishId: "dish-burger", dishName: "Burger" }));

        const res = await getTriedRoute("user-1");
        const data = await res.json();
        expect(data.length).toBe(2);
    });

    it("isolates tried dishes per user", async () => {
        await postTriedRoute(jsonReq({ userId: "user-1", dishId: "dish-pizza", dishName: "Pizza" }));
        await postTriedRoute(jsonReq({ userId: "user-2", dishId: "dish-burger", dishName: "Burger" }));

        const user1 = await getTriedRoute("user-1");
        const user1Data = await user1.json();
        expect(user1Data.length).toBe(1);
        expect(user1Data[0].dishId).toBe("dish-pizza");

        const user2 = await getTriedRoute("user-2");
        const user2Data = await user2.json();
        expect(user2Data[0].dishId).toBe("dish-burger");
    });
});

describe("Tried Dishes - Review & Rating", () => {
    let triedId: string;

    beforeEach(async () => {
        triedStore.clear();
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        const data = await res.json();
        triedId = data.id;
    });

    it("adds a review/notes to a tried dish", async () => {
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Delicious and crispy!",
            })
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.notes).toBe("Delicious and crispy!");
    });

    it("adds a rating to a tried dish", async () => {
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                rating: 5,
            })
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.rating).toBe(5);
    });

    it("adds both review and rating", async () => {
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Amazing",
                rating: 4.5,
            })
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.notes).toBe("Amazing");
        expect(data.rating).toBe(4.5);
    });

    it("updates review on a tried dish", async () => {
        await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Good",
                rating: 3,
            })
        );

        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Actually great!",
                rating: 5,
            })
        );
        const data = await res.json();
        expect(data.notes).toBe("Actually great!");
        expect(data.rating).toBe(5);
    });

    it("handles partial updates (notes only)", async () => {
        await patchTriedRoute(
            triedId,
            jsonPatchReq({
                rating: 4,
            })
        );

        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Perfect crust",
            })
        );
        const data = await res.json();
        expect(data.notes).toBe("Perfect crust");
        expect(data.rating).toBe(4);
    });

    it("allows ratings from 0 to 5", async () => {
        const ratings = [0, 1, 2.5, 3, 4.5, 5];
        for (const rating of ratings) {
            const res = await patchTriedRoute(
                triedId,
                jsonPatchReq({ rating })
            );
            const data = await res.json();
            expect(data.rating).toBe(rating);
        }
    });
});

describe("Tried Dishes - Deletion & Management", () => {
    let triedId: string;

    beforeEach(async () => {
        triedStore.clear();
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        const data = await res.json();
        triedId = data.id;
    });

    it("deletes a tried dish", async () => {
        const res = await deleteTriedRoute(triedId);
        expect(res.status).toBe(200);

        const checkRes = await getTriedRoute("user-1", "dish-pizza");
        const checkData = await checkRes.json();
        expect(checkData.length).toBe(0);
    });

    it("removes tried dish with review and rating", async () => {
        await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Great!",
                rating: 5,
            })
        );

        const res = await deleteTriedRoute(triedId);
        expect(res.status).toBe(200);
    });

    it("allows re-trying a deleted dish", async () => {
        await deleteTriedRoute(triedId);

        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        expect(res.status).toBe(201);
    });

    it("returns error when deleting non-existent", async () => {
        const res = await deleteTriedRoute("non-existent");
        expect(res.status).toBe(404);
    });
});

if (this.triedDishes.has(id)) return null;
this.triedDishes.set(id, {
    id,
    userId,
    dishId,
    dishName,
    dateTried: new Date().toISOString(),
    notes: "",
    rating: null,
});
return this.triedDishes.get(id);
  },
getByUserAndDish(userId: string, dishId: string) {
    const entries = Array.from(this.triedDishes.values());
    return entries.filter((item) => item.userId === userId && item.dishId === dishId);
},
getByUser(userId: string) {
    return Array.from(this.triedDishes.values()).filter((item) => item.userId === userId);
},
update(id: string, notes ?: string, rating ?: number) {
    const item = this.triedDishes.get(id);
    if (!item) return null;
    if (notes !== undefined) item.notes = notes;
    if (rating !== undefined) item.rating = rating;
    return item;
},
delete (id: string) {
    return this.triedDishes.delete(id);
},
clear() {
    this.triedDishes.clear();
},
};

async function getTriedRoute(userId: string, dishId?: string) {
    if (dishId) {
        const items = triedStore.getByUserAndDish(userId, dishId);
        return new Response(JSON.stringify(items), { status: 200 });
    }
    const items = triedStore.getByUser(userId);
    return new Response(JSON.stringify(items), { status: 200 });
}

async function postTriedRoute(req: Request) {
    const { userId, dishId, dishName, notes = "", rating = null } = await req.json();
    const existing = triedStore.getByUserAndDish(userId, dishId);
    if (existing.length > 0) {
        return new Response(JSON.stringify({ code: "ALREADY_TRIED" }), { status: 409 });
    }
    const item = triedStore.add(userId, dishId, dishName);
    return new Response(JSON.stringify(item), { status: 201 });
}

async function patchTriedRoute(id: string, req: Request) {
    const { notes, rating } = await req.json();
    const item = triedStore.update(id, notes, rating);
    if (!item) {
        return new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 });
    }
    return new Response(JSON.stringify(item), { status: 200 });
}

async function deleteTriedRoute(id: string) {
    const exists = triedStore.triedDishes.has(id);
    if (!exists) {
        return new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 });
    }
    triedStore.delete(id);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

const jsonReq = (body: any) =>
    new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

const jsonPatchReq = (body: any) =>
    new Request("http://local", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

describe("Tried Dishes - Core Functionality", () => {
    beforeEach(() => {
        triedStore.clear();
    });

    it("marks a dish as tried by user", async () => {
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Margherita Pizza",
                notes: "",
                rating: null,
            })
        );
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.dishId).toBe("dish-pizza");
        expect(data.userId).toBe("user-1");
    });

    it("prevents marking same dish as tried twice", async () => {
        // First attempt
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Margherita Pizza",
            })
        );

        // Second attempt should fail
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Margherita Pizza",
            })
        );
        expect(res.status).toBe(409);
    });

    it("checks if a specific dish is tried by user", async () => {
        // Mark as tried
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Margherita Pizza",
            })
        );

        // Check if tried
        const res = await getTriedRoute("user-1", "dish-pizza");
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(1);
        expect(data[0].dishId).toBe("dish-pizza");
    });

    it("checks if a non-tried dish returns empty array", async () => {
        const res = await getTriedRoute("user-1", "dish-burger");
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0);
    });

    it("retrieves all tried dishes for a user", async () => {
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-burger",
                dishName: "Burger",
            })
        );
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-taco",
                dishName: "Taco",
            })
        );

        const res = await getTriedRoute("user-1");
        const data = await res.json();
        expect(data.length).toBe(3);
        expect(data.map((d: any) => d.dishId)).toContain("dish-pizza");
        expect(data.map((d: any) => d.dishId)).toContain("dish-burger");
        expect(data.map((d: any) => d.dishId)).toContain("dish-taco");
    });

    it("isolates tried dishes per user", async () => {
        await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        await postTriedRoute(
            jsonReq({
                userId: "user-2",
                dishId: "dish-burger",
                dishName: "Burger",
            })
        );

        const user1Tried = await getTriedRoute("user-1");
        const user1Data = await user1Tried.json();
        expect(user1Data.length).toBe(1);
        expect(user1Data[0].dishId).toBe("dish-pizza");

        const user2Tried = await getTriedRoute("user-2");
        const user2Data = await user2Tried.json();
        expect(user2Data.length).toBe(1);
        expect(user2Data[0].dishId).toBe("dish-burger");
    });

    it("stores timestamp when dish is marked as tried", async () => {
        const before = new Date();
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        const after = new Date();
        const data = await res.json();

        const dateTried = new Date(data.dateTried);
        expect(dateTried.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(dateTried.getTime()).toBeLessThanOrEqual(after.getTime());
    });
});

describe("Tried Dishes - Review & Rating", () => {
    let triedId: string;

    beforeEach(async () => {
        triedStore.clear();
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        const data = await res.json();
        triedId = data.id;
    });

    it("adds a review/notes to a tried dish", async () => {
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Delicious and crispy!",
                rating: null,
            })
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.notes).toBe("Delicious and crispy!");
    });

    it("adds a rating to a tried dish", async () => {
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                rating: 5,
            })
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.rating).toBe(5);
    });

    it("adds both review and rating to a tried dish", async () => {
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Amazing flavors, would eat again",
                rating: 4.5,
            })
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.notes).toBe("Amazing flavors, would eat again");
        expect(data.rating).toBe(4.5);
    });

    it("updates review on a tried dish", async () => {
        // Add initial review
        await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Good",
                rating: 3,
            })
        );

        // Update review
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Actually, it was great!",
                rating: 5,
            })
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.notes).toBe("Actually, it was great!");
        expect(data.rating).toBe(5);
    });

    it("handles partial updates (notes only)", async () => {
        // Set initial rating
        await patchTriedRoute(
            triedId,
            jsonPatchReq({
                rating: 4,
            })
        );

        // Update only notes
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Perfect crust",
            })
        );
        const data = await res.json();
        expect(data.notes).toBe("Perfect crust");
        expect(data.rating).toBe(4);
    });

    it("handles partial updates (rating only)", async () => {
        // Set initial notes
        await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Really good",
            })
        );

        // Update only rating
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                rating: 4.5,
            })
        );
        const data = await res.json();
        expect(data.notes).toBe("Really good");
        expect(data.rating).toBe(4.5);
    });

    it("allows ratings from 0 to 5", async () => {
        const ratings = [0, 1, 2, 2.5, 3, 3.5, 4, 4.5, 5];

        for (const rating of ratings) {
            const res = await patchTriedRoute(
                triedId,
                jsonPatchReq({ rating })
            );
            const data = await res.json();
            expect(data.rating).toBe(rating);
        }
    });

    it("handles empty/null notes correctly", async () => {
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "",
                rating: 3,
            })
        );
        const data = await res.json();
        expect(data.notes).toBe("");
        expect(data.rating).toBe(3);
    });

    it("handles long review text", async () => {
        const longReview = "This pizza was absolutely incredible! The crust was perfectly crispy on the outside yet soft on the inside. The sauce had just the right amount of basil and garlic. The cheese was melted to perfection. Highly recommend!";
        const res = await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: longReview,
                rating: 5,
            })
        );
        const data = await res.json();
        expect(data.notes).toBe(longReview);
    });

    it("returns error when updating non-existent tried dish", async () => {
        const res = await patchTriedRoute(
            "non-existent-id",
            jsonPatchReq({
                notes: "Test",
                rating: 5,
            })
        );
        expect(res.status).toBe(404);
    });
});

describe("Tried Dishes - Deletion & Management", () => {
    let triedId: string;

    beforeEach(async () => {
        triedStore.clear();
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        const data = await res.json();
        triedId = data.id;
    });

    it("deletes a tried dish", async () => {
        const res = await deleteTriedRoute(triedId);
        expect(res.status).toBe(200);

        // Verify it's deleted
        const checkRes = await getTriedRoute("user-1", "dish-pizza");
        const checkData = await checkRes.json();
        expect(checkData.length).toBe(0);
    });

    it("removes tried dish with review and rating", async () => {
        // Add review and rating
        await patchTriedRoute(
            triedId,
            jsonPatchReq({
                notes: "Great pizza!",
                rating: 5,
            })
        );

        // Delete
        const res = await deleteTriedRoute(triedId);
        expect(res.status).toBe(200);

        // Verify it's deleted
        const checkRes = await getTriedRoute("user-1", "dish-pizza");
        const checkData = await checkRes.json();
        expect(checkData.length).toBe(0);
    });

    it("allows re-trying a deleted dish", async () => {
        // Delete first try
        await deleteTriedRoute(triedId);

        // Try again
        const res = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        expect(res.status).toBe(201);
    });

    it("returns error when deleting non-existent tried dish", async () => {
        const res = await deleteTriedRoute("non-existent-id");
        expect(res.status).toBe(404);
    });

    it("allows multiple tried dishes for different users to be deleted independently", async () => {
        // User 1 tries pizza
        const res1 = await postTriedRoute(
            jsonReq({
                userId: "user-1",
                dishId: "dish-pizza",
                dishName: "Pizza",
            })
        );
        const data1 = await res1.json();

        // User 2 tries burger
        const res2 = await postTriedRoute(
            jsonReq({
                userId: "user-2",
                dishId: "dish-burger",
                dishName: "Burger",
            })
        );
        const data2 = await res2.json();

        // Delete user 1's pizza
        await deleteTriedRoute(data1.id);

        // User 1's pizza should be gone
        const user1Check = await getTriedRoute("user-1", "dish-pizza");
        const user1Data = await user1Check.json();
        expect(user1Data.length).toBe(0);

        // User 2's burger should still exist
        const user2Check = await getTriedRoute("user-2", "dish-burger");
        const user2Data = await user2Check.json();
        expect(user2Data.length).toBe(1);
    });
});

describe("Tried Dishes - Multi-Dish Scenarios", () => {
    beforeEach(() => {
        triedStore.clear();
    });

    it("marks multiple dishes as tried and retrieves them all", async () => {
        const dishes = [
            { id: "pizza", name: "Margherita Pizza" },
            { id: "burger", name: "Cheeseburgger" },
            { id: "sushi", name: "Salmon Sushi" },
            { id: "pasta", name: "Carbonara" },
            { id: "taco", name: "Carne Asada Taco" },
        ];

        for (const dish of dishes) {
            await postTriedRoute(
                jsonReq({
                    userId: "user-1",
                    dishId: dish.id,
                    dishName: dish.name,
                })
            );
        }

        const res = await getTriedRoute("user-1");
        const data = await res.json();
        expect(data.length).toBe(5);
    });

    it("adds reviews to multiple tried dishes", async () => {
        // Mark dishes as tried
        const dishes = ["pizza", "burger", "sushi"];
        const triedIds: string[] = [];

        for (const dishId of dishes) {
            const res = await postTriedRoute(
                jsonReq({
                    userId: "user-1",
                    dishId,
                    dishName: dishId,
                })
            );
            const data = await res.json();
            triedIds.push(data.id);
        }

        // Add reviews to each
        const reviews = ["Amazing!", "Very good", "Perfect"];
        const ratings = [5, 4, 5];

        for (let i = 0; i < triedIds.length; i++) {
            const updateRes = await patchTriedRoute(
                triedIds[i],
                jsonPatchReq({
                    notes: reviews[i],
                    rating: ratings[i],
                })
            );
            expect(updateRes.status).toBe(200);
        }

        // Verify all reviews are saved
        const allTriedRes = await getTriedRoute("user-1");
        const allTriedData = await allTriedRes.json();
        expect(allTriedData.every((item: any) => item.notes && item.rating)).toBe(true);
    });

    it("handles deletion of some tried dishes while keeping others", async () => {
        const dishes = ["pizza", "burger", "sushi"];
        const triedIds: string[] = [];

        for (const dishId of dishes) {
            const res = await postTriedRoute(
                jsonReq({
                    userId: "user-1",
                    dishId,
                    dishName: dishId,
                })
            );
            const data = await res.json();
            triedIds.push(data.id);
        }

        // Delete middle one
        await deleteTriedRoute(triedIds[1]);

        // Check remaining
        const res = await getTriedRoute("user-1");
        const data = await res.json();
        expect(data.length).toBe(2);
        expect(data.map((d: any) => d.dishId)).toContain("pizza");
        expect(data.map((d: any) => d.dishId)).toContain("sushi");
    });

    it("tracks tried dishes across party spins", async () => {
        // Simulate party spin results
        const spinResults = [
            { dishId: "pizza-1", name: "Pepperoni" },
            { dishId: "burger-1", name: "Classic Burger" },
            { dishId: "pasta-1", name: "Penne Arrabbiata" },
        ];

        // All party members mark spun dishes as tried
        for (const dish of spinResults) {
            await postTriedRoute(
                jsonReq({
                    userId: "user-1",
                    dishId: dish.dishId,
                    dishName: dish.name,
                })
            );
        }

        // Verify all spin results are in tried
        const res = await getTriedRoute("user-1");
        const data = await res.json();
        expect(data.length).toBe(3);
        expect(data.map((d: any) => d.dishId)).toEqual([
            "pizza-1",
            "burger-1",
            "pasta-1",
        ]);
    });

    it("verifies dish status across multi-category selections", async () => {
        const categories = {
            breakfast: ["pancakes", "eggs", "bacon"],
            lunch: ["sandwich", "salad", "soup"],
            dinner: ["steak", "salmon", "chicken"],
        };

        // Mark some dishes as tried
        const triedDishes = ["pancakes", "sandwich", "salmon"];

        for (const dish of triedDishes) {
            await postTriedRoute(
                jsonReq({
                    userId: "user-1",
                    dishId: dish,
                    dishName: dish,
                })
            );
        }

        // Check status of all dishes in a category
        for (const dish of categories.breakfast) {
            const res = await getTriedRoute("user-1", dish);
            const data = await res.json();
            if (triedDishes.includes(dish)) {
                expect(data.length).toBeGreaterThan(0);
            } else {
                expect(data.length).toBe(0);
            }
        }
    });
});
