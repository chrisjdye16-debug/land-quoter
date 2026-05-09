import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, ensureSchema } from "@/lib/db";
import { ProjectWorkbench } from "./ProjectWorkbench";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lead: true,
      estimates: { orderBy: { createdAt: "desc" } },
      topoShots: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/leads/${project.lead.id}`} className="text-sm text-stone-500 hover:underline">
          ← {project.lead.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-stone-600">
          {[project.location, project.acreage ? `${project.acreage} ac` : null].filter(Boolean).join(" • ") || "—"}
        </p>
      </div>
      <ProjectWorkbench project={JSON.parse(JSON.stringify(project))} />
    </div>
  );
}
