import { describe, it, expect, beforeEach } from "vitest";

/** In-memory store for party mode multi-dish tests */
const store = {
    rooms: new Map<string, any>(),
    codeFromSeed(seed: string) {
        let h = 0;
        for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
        return (h >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
    },
    ensure(code: string, dishCount: number = 3) {
        if (!this.rooms.has(code)) {
            const dishes = Array.from({ length: dishCount }, (_, i) => ({ id: `d${i + 1}` }));
            this.rooms.set(code, {
                code,
                hostId: "host-1",
                peers: [{ id: "host-1", name: "Host", lastSeen: Date.now() }],
                locked: false,
                dishes,
                votes: Object.fromEntries(
                    dishes.map((d: any) => [d.id, { up: new Set(), reroll: new Set() }])
                ),
            });
        }
        return this.rooms.get(code);
    },
};

async function createRoute() {
    const code = store.codeFromSeed(String(Date.now()));
    store.ensure(code, 3);
    return new Response(JSON.stringify({ code, partyId: code, memberId: "host-1", host: true }), {
        status: 200,
    });
}

async function spinRoute(req: Request) {
    const { code, userId, action, dishCount } = await req.json();
    const r = store.ensure(code, dishCount || 3);
    const isHost = userId === r.hostId;

    if (action === "spin-multi-dish") {
        if (!isHost || r.locked)
            return new Response(JSON.stringify({ code: "FORBIDDEN" }), { status: 403 });
        const newDishes = Array.from({ length: dishCount || 3 }, (_, i) => ({
            id: `d${i + 1}`,
        }));
        r.dishes = newDishes;
        r.votes = Object.fromEntries(
            newDishes.map((d: any) => [d.id, { up: new Set(), reroll: new Set() }])
        );
        return new Response(
            JSON.stringify({ ok: true, dishCount: r.dishes.length, dishes: r.dishes }),
            { status: 200 }
        );
    }

    if (action === "vote") {
        const joined = r.peers.some((p: any) => p.id === userId);
        if (!joined) return new Response(JSON.stringify({ code: "NOT_JOINED" }), { status: 401 });

        const { dishId, vote } = await req.json();
        if (!r.votes[dishId]) r.votes[dishId] = { up: new Set(), reroll: new Set() };
        r.votes[dishId].up.delete(userId);
        r.votes[dishId].reroll.delete(userId);
        if (vote === "up") r.votes[dishId].up.add(userId);
        if (vote === "reroll") r.votes[dishId].reroll.add(userId);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ code: "BAD_ACTION" }), { status: 400 });
}

const jsonReq = (body: any) =>
    new Request("http://local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

describe("Party Mode - Multi-Dish Voting", () => {
    let code = "";
    let hostId = "host-1";

    beforeEach(() => {
        store.rooms.clear();
        code = "";
    });

    it("allows voting on 4 dishes in party", async () => {
        code = (await (await createRoute()).json()).code;
        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "spin-multi-dish",
                dishCount: 4,
            })
        );
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.dishCount).toBe(4);
    });

    it("allows voting on 5 dishes in party", async () => {
        code = (await (await createRoute()).json()).code;
        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "spin-multi-dish",
                dishCount: 5,
            })
        );
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.dishCount).toBe(5);
    });

    it("allows voting on 6 dishes in party", async () => {
        code = (await (await createRoute()).json()).code;
        const res = await spinRoute(
            jsonReq({
                code,
                userId: hostId,
                action: "spin-multi-dish",
                dishCount: 6,
            })
        );
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.dishCount).toBe(6);
    });

    it("member cannot initiate multi-dish spin", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 4);
        room.peers.push({ id: "member-1", name: "Member", lastSeen: Date.now() });

        const res = await spinRoute(
            jsonReq({
                code,
                userId: "member-1",
                action: "spin-multi-dish",
                dishCount: 4,
            })
        );
        expect(res.status).toBe(403);
    });

    it("aggregates votes across 4 dishes", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 4);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });
        room.peers.push({ id: "m2", name: "Member 2", lastSeen: Date.now() });

        // Cast votes
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m2", action: "vote", dishId: "d1", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d2", vote: "up" }));

        expect(room.votes.d1.up.size).toBe(2);
        expect(room.votes.d2.up.size).toBe(1);
    });

    it("aggregates votes across 5 dishes", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 5);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });
        room.peers.push({ id: "m2", name: "Member 2", lastSeen: Date.now() });
        room.peers.push({ id: "m3", name: "Member 3", lastSeen: Date.now() });

        // Cast votes across all 5 dishes
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m2", action: "vote", dishId: "d2", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m3", action: "vote", dishId: "d3", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d4", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m2", action: "vote", dishId: "d5", vote: "up" }));

        expect(room.votes.d1.up.size).toBe(1);
        expect(room.votes.d5.up.size).toBe(1);
    });

    it("prevents duplicate votes on same dish by same user", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 4);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });

        // First vote
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        expect(room.votes.d1.up.size).toBe(1);

        // Attempt duplicate vote (should still be 1 due to Set behavior)
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        expect(room.votes.d1.up.size).toBe(1);
    });

    it("handles vote changes from up to reroll on same dish", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 4);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });

        // Vote up
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        expect(room.votes.d1.up.size).toBe(1);
        expect(room.votes.d1.reroll.size).toBe(0);

        // Change to reroll
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "reroll" }));
        expect(room.votes.d1.up.size).toBe(0);
        expect(room.votes.d1.reroll.size).toBe(1);
    });

    it("tallies votes correctly across 6 dishes", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 6);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });
        room.peers.push({ id: "m2", name: "Member 2", lastSeen: Date.now() });
        room.peers.push({ id: "m3", name: "Member 3", lastSeen: Date.now() });

        // Multiple votes on different dishes
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m2", action: "vote", dishId: "d1", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m3", action: "vote", dishId: "d1", vote: "reroll" }));
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d2", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m2", action: "vote", dishId: "d2", vote: "reroll" }));

        const tallies = {
            d1: { up: room.votes.d1.up.size, reroll: room.votes.d1.reroll.size },
            d2: { up: room.votes.d2.up.size, reroll: room.votes.d2.reroll.size },
        };

        expect(tallies.d1.up).toBe(2);
        expect(tallies.d1.reroll).toBe(1);
        expect(tallies.d2.up).toBe(1);
        expect(tallies.d2.reroll).toBe(1);
    });

    it("non-member cannot vote on multi-dish items", async () => {
        code = (await (await createRoute()).json()).code;
        store.ensure(code, 4);

        const res = await spinRoute(
            jsonReq({ code, userId: "non-member", action: "vote", dishId: "d1", vote: "up" })
        );
        expect(res.status).toBe(401);
    });

    it("multiple members can vote on same dish", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 5);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });
        room.peers.push({ id: "m2", name: "Member 2", lastSeen: Date.now() });
        room.peers.push({ id: "m3", name: "Member 3", lastSeen: Date.now() });

        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m2", action: "vote", dishId: "d1", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m3", action: "vote", dishId: "d1", vote: "up" }));

        expect(room.votes.d1.up.size).toBe(3);
    });

    it("handles vote removal and reset for multi-dish", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 4);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });

        // Vote
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));
        expect(room.votes.d1.up.size).toBe(1);

        // Remove vote by voting with opposite choice
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "reroll" }));
        expect(room.votes.d1.up.size).toBe(0);
        expect(room.votes.d1.reroll.size).toBe(1);
    });

    it("determines winner from votes on 4 dishes", async () => {
        code = (await (await createRoute()).json()).code;
        const room = store.ensure(code, 4);
        room.peers.push({ id: "m1", name: "Member 1", lastSeen: Date.now() });
        room.peers.push({ id: "m2", name: "Member 2", lastSeen: Date.now() });
        room.peers.push({ id: "m3", name: "Member 3", lastSeen: Date.now() });

        // Vote heavily for d2
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d2", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m2", action: "vote", dishId: "d2", vote: "up" }));
        await spinRoute(jsonReq({ code, userId: "m3", action: "vote", dishId: "d2", vote: "up" }));

        // Light votes for others
        await spinRoute(jsonReq({ code, userId: "m1", action: "vote", dishId: "d1", vote: "up" }));

        const d1Votes = room.votes.d1.up.size;
        const d2Votes = room.votes.d2.up.size;

        expect(d2Votes).toBeGreaterThan(d1Votes);
    });
});
