"use client";
import { useState } from "react";
import * as store from "@/lib/store";
import { computeDirt } from "@/lib/dirt";
import { parseCsvShots } from "@/lib/csvShots";

const fmt = (n: any, d = 2) =>
  n == null || !Number.isFinite(Number(n)) ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const money = (n: any) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function ProjectDetail({ projectId, onChange }: { projectId: string; onChange: () => void }) {
  const [tab, setTab] = useState<"topo" | "estimate" | "history">("topo");
  const project = store.getProject(projectId);
  if (!project) {
    return (
      <div className="card">
        <p>Project not found.</p>
        <a href="#/" className="btn-secondary mt-2 inline-block">Back to leads</a>
      </div>
    );
  }
  const lead = store.getLead(project.leadId);

  return (
    <div className="space-y-4">
      <div>
        <a href={lead ? `#/lead/${lead.id}` : "#/"} className="text-sm text-stone-500 hover:underline">
          ← {lead?.name || "Back"}
        </a>
        <h1 className="mt-1 text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-stone-600">
          {[project.location, project.acreage ? `${project.acreage} ac` : null].filter(Boolean).join(" • ") || "—"}
        </p>
      </div>

      <div className="flex gap-2 border-b border-stone-200">
        {(["topo", "estimate", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-stone-900 text-stone-900" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {t === "topo" ? "Topo Data" : t === "estimate" ? "New Estimate" : `History (${project.estimates.length})`}
          </button>
        ))}
      </div>

      {tab === "topo" && <TopoTab projectId={projectId} onChange={onChange} />}
      {tab === "estimate" && <EstimateTab projectId={projectId} onChange={onChange} />}
      {tab === "history" && <HistoryTab projectId={projectId} />}
    </div>
  );
}

function TopoTab({ projectId, onChange }: { projectId: string; onChange: () => void }) {
  const project = store.getProject(projectId)!;
  const [csv, setCsv] = useState("");
  const [manual, setManual] = useState({ pointId: "", northing: "", easting: "", elevation: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const addCsv = () => {
    if (!csv.trim()) return;
    const parsed = parseCsvShots(csv);
    const created = store.addShots(
      projectId,
      parsed.map((s) => ({
        pointId: s.pointId ?? undefined,
        northing: s.northing ?? undefined,
        easting: s.easting ?? undefined,
        elevation: s.elevation,
        source: "csv" as const,
      }))
    );
    setCsv("");
    setMsg(`Added ${created} shots from CSV`);
    onChange();
  };

  const addManual = (e: any) => {
    e.preventDefault();
    if (!manual.elevation) return;
    store.addShots(projectId, [
      {
        pointId: manual.pointId || undefined,
        northing: manual.northing ? Number(manual.northing) : undefined,
        easting: manual.easting ? Number(manual.easting) : undefined,
        elevation: Number(manual.elevation),
        source: "manual",
      },
    ]);
    setManual({ pointId: "", northing: "", easting: "", elevation: "" });
    onChange();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card">
        <h3 className="mb-2 font-semibold">📋 Paste CSV shots</h3>
        <p className="mb-2 text-xs text-stone-600">
          Headers like <code>pointId, northing, easting, elevation</code> — or just elevations one per line.
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={5}
          className="input font-mono text-xs"
          placeholder={"pointId,northing,easting,elevation\nP1,1000,2000,427.26\nP2,1050,2080,428.11"}
        />
        <button className="btn mt-2" onClick={addCsv} disabled={!csv.trim()}>Add from CSV</button>
        {msg && <p className="mt-2 text-xs text-stone-700">{msg}</p>}
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">✏️ Manual shot entry</h3>
        <form onSubmit={addManual} className="space-y-2">
          <input className="input" placeholder="point ID (optional)" value={manual.pointId} onChange={(e) => setManual({ ...manual, pointId: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="northing" value={manual.northing} onChange={(e) => setManual({ ...manual, northing: e.target.value })} />
            <input className="input" placeholder="easting" value={manual.easting} onChange={(e) => setManual({ ...manual, easting: e.target.value })} />
          </div>
          <input className="input" placeholder="elevation *" value={manual.elevation} onChange={(e) => setManual({ ...manual, elevation: e.target.value })} required />
          <button className="btn w-full">Add shot</button>
        </form>
      </div>

      <div className="card md:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">All shots ({project.shots.length})</h3>
          {project.shots.length > 0 && (
            <button className="btn-danger" onClick={() => {
              if (confirm("Delete ALL topo shots for this project?")) {
                store.clearShots(projectId);
                onChange();
              }
            }}>Clear all</button>
          )}
        </div>
        {project.shots.length === 0 ? (
          <p className="text-sm text-stone-500">No shots yet. Add via CSV or manual entry above.</p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="t">
              <thead><tr><th>Point</th><th>N</th><th>E</th><th>Elev</th><th>Source</th><th></th></tr></thead>
              <tbody>
                {project.shots.map((s) => (
                  <tr key={s.id}>
                    <td>{s.pointId || "—"}</td>
                    <td>{fmt(s.northing)}</td>
                    <td>{fmt(s.easting)}</td>
                    <td className="font-medium">{fmt(s.elevation)}</td>
                    <td><span className="chip">{s.source}</span></td>
                    <td>
                      <button onClick={() => { store.deleteShot(projectId, s.id); onChange(); }} className="text-xs text-red-600 hover:underline">delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EstimateTab({ projectId, onChange }: { projectId: string; onChange: () => void }) {
  const project = store.getProject(projectId)!;
  const [type, setType] = useState<"dirt_import" | "dirt_export" | "clearing" | "grading" | "utilities" | "paving" | "other">("dirt_import");
  const [acreage, setAcreage] = useState(project.acreage?.toString() ?? "");
  const [target, setTarget] = useState("");
  const [shrink, setShrink] = useState("20");
  const [costPerCY, setCostPerCY] = useState("");
  const [haulPerCY, setHaulPerCY] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const isDirt = type === "dirt_import" || type === "dirt_export";

  const runPreview = () => {
    if (!acreage || !target) return;
    const result = computeDirt({
      acreage: Number(acreage),
      targetElevation: Number(target),
      shots: project.shots.map((s) => ({
        northing: s.northing ?? null,
        easting: s.easting ?? null,
        elevation: s.elevation,
      })),
      shrinkagePct: Number(shrink) || 0,
      costPerCY: costPerCY ? Number(costPerCY) : 0,
      haulCostPerCY: haulPerCY ? Number(haulPerCY) : 0,
    });
    setPreview(result);
  };

  const save = () => {
    if (!isDirt || !acreage || !target) return;
    const result = computeDirt({
      acreage: Number(acreage),
      targetElevation: Number(target),
      shots: project.shots.map((s) => ({
        northing: s.northing ?? null,
        easting: s.easting ?? null,
        elevation: s.elevation,
      })),
      shrinkagePct: Number(shrink) || 0,
      costPerCY: costPerCY ? Number(costPerCY) : 0,
      haulCostPerCY: haulPerCY ? Number(haulPerCY) : 0,
    });
    store.addEstimate(projectId, {
      type,
      acreage: Number(acreage),
      targetElevation: Number(target),
      avgElevation: result.avgElevation,
      shrinkagePct: Number(shrink) || 0,
      costPerCY: costPerCY ? Number(costPerCY) : 0,
      haulCostPerCY: haulPerCY ? Number(haulPerCY) : 0,
      neatVolumeCY: result.neatVolumeCY,
      loadedVolumeCY: result.loadedVolumeCY,
      totalCost: result.totalCost,
      notes: notes || undefined,
    });
    setPreview(null);
    setNotes("");
    onChange();
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <div className="card space-y-3">
        <h3 className="font-semibold">Estimate inputs</h3>
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="dirt_import">Dirt import</option>
            <option value="dirt_export">Dirt export</option>
            <option value="clearing">Clearing</option>
            <option value="grading">Grading</option>
            <option value="utilities">Utilities</option>
            <option value="paving">Paving</option>
            <option value="other">Other</option>
          </select>
        </div>

        {isDirt ? (
          <>
            <div>
              <label className="label">Acreage *</label>
              <input className="input" type="number" step="0.01" value={acreage} onChange={(e) => setAcreage(e.target.value)} />
            </div>
            <div>
              <label className="label">Target finished elevation *</label>
              <input className="input" type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 439" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Shrinkage %</label>
                <input className="input" type="number" value={shrink} onChange={(e) => setShrink(e.target.value)} />
              </div>
              <div>
                <label className="label">$ / CY (material)</label>
                <input className="input" type="number" value={costPerCY} onChange={(e) => setCostPerCY(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="label">$ / CY (haul)</label>
              <input className="input" type="number" value={haulPerCY} onChange={(e) => setHaulPerCY(e.target.value)} placeholder="0" />
            </div>
            <p className="text-xs text-stone-500">
              Using {project.shots.length} topo shot{project.shots.length === 1 ? "" : "s"} for current elevation.
            </p>
          </>
        ) : (
          <p className="text-sm text-stone-500">
            Other estimate types are stubs — fill in your inputs and the calc logic when you're ready.
          </p>
        )}

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary" onClick={runPreview} disabled={!isDirt || !acreage || !target}>Preview</button>
          <button className="btn" onClick={save} disabled={!isDirt || !acreage || !target}>Save Estimate</button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">Result</h3>
        {!preview ? (
          <p className="text-sm text-stone-500">Click Preview to compute.</p>
        ) : (
          <dl className="space-y-2 text-sm">
            <Row label="Method" v={preview.method === "tin" ? "TIN-weighted (uses x/y)" : "Mean of shots"} />
            <Row label="Avg current elevation" v={`${fmt(preview.avgElevation)} ft`} />
            <Row label="Lift (target − avg)" v={`${fmt(preview.liftFt)} ft`} />
            <Row label="Site area" v={`${fmt(preview.areaSqFt, 0)} ft² (${fmt(preview.areaSqFt / 43560, 2)} ac)`} />
            <Row label="Neat (compacted) volume" v={`${fmt(preview.neatVolumeCY, 0)} CY`} highlight />
            <Row label="Imported (loose) volume" v={`${fmt(preview.loadedVolumeCY, 0)} CY`} highlight />
            <Row label="Estimated cost" v={money(preview.totalCost)} highlight />
          </dl>
        )}
      </div>
    </div>
  );
}

function Row({ label, v, highlight }: { label: string; v: any; highlight?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${highlight ? "rounded bg-stone-100 px-2 py-1" : ""}`}>
      <dt className="text-stone-500">{label}</dt>
      <dd className={`font-medium ${highlight ? "text-stone-900" : ""}`}>{v}</dd>
    </div>
  );
}

function HistoryTab({ projectId }: { projectId: string }) {
  const project = store.getProject(projectId)!;
  if (!project.estimates.length) {
    return <div className="card text-sm text-stone-500">No saved estimates yet.</div>;
  }
  return (
    <div className="space-y-3">
      {project.estimates.map((e) => (
        <div key={e.id} className="card">
          <div className="flex items-center justify-between">
            <div className="font-semibold">
              {e.type} <span className="ml-2 chip">v{e.version}</span>
            </div>
            <div className="text-xs text-stone-500">{new Date(e.createdAt).toLocaleString()}</div>
          </div>
          {e.type.startsWith("dirt_") && (
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-4">
              <Row label="Acreage" v={`${fmt(e.acreage)} ac`} />
              <Row label="Target elev" v={`${fmt(e.targetElevation)} ft`} />
              <Row label="Avg elev" v={`${fmt(e.avgElevation)} ft`} />
              <Row label="Shrinkage" v={`${fmt(e.shrinkagePct)}%`} />
              <Row label="Neat CY" v={fmt(e.neatVolumeCY, 0)} />
              <Row label="Loose CY" v={fmt(e.loadedVolumeCY, 0)} />
              <Row label="$ / CY" v={money(e.costPerCY)} />
              <Row label="Total" v={money(e.totalCost)} />
            </dl>
          )}
          {e.notes && <p className="mt-2 text-sm text-stone-700">{e.notes}</p>}
        </div>
      ))}
    </div>
  );
}
