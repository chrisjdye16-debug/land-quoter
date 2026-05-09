"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Shot = { id?: string; pointId?: string | null; northing?: number | null; easting?: number | null; elevation: number; source?: string };
type Estimate = any;
type Project = {
  id: string;
  name: string;
  acreage: number | null;
  topoShots: Shot[];
  estimates: Estimate[];
};

const fmt = (n: any, d = 2) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const money = (n: any) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function ProjectWorkbench({ project }: { project: Project }) {
  const router = useRouter();
  const [tab, setTab] = useState<"topo" | "estimate" | "history">("topo");

  return (
    <div className="space-y-4">
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

      {tab === "topo" && <TopoTab project={project} onChange={() => router.refresh()} />}
      {tab === "estimate" && <EstimateTab project={project} onSaved={() => router.refresh()} />}
      {tab === "history" && <HistoryTab project={project} />}
    </div>
  );
}

function TopoTab({ project, onChange }: { project: Project; onChange: () => void }) {
  const [csv, setCsv] = useState("");
  const [manual, setManual] = useState({ pointId: "", northing: "", easting: "", elevation: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const addCsv = async () => {
    if (!csv.trim()) return;
    setBusy(true);
    const r = await fetch(`/api/projects/${project.id}/shots`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const j = await r.json();
    setBusy(false);
    setCsv("");
    setMsg(`Added ${j.created} shots from CSV`);
    onChange();
  };

  const addManual = async (e: any) => {
    e.preventDefault();
    if (!manual.elevation) return;
    setBusy(true);
    await fetch(`/api/projects/${project.id}/shots`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        shots: [
          {
            pointId: manual.pointId || null,
            northing: manual.northing ? Number(manual.northing) : null,
            easting: manual.easting ? Number(manual.easting) : null,
            elevation: Number(manual.elevation),
            source: "manual",
          },
        ],
      }),
    });
    setBusy(false);
    setManual({ pointId: "", northing: "", easting: "", elevation: "" });
    onChange();
  };

  const deleteShot = async (id: string) => {
    await fetch(`/api/projects/${project.id}/shots?shotId=${id}`, { method: "DELETE" });
    onChange();
  };
  const clearAll = async () => {
    if (!confirm("Delete ALL topo shots for this project?")) return;
    await fetch(`/api/projects/${project.id}/shots`, { method: "DELETE" });
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
        <button className="btn mt-2" onClick={addCsv} disabled={busy || !csv.trim()}>
          Add from CSV
        </button>
        {msg && <p className="mt-2 text-xs text-stone-700">{msg}</p>}
      </div>

      <div className="card md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">✏️ Manual shot entry</h3>
        </div>
        <form onSubmit={addManual} className="grid grid-cols-5 gap-2">
          <input className="input" placeholder="point ID" value={manual.pointId} onChange={(e) => setManual({ ...manual, pointId: e.target.value })} />
          <input className="input" placeholder="northing" value={manual.northing} onChange={(e) => setManual({ ...manual, northing: e.target.value })} />
          <input className="input" placeholder="easting" value={manual.easting} onChange={(e) => setManual({ ...manual, easting: e.target.value })} />
          <input className="input" placeholder="elevation *" value={manual.elevation} onChange={(e) => setManual({ ...manual, elevation: e.target.value })} required />
          <button className="btn" disabled={busy}>Add</button>
        </form>
      </div>

      <div className="card md:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">All shots ({project.topoShots.length})</h3>
          {project.topoShots.length > 0 && (
            <button className="btn-danger" onClick={clearAll}>Clear all</button>
          )}
        </div>
        {project.topoShots.length === 0 ? (
          <p className="text-sm text-stone-500">No shots yet. Add via upload, CSV, or manual entry above.</p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="t">
              <thead>
                <tr><th>Point</th><th>N</th><th>E</th><th>Elev</th><th>Source</th><th></th></tr>
              </thead>
              <tbody>
                {project.topoShots.map((s: any) => (
                  <tr key={s.id}>
                    <td>{s.pointId || "—"}</td>
                    <td>{fmt(s.northing)}</td>
                    <td>{fmt(s.easting)}</td>
                    <td className="font-medium">{fmt(s.elevation)}</td>
                    <td><span className="chip">{s.source}</span></td>
                    <td><button onClick={() => deleteShot(s.id)} className="text-xs text-red-600 hover:underline">delete</button></td>
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

function EstimateTab({ project, onSaved }: { project: Project; onSaved: () => void }) {
  const [type, setType] = useState("dirt_import");
  const [acreage, setAcreage] = useState(project.acreage?.toString() ?? "");
  const [target, setTarget] = useState("");
  const [shrink, setShrink] = useState("20");
  const [costPerCY, setCostPerCY] = useState("");
  const [haulPerCY, setHaulPerCY] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const runPreview = async () => {
    setBusy(true);
    const r = await fetch("/api/estimates/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        acreage: Number(acreage),
        targetElevation: Number(target),
        shrinkagePct: Number(shrink),
        costPerCY: costPerCY ? Number(costPerCY) : 0,
        haulCostPerCY: haulPerCY ? Number(haulPerCY) : 0,
      }),
    });
    const j = await r.json();
    setBusy(false);
    setPreview(r.ok ? j : { error: j.error });
  };

  const save = async () => {
    setBusy(true);
    await fetch("/api/estimates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        type,
        acreage: Number(acreage),
        targetElevation: Number(target),
        shrinkagePct: Number(shrink),
        costPerCY: costPerCY ? Number(costPerCY) : 0,
        haulCostPerCY: haulPerCY ? Number(haulPerCY) : 0,
        notes,
      }),
    });
    setBusy(false);
    setPreview(null);
    onSaved();
  };

  const isDirt = type === "dirt_import" || type === "dirt_export";

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <div className="card space-y-3">
        <h3 className="font-semibold">Estimate inputs</h3>
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
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
              Using {project.topoShots.length} topo shot{project.topoShots.length === 1 ? "" : "s"} for current elevation.
            </p>
          </>
        ) : (
          <p className="text-sm text-stone-500">
            Other estimate types are stubbed for now — fill in your inputs and the calc logic when you're ready.
          </p>
        )}

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary" onClick={runPreview} disabled={busy || !isDirt || !acreage || !target}>
            {busy ? "Calculating…" : "Preview"}
          </button>
          <button className="btn" onClick={save} disabled={busy || !isDirt || !acreage || !target}>
            Save Estimate
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">Result</h3>
        {!preview ? (
          <p className="text-sm text-stone-500">Click Preview to compute.</p>
        ) : preview.error ? (
          <p className="text-sm text-red-600">{preview.error}</p>
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

function HistoryTab({ project }: { project: Project }) {
  if (!project.estimates.length) {
    return <div className="card text-sm text-stone-500">No saved estimates yet.</div>;
  }
  return (
    <div className="space-y-3">
      {project.estimates.map((e: any) => (
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
