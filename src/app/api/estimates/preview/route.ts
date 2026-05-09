import { NextRequest, NextResponse } from "next/server";
import { getPrisma, ensureSchema } from "@/lib/db";
import { computeDirt } from "@/lib/dirt";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const prisma = await getPrisma();
    const body = await req.json();
    const { projectId, acreage, targetElevation, shrinkagePct, costPerCY, haulCostPerCY } = body;
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { topoShots: true },
    });
    if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

    const acres = Number(acreage ?? project.acreage ?? 0);
    if (!acres || !Number.isFinite(acres))
      return NextResponse.json({ error: "acreage required" }, { status: 400 });
    if (!Number.isFinite(Number(targetElevation)))
      return NextResponse.json({ error: "targetElevation required" }, { status: 400 });

    const result = computeDirt({
      acreage: acres,
      targetElevation: Number(targetElevation),
      shots: project.topoShots.map((s: any) => ({
        northing: s.northing,
        easting: s.easting,
        elevation: s.elevation,
      })),
      shrinkagePct: shrinkagePct != null ? Number(shrinkagePct) : 20,
      costPerCY: costPerCY != null ? Number(costPerCY) : 0,
      haulCostPerCY: haulCostPerCY != null ? Number(haulCostPerCY) : 0,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
