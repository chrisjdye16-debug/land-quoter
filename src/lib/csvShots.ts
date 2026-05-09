export type ParsedShot = {
  pointId?: string | null;
  northing?: number | null;
  easting?: number | null;
  elevation: number;
};

/**
 * Lenient CSV parser for survey shots.
 * Headers we recognize (case-insensitive, fuzzy):
 *   pointId | id | pt | point
 *   northing | north | n | y
 *   easting  | east  | e | x
 *   elevation | elev | z
 * If no header row is detected, assumes columns: id, n, e, z OR n, e, z OR z.
 */
export function parseCsvShots(csv: string): ParsedShot[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const split = (line: string) => line.split(/[,\t;]/).map((c) => c.trim());

  const firstCells = split(lines[0]);
  const looksHeader = firstCells.some((c) => /[a-zA-Z]/.test(c) && !/^-?\d/.test(c));

  let headerMap: Record<string, number> = {};
  let dataStart = 0;

  if (looksHeader) {
    firstCells.forEach((h, i) => {
      const k = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (["pointid", "id", "pt", "point", "name", "desc"].includes(k))
        headerMap.pointId = i;
      else if (["northing", "north", "n", "y", "lat"].includes(k)) headerMap.n = i;
      else if (["easting", "east", "e", "x", "lon", "lng"].includes(k)) headerMap.e = i;
      else if (["elevation", "elev", "z", "height"].includes(k)) headerMap.z = i;
    });
    dataStart = 1;
  }

  const out: ParsedShot[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = split(lines[i]);
    if (!cells.length) continue;

    let pointId: string | null = null;
    let n: number | null = null;
    let e: number | null = null;
    let z: number | null = null;

    if (looksHeader && Object.keys(headerMap).length) {
      pointId = headerMap.pointId != null ? cells[headerMap.pointId] || null : null;
      n = parseNum(cells[headerMap.n]);
      e = parseNum(cells[headerMap.e]);
      z = parseNum(cells[headerMap.z]);
    } else {
      // positional fallback
      if (cells.length >= 4) {
        pointId = cells[0] || null;
        n = parseNum(cells[1]);
        e = parseNum(cells[2]);
        z = parseNum(cells[3]);
      } else if (cells.length === 3) {
        n = parseNum(cells[0]);
        e = parseNum(cells[1]);
        z = parseNum(cells[2]);
      } else if (cells.length === 1) {
        z = parseNum(cells[0]);
      }
    }

    if (z != null && Number.isFinite(z)) {
      out.push({ pointId, northing: n, easting: e, elevation: z });
    }
  }
  return out;
}

function parseNum(v: string | undefined): number | null {
  if (v == null) return null;
  const cleaned = v.replace(/[, ]/g, "").replace(/[^\d.\-eE]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
