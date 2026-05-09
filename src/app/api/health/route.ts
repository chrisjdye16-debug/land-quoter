import { NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/db";

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
    await prisma.$queryRawUnsafe("SELECT 1 as ok");
    out.dbConnect = "ok";
  } catch (e: any) {
    out.dbConnect = "FAILED";
    out.dbError = String(e?.message || e).slice(0, 500);
    return NextResponse.json(out, { status: 500 });
  }
  try {
    await ensureSchema();
    out.schemaInit = "ok";
  } catch (e: any) {
    out.schemaInit = "FAILED";
    out.schemaError = String(e?.message || e).slice(0, 500);
    return NextResponse.json(out, { status: 500 });
  }
  try {
    const count = await prisma.lead.count();
    out.leadCount = count;
  } catch (e: any) {
    out.leadCount = "FAILED";
    out.queryError = String(e?.message || e).slice(0, 500);
  }
  return NextResponse.json(out);
}
