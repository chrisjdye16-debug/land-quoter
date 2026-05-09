"use client";
import { useEffect, useState } from "react";
import { QuickQuote } from "./QuickQuote";
import { LeadsView } from "./LeadsView";
import { LeadDetail } from "./LeadDetail";
import { ProjectDetail } from "./ProjectDetail";

type Route =
  | { name: "quote" }
  | { name: "leads" }
  | { name: "lead"; id: string }
  | { name: "project"; id: string };

function parseHash(): Route {
  if (typeof window === "undefined") return { name: "quote" };
  const h = window.location.hash.replace(/^#/, "");
  if (h === "/leads" || h === "/saved") return { name: "leads" };
  const m = h.match(/^\/lead\/([^/]+)$/);
  if (m) return { name: "lead", id: m[1] };
  const p = h.match(/^\/project\/([^/]+)$/);
  if (p) return { name: "project", id: p[1] };
  return { name: "quote" };
}

export default function Home() {
  const [route, setRoute] = useState<Route>({ name: "quote" });
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
      {route.name === "quote" && <QuickQuote />}
      {route.name === "leads" && <LeadsView onChange={refresh} />}
      {route.name === "lead" && <LeadDetail leadId={route.id} onChange={refresh} />}
      {route.name === "project" && <ProjectDetail projectId={route.id} onChange={refresh} />}
    </div>
  );
}
