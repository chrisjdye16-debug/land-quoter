import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCsvShots } from "@/lib/csvShots";

// POST: add shots — either { shots: [...] } JSON, or { csv: "..." } CSV text.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const body = await req.json();
  let shots: any[] = [];

  if (typeof body.csv === "string") {
    shots = parseCsvShots(body.csv).map((s) => ({ ...s, source: "csv" }));
  } else if (Array.isArray(body.shots)) {
    shots = body.shots
      .filter((s: any) => Number.isFinite(Number(s.elevation)))
      .map((s: any) => ({
        pointId: s.pointId ?? null,
        northing: s.northing != null ? Number(s.northing) : null,
        easting: s.easting != null ? Number(s.easting) : null,
        elevation: Number(s.elevation),
        source: s.source || "manual",
      }));
  }

  if (!shots.length) return NextResponse.json({ created: 0 });

  await prisma.topoShot.createMany({
    data: shots.map((s) => ({
      projectId,
      pointId: s.pointId,
      northing: s.northing,
      easting: s.easting,
      elevation: s.elevation,
      source: s.source,
    })),
  });

  return NextResponse.json({ created: shots.length });
}

// DELETE: clear all shots for project, or one shot via ?shotId=
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const shotId = req.nextUrl.searchParams.get("shotId");
  if (shotId) {
    await prisma.topoShot.delete({ where: { id: shotId } });
  } else {
    await prisma.topoShot.deleteMany({ where: { projectId } });
  }
  return NextResponse.json({ ok: true });
}
