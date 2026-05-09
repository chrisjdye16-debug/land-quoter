"use client";
import { useState } from "react";
import * as store from "@/lib/store";
import { computeDirt } from "@/lib/dirt";
import { parseCsvShots } from "@/lib/csvShots";

const fmt = (n: any, d = 2) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const money = (n: any) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function ProjectDetail({
  projectId,
  onChange,
}: {
  projectId: string;
  onChange: () => void;
}) {
  const [tab, setTab] = useState<"topo" | "estimate" | "history">("estimate");
  const project = store.getProject(projectId);
  if (!project) {
    return (
      <div className="card p-6 text-center">
        <p className="text-stone-600">Project not found.</p>
        <a href="#/saved" className="btn-secondary mt-3 inline-block">
          ← Back
        </a>
      </div>
    );
  }
  const lead = store.getLead(project.leadId);

  const tabs = [
    { id: "estimate", label: "Estimate" },
    { id: "topo", label: `Topo (${project.shots.length})` },
    { id: "history", label: `History (${project.estimates.length})` },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <a
          href={lead ? `#/lead/${lead.id}` : "#/saved"}
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          ← {lead?.name || "Back"}
        </a>
        <h1 className="font-display mt-2 text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
          {project.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {[project.location, project.acreage ? `${project.acreage} ac` : null]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-100/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            {t.label}
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
    setTimeout(() => setMsg(null), 3000);
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Paste CSV shots
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Headers like <code className="rounded bg-stone-100 px-1">pointId, northing, easting, elevation</code> — or just elevations.
          </p>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={5}
            className="input mt-3 font-mono text-xs"
            placeholder={"pointId,northing,easting,elevation\nP1,1000,2000,427.26\nP2,1050,2080,428.11"}
          />
          <button className="btn mt-3 w-full" onClick={addCsv} disabled={!csv.trim()}>
            Add from CSV
          </button>
          {msg && <p className="mt-2 text-xs text-emerald-800">✓ {msg}</p>}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Manual entry
          </h3>
          <form onSubmit={addManual} className="mt-3 space-y-2">
            <input
              className="input"
              placeholder="point ID (optional)"
              value={manual.pointId}
              onChange={(e) => setManual({ ...manual, pointId: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="northing"
                value={manual.northing}
                onChange={(e) => setManual({ ...manual, northing: e.target.value })}
              />
              <input
                className="input"
                placeholder="easting"
                value={manual.easting}
                onChange={(e) => setManual({ ...manual, easting: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="elevation *"
              value={manual.elevation}
              onChange={(e) => setManual({ ...manual, elevation: e.target.value })}
              required
            />
            <button className="btn w-full">Add shot</button>
          </form>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            All shots ({project.shots.length})
          </h3>
          {project.shots.length > 0 && (
            <button
              className="btn-danger"
              onClick={() => {
                if (confirm("Delete ALL topo shots for this project?")) {
                  store.clearShots(projectId);
                  onChange();
                }
              }}
            >
              Clear all
            </button>
          )}
        </div>
        {project.shots.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            No shots yet. Add via CSV or manual entry above.
          </p>
        ) : (
          <div className="-mx-2 max-h-80 overflow-auto">
            <table className="t">
              <thead>
                <tr>
                  <th>Point</th>
                  <th className="text-right">N</th>
                  <th className="text-right">E</th>
                  <th className="text-right">Elev</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {project.shots.map((s) => (
                  <tr key={s.id}>
                    <td className="text-stone-700">{s.pointId || "—"}</td>
                    <td className="text-right num text-stone-600">{fmt(s.northing)}</td>
                    <td className="text-right num text-stone-600">{fmt(s.easting)}</td>
                    <td className="text-right num font-medium text-stone-900">{fmt(s.elevation)}</td>
                    <td>
                      <span className="chip">{s.source}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          store.deleteShot(projectId, s.id);
                          onChange();
                        }}
                        className="text-xs text-red-700 hover:underline"
                      >
                        delete
                      </button>
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
  const [type, setType] = useState<
    "dirt_import" | "dirt_export" | "clearing" | "grading" | "utilities" | "paving" | "other"
  >("dirt_import");
  const [acreage, setAcreage] = useState(project.acreage?.toString() ?? "");
  const [target, setTarget] = useState("");
  const [shrink, setShrink] = useState("20");
  const [costPerCY, setCostPerCY] = useState("");
  const [haulPerCY, setHaulPerCY] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const isDirt = type === "dirt_import" || type === "dirt_export";
  const canRun = isDirt && acreage && target;

  const compute = () =>
    computeDirt({
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

  const runPreview = () => {
    if (!canRun) return;
    setPreview(compute());
  };

  const save = () => {
    if (!canRun) return;
    const result = compute();
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
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
    onChange();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
          Estimate inputs
        </h3>
        <div>
          <label className="label">Type</label>
          <select
            className="input mt-1"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Acreage *</label>
                <input
                  className="input num mt-1"
                  type="number"
                  step="0.01"
                  value={acreage}
                  onChange={(e) => setAcreage(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Target elev. *</label>
                <input
                  className="input num mt-1"
                  type="number"
                  step="0.01"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="439"
                />
              </div>
              <div>
                <label className="label">Shrinkage %</label>
                <input
                  className="input num mt-1"
                  type="number"
                  value={shrink}
                  onChange={(e) => setShrink(e.target.value)}
                />
              </div>
              <div>
                <label className="label">$ / CY material</label>
                <input
                  className="input num mt-1"
                  type="number"
                  value={costPerCY}
                  onChange={(e) => setCostPerCY(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="label">$ / CY haul</label>
                <input
                  className="input num mt-1"
                  type="number"
                  value={haulPerCY}
                  onChange={(e) => setHaulPerCY(e.target.value)}
                  placeholder="0"
                />
              </div>
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
          <textarea
            className="input mt-1"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button className="btn-secondary flex-1" onClick={runPreview} disabled={!canRun}>
            Preview
          </button>
          <button className="btn flex-1" onClick={save} disabled={!canRun}>
            Save estimate
          </button>
        </div>
        {savedFlash && (
          <p className="text-center text-xs font-medium text-emerald-800">✓ Estimate saved</p>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Result</h3>
        {!preview ? (
          <p className="mt-6 text-center text-sm text-stone-500">
            Click Preview to compute, or Save to keep it.
          </p>
        ) : (
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Method" v={preview.method === "tin" ? "TIN-weighted" : "Mean of shots"} />
            <Row label="Avg current elev." v={`${fmt(preview.avgElevation)} ft`} />
            <Row label="Lift (target − avg)" v={`${fmt(preview.liftFt)} ft`} />
            <Row
              label="Site area"
              v={`${fmt(preview.areaSqFt, 0)} ft² (${fmt(preview.areaSqFt / 43560, 2)} ac)`}
            />
            <Row label="Neat (compacted)" v={`${fmt(preview.neatVolumeCY, 0)} CY`} highlight />
            <Row label="Imported (loose)" v={`${fmt(preview.loadedVolumeCY, 0)} CY`} highlight />
            <Row label="Estimated cost" v={money(preview.totalCost)} highlight />
          </dl>
        )}
      </div>
    </div>
  );
}

function Row({ label, v, highlight }: { label: string; v: any; highlight?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        highlight ? "rounded-lg bg-emerald-50 px-2.5 py-1.5" : "px-2.5 py-1"
      }`}
    >
      <dt className="text-stone-500">{label}</dt>
      <dd className={`num font-medium ${highlight ? "text-emerald-900" : "text-stone-900"}`}>{v}</dd>
    </div>
  );
}

function HistoryTab({ projectId }: { projectId: string }) {
  const project = store.getProject(projectId)!;
  if (!project.estimates.length) {
    return (
      <div className="card p-10 text-center text-sm text-stone-500">No saved estimates yet.</div>
    );
  }
  return (
    <div className="space-y-3">
      {project.estimates.map((e) => (
        <div key={e.id} className="card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              {e.type.replace("_", " ")}
              <span className="chip">v{e.version}</span>
            </div>
            <div className="text-xs text-stone-500">
              {new Date(e.createdAt).toLocaleString()}
            </div>
          </div>
          {e.type.startsWith("dirt_") && (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm md:grid-cols-4">
              <Row label="Acreage" v={`${fmt(e.acreage)} ac`} />
              <Row label="Target elev" v={`${fmt(e.targetElevation)} ft`} />
              <Row label="Avg elev" v={`${fmt(e.avgElevation)} ft`} />
              <Row label="Shrinkage" v={`${fmt(e.shrinkagePct)}%`} />
              <Row label="Neat CY" v={fmt(e.neatVolumeCY, 0)} />
              <Row label="Loose CY" v={fmt(e.loadedVolumeCY, 0)} />
              <Row label="$ / CY" v={money(e.costPerCY)} />
              <Row label="Total" v={money(e.totalCost)} highlight />
            </dl>
          )}
          {e.notes && (
            <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
              {e.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
