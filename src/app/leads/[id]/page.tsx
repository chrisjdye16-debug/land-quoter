import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, ensureSchema } from "@/lib/db";
import { NewProjectForm } from "./NewProjectForm";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { estimates: true } } },
      },
    },
  });
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:underline">← All leads</Link>
        <h1 className="mt-1 text-2xl font-bold">{lead.name}</h1>
        <p className="text-sm text-stone-600">
          {[lead.company, lead.email, lead.phone].filter(Boolean).join(" • ") || "—"}
        </p>
        <p className="mt-1"><span className="chip">{lead.status}</span> {lead.source && <span className="ml-2 text-xs text-stone-500">via {lead.source}</span>}</p>
        {lead.notes && <p className="mt-2 whitespace-pre-wrap rounded-md bg-stone-100 p-3 text-sm">{lead.notes}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Projects</h2>
          {lead.projects.length === 0 ? (
            <p className="text-sm text-stone-500">No projects yet — add one →</p>
          ) : (
            <table className="t">
              <thead>
                <tr><th>Name</th><th>Location</th><th>Acreage</th><th>Estimates</th></tr>
              </thead>
              <tbody>
                {lead.projects.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td><Link href={`/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link></td>
                    <td>{p.location || "—"}</td>
                    <td>{p.acreage ?? "—"}</td>
                    <td>{p._count.estimates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">New Project</h2>
          <NewProjectForm leadId={lead.id} />
        </div>
      </div>
    </div>
  );
}
