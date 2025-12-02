import "server-only";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const dishId = url.searchParams.get("dishId");

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const where: any = { userId };
    if (dishId) where.dishId = dishId;

    const list = await prisma.triedMeal.findMany({ where, orderBy: { dateTried: "desc" }, include: { dish: true } });
    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, dishId, notes, rating } = body as { userId?: string; dishId?: string; notes?: string; rating?: number };
    if (!userId || !dishId) return NextResponse.json({ error: "Missing userId or dishId" }, { status: 400 });

    const created = await prisma.triedMeal.create({ data: { userId, dishId, notes: notes ?? null, rating: rating ?? null } });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
