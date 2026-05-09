import { NextRequest, NextResponse } from "next/server";
import { getPrisma, ensureSchema } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();
    const prisma = await getPrisma();
    const leads = await prisma.lead.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { projects: true } } },
    });
    return NextResponse.json(leads);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const prisma = await getPrisma();
    const body = await req.json();
    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        company: body.company || null,
        email: body.email || null,
        phone: body.phone || null,
        source: body.source || null,
        status: body.status || "new",
        notes: body.notes || null,
      },
    });
    return NextResponse.json(lead);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
