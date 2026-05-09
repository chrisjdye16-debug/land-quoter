import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeDirt } from "@/lib/dirt";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, type, acreage, targetElevation, shrinkagePct, costPerCY, haulCostPerCY, notes } = body;
  if (!projectId || !type) {
    return NextResponse.json({ error: "projectId and type required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { topoShots: true },
  });
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const prior = await prisma.estimate.count({ where: { projectId, type } });
  const version = prior + 1;

  if (type === "dirt_import" || type === "dirt_export") {
    const acres = Number(acreage ?? project.acreage ?? 0);
    const result = computeDirt({
      acreage: acres,
      targetElevation: Number(targetElevation),
      shots: project.topoShots.map((s) => ({
        northing: s.northing,
        easting: s.easting,
        elevation: s.elevation,
      })),
      shrinkagePct: shrinkagePct != null ? Number(shrinkagePct) : 20,
      costPerCY: costPerCY != null ? Number(costPerCY) : 0,
      haulCostPerCY: haulCostPerCY != null ? Number(haulCostPerCY) : 0,
    });

    const est = await prisma.estimate.create({
      data: {
        projectId,
        type,
        version,
        acreage: acres,
        targetElevation: Number(targetElevation),
        avgElevation: result.avgElevation,
        shrinkagePct: shrinkagePct != null ? Number(shrinkagePct) : 20,
        costPerCY: costPerCY != null ? Number(costPerCY) : 0,
        haulCostPerCY: haulCostPerCY != null ? Number(haulCostPerCY) : 0,
        neatVolumeCY: result.neatVolumeCY,
        loadedVolumeCY: result.loadedVolumeCY,
        totalCost: result.totalCost,
        inputs: JSON.stringify({ shotCount: result.shotCount, method: result.method }),
        results: JSON.stringify(result),
        notes: notes || null,
      },
    });
    return NextResponse.json(est);
  }

  // Generic stub for other estimate types
  const est = await prisma.estimate.create({
    data: {
      projectId,
      type,
      version,
      inputs: JSON.stringify(body),
      notes: notes || null,
    },
  });
  return NextResponse.json(est);
}
