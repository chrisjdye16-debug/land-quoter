import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.leadId || !body.name) {
    return NextResponse.json({ error: "leadId and name required" }, { status: 400 });
  }
  const project = await prisma.project.create({
    data: {
      leadId: body.leadId,
      name: body.name,
      location: body.location || null,
      acreage: body.acreage != null ? Number(body.acreage) : null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(project);
}
