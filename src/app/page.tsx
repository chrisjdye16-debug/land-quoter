import Link from "next/link";
import { getPrisma, ensureSchema } from "@/lib/db";
import { NewLeadForm } from "./NewLeadForm";

export const dynamic = "force-dynamic";

async function loadLeads() {
  try {
    await ensureSchema();
    const prisma = await getPrisma();
    const leads = await prisma.lead.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { projects: true } } },
    });
    return { ok: true as const, leads };
  } catch (e: any) {
    return {
      ok: false as const,
      error: String(e?.message || e),
      stack: String(e?.stack || "").slice(0, 1500),
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.slice(0, 25) + "…"
        : null,
    };
  }
}

export default async function Home() {
  const result = await loadLeads();

  if (!result.ok) {
    return (
      <div className="card border-red-300 bg-red-50">
        <h2 className="mb-3 text-lg font-bold text-red-900">⚠️ Database not connected</h2>
        <p className="mb-4 text-sm text-red-800">
          The site deployed successfully, but it can't reach the database. Update{" "}
          <code className="rounded bg-red-100 px-1">DATABASE_URL</code> in your hosting platform's
          environment variables and redeploy.
        </p>
        <div className="space-y-2 rounded-md bg-white p-4 font-mono text-xs">
          <div>
            <strong>DATABASE_URL set?</strong>{" "}
            {result.hasDatabaseUrl ? (
              <span className="text-green-700">✅ yes</span>
            ) : (
              <span className="text-red-700">❌ NOT SET — this is your problem</span>
            )}
          </div>
          {result.databaseUrlPrefix && (
            <div>
              <strong>URL starts with:</strong> {result.databaseUrlPrefix}{" "}
              <span className="text-stone-500">
                (should be <code className="bg-stone-100 px-1">postgresql://</code>)
              </span>
            </div>
          )}
          <div>
            <strong>Error:</strong>
            <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-stone-100 p-2 text-stone-800">
              {result.error}
            </pre>
          </div>
          {result.stack && (
            <details>
              <summary className="cursor-pointer text-stone-500">stack trace</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-stone-100 p-2 text-[10px] text-stone-600">
                {result.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="mt-4 text-sm text-red-900">
          <p className="mb-2 font-semibold">Fix steps:</p>
          <ol className="ml-5 list-decimal space-y-1">
            <li>Go to your hosting platform → site settings → Environment variables</li>
            <li>
              Confirm <code className="rounded bg-red-100 px-1">DATABASE_URL</code> exists and
              starts with <code className="rounded bg-red-100 px-1">postgresql://</code>
            </li>
            <li>
              No quotes, no spaces, ends with{" "}
              <code className="rounded bg-red-100 px-1">?sslmode=require</code>
            </li>
            <li>Save → redeploy → reload this page</li>
          </ol>
        </div>
      </div>
    );
  }

  const { leads } = result;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Leads</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-stone-500">No leads yet — add one on the right →</p>
        ) : (
          <table className="t">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Status</th>
                <th>Projects</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.id} className="hover:bg-stone-50">
                  <td>
                    <Link href={`/leads/${l.id}`} className="font-medium text-stone-900 hover:underline">
                      {l.name}
                    </Link>
                  </td>
                  <td>{l.company || "—"}</td>
                  <td><span className="chip">{l.status}</span></td>
                  <td>{l._count.projects}</td>
                  <td className="text-stone-500">{new Date(l.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">New Lead</h2>
        <NewLeadForm />
      </div>
    </div>
  );
}
