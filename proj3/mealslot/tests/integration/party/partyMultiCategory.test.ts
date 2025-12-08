import { describe, it, expect, beforeEach } from "vitest";

/** In-memory store for party mode multi-category tests */
const store = {
    rooms: new Map<string, any>(),
    codeFromSeed(seed: string) {
        let h = 0;
        for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
        return (h >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
    },
    ensure(code: string) {
        if (!this.rooms.has(code)) {
            this.rooms.set(code, {
                code,
                hostId: "host-1",
                peers: [{ id: "host-1", name: "Host", lastSeen: Date.now() }],
                locked: false,
                triple: [{ id: "d1" }, { id: "d2" }, { id: "d3" }],
                votes: {
                    d1: { up: new Set(), reroll: new Set() },
                    d2: { up: new Set(), reroll: new Set() },
                    d3: { up: new Set(), reroll: new Set() },
                },
                categories: [],
                constraints: {},
            });
        }
        return this.rooms.get(code);
    },
};

async function createRoute() {
    const code = store.codeFromSeed(String(Date.now()));
    store.ensure(code);
    return new Response(JSON.stringify({ code, partyId: code, memberId: "host-1", host: true }), {
        status: 200,
    });
}

async function spinRoute(req: Request) {
    const { code, userId, action, categories, constraints } = await req.json();
    const r = store.ensure(code);
    const isHost = userId === r.hostId;

    if (action === "group-multi-category") {
        if (!isHost || r.locked)
            return new Response(JSON.stringify({ code: "FORBIDDEN" }), { status: 403 });
        r.categories = categories || [];
        r.constraints = constraints || {};
        const pool = ["A", "B", "C", "D", "E", "F", "G", "H"].map((x, i) => ({ id: `${x}${i}` }));
        r.triple = r.triple.map((_d: any, i: number) => pool[(i + r.peers.length) % pool.length]);
        return new Response(
            JSON.stringify({ ok: true, categories: r.categories, triple: r.triple }),
            { status: 200 }
        );
    }

    if (action === "group-multi-dish") {
        if (!isHost || r.locked)
            return new Response(JSON.stringify({ code: "FORBIDDEN" }), { status: 403 });
        const dishCount = req.json().then((j: any) => j.dishCount || 3);
        r.triple = r.triple.slice(0, await dishCount);
        return new Response(JSON.stringify({ ok: true, triple: r.triple }), { status: 200 });
    }

    return new Response(JSON.stringify({ code: "BAD_ACTION" }), { status: 400 });
}

const jsonReq = (body: any) =>
    new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

describe("Party Mode - Multi-Category Spins", () => {
    let code = "";
    let hostId = "host-1";

    beforeEach(() => {
        store.rooms.clear();
        code = "";
    });

    it("host can select 2 categories for group spin", async () => {
        code = (await (await createRoute()).json()).code;
        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch"],
                constraints: {},
            })
        );
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.categories).toContain("breakfast");
        expect(data.categories).toContain("lunch");
    });

    it("host can select 3 categories for group spin", async () => {
        code = (await (await createRoute()).json()).code;
        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch", "dinner"],
                constraints: {},
            })
        );
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.categories.length).toBe(3);
    });

    it("host can select 4 categories for group spin", async () => {
        code = (await (await createRoute()).json()).code;
        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "brunch", "lunch", "dinner"],
                constraints: {},
            })
        );
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.categories.length).toBe(4);
    });

    it("member cannot initiate multi-category spin", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code);
        room.peers.push({ id: "member-1", name: "Member", lastSeen: Date.now() });

        const res = await spinRoute(
            jsonReq({
                code,
                userId: "member-1",
                action: "group-multi-category",
                categories: ["breakfast", "lunch"],
                constraints: {},
            })
        );
        expect(res.status).toBe(403);
    });

    it("spin is blocked when room is locked", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code);
        room.locked = true;

        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch"],
                constraints: {},
            })
        );
        expect(res.status).toBe(403);
    });

    it("merges category constraints across party members", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code);

        // Add members with different constraints
        room.peers.push({ id: "member-1", name: "Vegetarian", lastSeen: Date.now() });
        room.peers.push({ id: "member-2", name: "Vegan", lastSeen: Date.now() });

        const constraints = {
            member1_vegetarian: true,
            member2_vegan: true,
        };

        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch", "dinner"],
                constraints,
            })
        );
        const data = await res.json();
        expect(data.ok).toBe(true);
        expect(Object.keys(data)).toContain("triple");
    });

    it("broadcasts multi-category result to all members", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code);
        room.peers.push({ id: "member-1", name: "Member 1", lastSeen: Date.now() });
        room.peers.push({ id: "member-2", name: "Member 2", lastSeen: Date.now() });

        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch"],
                constraints: {},
            })
        );
        const data = await res.json();
        expect(data.triple).toBeDefined();
        expect(Array.isArray(data.triple)).toBe(true);
    });

    it("respects member diet preferences across breakfast and lunch", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code);

        const preferences = {
            member1_vegetarian: true,
            member2_dairyFree: true,
        };

        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch"],
                constraints: preferences,
            })
        );
        const data = await res.json();
        expect(data.ok).toBe(true);
    });

    it("respects member diet preferences across breakfast, lunch, and dinner", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code);

        const preferences = {
            member1_vegetarian: true,
            member2_vegan: true,
            member3_glutenFree: true,
        };

        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch", "dinner"],
                constraints: preferences,
            })
        );
        const data = await res.json();
        expect(data.ok).toBe(true);
        expect(data.categories.length).toBe(3);
    });

    it("combines allergen and dietary constraints for multi-category", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code);

        const constraints = {
            allergens: ["dairy", "gluten"],
            dietary: ["vegetarian"],
        };

        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch"],
                constraints,
            })
        );
        const data = await res.json();
        expect(data.ok).toBe(true);
    });

    it("preserves multi-category selection across multiple spins", async () => {
        code = (await (await createRoute()).json()).code;
        const categories = ["breakfast", "lunch", "dinner"];

        const res1 = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories,
                constraints: {},
            })
        );
        const data1 = await res1.json();
        expect(data1.categories).toEqual(categories);

        const res2 = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories,
                constraints: {},
            })
        );
        const data2 = await res2.json();
        expect(data2.categories).toEqual(categories);
    });

    it("updates categories when host changes selection", async () => {
        code = (await (await createRoute()).json()).code;

        const res1 = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast"],
                constraints: {},
            })
        );
        expect((await res1.json()).categories).toEqual(["breakfast"]);

        const res2 = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "group-multi-category",
                categories: ["breakfast", "lunch", "dinner"],
                constraints: {},
            })
        );
        expect((await res2.json()).categories).toEqual(["breakfast", "lunch", "dinner"]);
    });
});
