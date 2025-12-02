import "server-only";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const { notes, rating } = body as { notes?: string; rating?: number };
    const updated = await prisma.triedMeal.update({ where: { id }, data: { notes: notes ?? undefined, rating: rating ?? undefined } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await prisma.triedMeal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
