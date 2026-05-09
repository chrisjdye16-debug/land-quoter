// Browser localStorage data layer. Zero backend, zero config.
// Everything persists in the user's browser under one key.

export type Lead = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Shot = {
  id: string;
  pointId?: string;
  northing?: number;
  easting?: number;
  elevation: number;
  source: "manual" | "csv";
};

export type Estimate = {
  id: string;
  type: "dirt_import" | "dirt_export" | "clearing" | "grading" | "utilities" | "paving" | "other";
  version: number;
  acreage?: number;
  targetElevation?: number;
  avgElevation?: number;
  shrinkagePct?: number;
  costPerCY?: number;
  haulCostPerCY?: number;
  neatVolumeCY?: number;
  loadedVolumeCY?: number;
  totalCost?: number;
  notes?: string;
  createdAt: string;
};

export type Project = {
  id: string;
  leadId: string;
  name: string;
  location?: string;
  acreage?: number;
  notes?: string;
  shots: Shot[];
  estimates: Estimate[];
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  leads: Lead[];
  projects: Project[];
};

const KEY = "land-quoter-db-v1";

function emptyDb(): Database {
  return { leads: [], projects: [] };
}

export function loadDb(): Database {
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw);
    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    };
  } catch {
    return emptyDb();
  }
}

export function saveDb(db: Database) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function exportJson(): string {
  return JSON.stringify(loadDb(), null, 2);
}

export function importJson(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.leads || !parsed.projects) return { ok: false, error: "Missing leads or projects field" };
    saveDb(parsed);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function now(): string {
  return new Date().toISOString();
}

// --- Leads ---
export function listLeads(): Lead[] {
  const db = loadDb();
  return [...db.leads].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}
export function getLead(id: string): Lead | undefined {
  return loadDb().leads.find((l) => l.id === id);
}
export function createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt" | "status"> & { status?: Lead["status"] }): Lead {
  const db = loadDb();
  const lead: Lead = { ...input, id: uid(), status: input.status || "new", createdAt: now(), updatedAt: now() };
  db.leads.push(lead);
  saveDb(db);
  return lead;
}
export function updateLead(id: string, patch: Partial<Lead>) {
  const db = loadDb();
  const i = db.leads.findIndex((l) => l.id === id);
  if (i === -1) return;
  db.leads[i] = { ...db.leads[i], ...patch, updatedAt: now() };
  saveDb(db);
}
export function deleteLead(id: string) {
  const db = loadDb();
  db.leads = db.leads.filter((l) => l.id !== id);
  db.projects = db.projects.filter((p) => p.leadId !== id);
  saveDb(db);
}

// --- Projects ---
export function listProjectsForLead(leadId: string): Project[] {
  return loadDb().projects.filter((p) => p.leadId === leadId).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}
export function getProject(id: string): Project | undefined {
  return loadDb().projects.find((p) => p.id === id);
}
export function createProject(input: Omit<Project, "id" | "shots" | "estimates" | "createdAt" | "updatedAt">): Project {
  const db = loadDb();
  const project: Project = { ...input, id: uid(), shots: [], estimates: [], createdAt: now(), updatedAt: now() };
  db.projects.push(project);
  // bump lead.updatedAt
  const li = db.leads.findIndex((l) => l.id === input.leadId);
  if (li !== -1) db.leads[li].updatedAt = now();
  saveDb(db);
  return project;
}
export function updateProject(id: string, patch: Partial<Project>) {
  const db = loadDb();
  const i = db.projects.findIndex((p) => p.id === id);
  if (i === -1) return;
  db.projects[i] = { ...db.projects[i], ...patch, updatedAt: now() };
  saveDb(db);
}
export function deleteProject(id: string) {
  const db = loadDb();
  db.projects = db.projects.filter((p) => p.id !== id);
  saveDb(db);
}

// --- Shots ---
export function addShots(projectId: string, shots: Omit<Shot, "id">[]): number {
  const db = loadDb();
  const i = db.projects.findIndex((p) => p.id === projectId);
  if (i === -1) return 0;
  for (const s of shots) {
    db.projects[i].shots.push({ ...s, id: uid() });
  }
  db.projects[i].updatedAt = now();
  saveDb(db);
  return shots.length;
}
export function deleteShot(projectId: string, shotId: string) {
  const db = loadDb();
  const i = db.projects.findIndex((p) => p.id === projectId);
  if (i === -1) return;
  db.projects[i].shots = db.projects[i].shots.filter((s) => s.id !== shotId);
  db.projects[i].updatedAt = now();
  saveDb(db);
}
export function clearShots(projectId: string) {
  const db = loadDb();
  const i = db.projects.findIndex((p) => p.id === projectId);
  if (i === -1) return;
  db.projects[i].shots = [];
  db.projects[i].updatedAt = now();
  saveDb(db);
}

// --- Estimates ---
export function addEstimate(projectId: string, est: Omit<Estimate, "id" | "version" | "createdAt">): Estimate {
  const db = loadDb();
  const i = db.projects.findIndex((p) => p.id === projectId);
  if (i === -1) throw new Error("project not found");
  const priorOfType = db.projects[i].estimates.filter((e) => e.type === est.type).length;
  const e: Estimate = { ...est, id: uid(), version: priorOfType + 1, createdAt: now() };
  db.projects[i].estimates.unshift(e);
  db.projects[i].updatedAt = now();
  saveDb(db);
  return e;
}
