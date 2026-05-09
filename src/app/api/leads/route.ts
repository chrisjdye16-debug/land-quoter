import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/db";

export async function GET() {
  await ensureSchema();
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  await ensureSchema();
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
}
