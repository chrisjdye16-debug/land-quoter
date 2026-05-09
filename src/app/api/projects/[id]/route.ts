import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lead: true,
      estimates: { orderBy: { createdAt: "desc" } },
      topoShots: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const body = await req.json();
  if (body.acreage != null) body.acreage = Number(body.acreage);
  const project = await prisma.project.update({ where: { id }, data: body });
  return NextResponse.json(project);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
