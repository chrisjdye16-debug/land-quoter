"use client";
import { useEffect, useState } from "react";
import { LeadsView } from "./LeadsView";
import { LeadDetail } from "./LeadDetail";
import { ProjectDetail } from "./ProjectDetail";

type Route =
  | { name: "leads" }
  | { name: "lead"; id: string }
  | { name: "project"; id: string };

function parseHash(): Route {
  if (typeof window === "undefined") return { name: "leads" };
  const h = window.location.hash.replace(/^#/, "");
  const m = h.match(/^\/lead\/([^/]+)$/);
  if (m) return { name: "lead", id: m[1] };
  const p = h.match(/^\/project\/([^/]+)$/);
  if (p) return { name: "project", id: p[1] };
  return { name: "leads" };
}

export default function Home() {
  const [route, setRoute] = useState<Route>({ name: "leads" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setRoute(parseHash());
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const refresh = () => setTick((t) => t + 1);

  return (
    <div key={tick}>
      {route.name === "leads" && <LeadsView onChange={refresh} />}
      {route.name === "lead" && <LeadDetail leadId={route.id} onChange={refresh} />}
      {route.name === "project" && <ProjectDetail projectId={route.id} onChange={refresh} />}
    </div>
  );
}
