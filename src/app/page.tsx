import Link from "next/link";
import { prisma, ensureSchema } from "@/lib/db";
import { NewLeadForm } from "./NewLeadForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSchema();
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

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
              {leads.map((l) => (
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
