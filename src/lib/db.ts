// Lazy-initialized Prisma client. Avoid creating it at module load time so
// that any failure (missing env, missing generated client, bad URL) surfaces
// as a catchable runtime error rather than crashing the whole route on import.

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: any | undefined;
  // eslint-disable-next-line no-var
  var __dbInitialized: boolean | undefined;
}

export async function getPrisma(): Promise<any> {
  if (global.__prismaClient) return global.__prismaClient;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add it as an environment variable in your hosting provider and redeploy."
    );
  }
  const mod = await import("@prisma/client");
  const PrismaClient = (mod as any).PrismaClient;
  if (!PrismaClient) {
    throw new Error(
      "@prisma/client did not export PrismaClient — generated client missing. Check that 'prisma generate' ran during build."
    );
  }
  const client = new PrismaClient();
  global.__prismaClient = client;
  return client;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "acreage" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TopoShot" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "pointId" TEXT,
  "northing" DOUBLE PRECISION,
  "easting" DOUBLE PRECISION,
  "elevation" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TopoShot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TopoShot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Estimate" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "acreage" DOUBLE PRECISION,
  "targetElevation" DOUBLE PRECISION,
  "avgElevation" DOUBLE PRECISION,
  "shrinkagePct" DOUBLE PRECISION,
  "costPerCY" DOUBLE PRECISION,
  "haulCostPerCY" DOUBLE PRECISION,
  "neatVolumeCY" DOUBLE PRECISION,
  "loadedVolumeCY" DOUBLE PRECISION,
  "totalCost" DOUBLE PRECISION,
  "inputs" TEXT,
  "results" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Estimate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

export async function ensureSchema() {
  if (global.__dbInitialized) return;
  const prisma = await getPrisma();
  const statements = SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  global.__dbInitialized = true;
}
