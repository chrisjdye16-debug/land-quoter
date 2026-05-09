import Delaunator from "delaunator";

const SQFT_PER_ACRE = 43560;
const CF_PER_CY = 27;

export type Shot = {
  northing?: number | null;
  easting?: number | null;
  elevation: number;
};

export type DirtInput = {
  acreage: number;
  targetElevation: number;
  shots: Shot[];
  shrinkagePct?: number; // 0-100; loose-to-compacted; default 20
  costPerCY?: number;
  haulCostPerCY?: number;
};

export type DirtResult = {
  avgElevation: number;
  liftFt: number; // target - avg (negative = cut)
  areaSqFt: number;
  neatVolumeCY: number; // compacted in-place volume needed
  loadedVolumeCY: number; // accounting for shrinkage (what to import loose)
  totalCost: number;
  method: "tin" | "mean";
  shotCount: number;
};

/**
 * Compute average elevation:
 *  - TIN (Delaunay-weighted) when ≥3 shots have x/y coords
 *  - Plain mean otherwise
 */
export function averageElevation(shots: Shot[]): { avg: number; method: "tin" | "mean" } {
  const geo = shots.filter(
    (s) => s.northing != null && s.easting != null && Number.isFinite(s.elevation)
  );
  if (geo.length >= 3) {
    const pts = geo.map((s) => [s.easting as number, s.northing as number]);
    try {
      const d = Delaunator.from(pts);
      const tris = d.triangles;
      let weightedZ = 0;
      let totalArea = 0;
      for (let i = 0; i < tris.length; i += 3) {
        const a = tris[i],
          b = tris[i + 1],
          c = tris[i + 2];
        const [x1, y1] = pts[a];
        const [x2, y2] = pts[b];
        const [x3, y3] = pts[c];
        const area = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2;
        const z = (geo[a].elevation + geo[b].elevation + geo[c].elevation) / 3;
        weightedZ += z * area;
        totalArea += area;
      }
      if (totalArea > 0) return { avg: weightedZ / totalArea, method: "tin" };
    } catch {}
  }
  const z = shots.filter((s) => Number.isFinite(s.elevation)).map((s) => s.elevation);
  if (!z.length) return { avg: 0, method: "mean" };
  return { avg: z.reduce((a, b) => a + b, 0) / z.length, method: "mean" };
}

export function computeDirt(input: DirtInput): DirtResult {
  const { acreage, targetElevation, shots } = input;
  const shrinkagePct = input.shrinkagePct ?? 20;
  const costPerCY = input.costPerCY ?? 0;
  const haulCostPerCY = input.haulCostPerCY ?? 0;

  const { avg, method } = averageElevation(shots);
  const liftFt = targetElevation - avg;
  const areaSqFt = acreage * SQFT_PER_ACRE;
  const neatVolumeCF = areaSqFt * liftFt;
  const neatVolumeCY = neatVolumeCF / CF_PER_CY;

  // shrinkage: loose imported = compacted / (1 - shrinkage)
  const shrinkFactor = 1 - shrinkagePct / 100;
  const loadedVolumeCY =
    shrinkFactor > 0 && neatVolumeCY > 0 ? neatVolumeCY / shrinkFactor : neatVolumeCY;

  const totalCost =
    Math.max(0, loadedVolumeCY) * costPerCY + Math.max(0, loadedVolumeCY) * haulCostPerCY;

  return {
    avgElevation: avg,
    liftFt,
    areaSqFt,
    neatVolumeCY,
    loadedVolumeCY,
    totalCost,
    method,
    shotCount: shots.length,
  };
}

export function fmtNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
export function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
