import { NextResponse } from "next/server";
import { getPrisma, ensureSchema } from "@/lib/db";

export async function GET() {
  const out: any = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.slice(0, 20) + "..."
      : null,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };
  try {
    const prisma = await getPrisma();
    await prisma.$queryRawUnsafe("SELECT 1 as ok");
    out.dbConnect = "ok";
  } catch (e: any) {
    out.dbConnect = "FAILED";
    out.dbError = String(e?.message || e).slice(0, 800);
    return NextResponse.json(out, { status: 500 });
  }
  try {
    await ensureSchema();
    out.schemaInit = "ok";
  } catch (e: any) {
    out.schemaInit = "FAILED";
    out.schemaError = String(e?.message || e).slice(0, 800);
    return NextResponse.json(out, { status: 500 });
  }
  try {
    const prisma = await getPrisma();
    out.leadCount = await prisma.lead.count();
  } catch (e: any) {
    out.queryError = String(e?.message || e).slice(0, 800);
  }
  return NextResponse.json(out);
}
