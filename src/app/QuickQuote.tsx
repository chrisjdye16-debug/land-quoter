"use client";
import { useMemo, useState } from "react";
import { computeDirt } from "@/lib/dirt";
import * as store from "@/lib/store";

const fmt = (n: any, d = 0) =>
  n == null || !Number.isFinite(Number(n)) ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const money = (n: any) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function QuickQuote() {
  const [acreage, setAcreage] = useState("");
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");
  const [shrink, setShrink] = useState("20");
  const [costPerCY, setCostPerCY] = useState("");
  const [sellPerCY, setSellPerCY] = useState("");

  const [showSave, setShowSave] = useState(false);
  const [clientName, setClientName] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const r = useMemo(() => {
    const a = Number(acreage), c = Number(current), t = Number(target);
    if (!a || !Number.isFinite(c) || !Number.isFinite(t)) return null;
    const dirt = computeDirt({
      acreage: a,
      targetElevation: t,
      shots: [{ elevation: c }],
      shrinkagePct: Number(shrink) || 0,
      costPerCY: Number(costPerCY) || 0,
    });
    const importedCY = Math.max(0, dirt.loadedVolumeCY);
    const totalCost = importedCY * (Number(costPerCY) || 0);
    const totalSell = importedCY * (Number(sellPerCY) || 0);
    const profit = totalSell - totalCost;
    const margin = totalSell > 0 ? (profit / totalSell) * 100 : 0;
    return { importedCY, totalCost, totalSell, profit, margin, liftFt: dirt.liftFt };
  }, [acreage, current, target, shrink, costPerCY, sellPerCY]);

  const save = () => {
    if (!r) return;
    const lead = store.createLead({ name: clientName.trim() || "Untitled" });
    const project = store.createProject({
      leadId: lead.id,
      name: `${fmt(Number(acreage))}-ac fill`,
      acreage: Number(acreage),
    });
    store.addEstimate(project.id, {
      type: "dirt_import",
      acreage: Number(acreage),
      targetElevation: Number(target),
      avgElevation: Number(current),
      shrinkagePct: Number(shrink) || 0,
      costPerCY: Number(costPerCY) || 0,
      neatVolumeCY: r.importedCY * (1 - (Number(shrink) || 0) / 100),
      loadedVolumeCY: r.importedCY,
      totalCost: r.totalCost,
      notes: `Sell ${money(r.totalSell)} • Profit ${money(r.profit)}`,
    });
    setSavedMsg(`Saved to ${clientName.trim() || "Untitled"}`);
    setShowSave(false);
    setClientName("");
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-500">
          Dirt Estimate
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold leading-tight tracking-tight">
          Quote in seconds.
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          Live calc. No setup. Save only when you want.
        </p>
      </div>

      {/* Inputs */}
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Acreage" suffix="ac" v={acreage} set={setAcreage} placeholder="200" />
          <Field label="Shrinkage" suffix="%" v={shrink} set={setShrink} />
          <Field label="Current elev." suffix="ft" v={current} set={setCurrent} placeholder="427.26" />
          <Field label="Target elev." suffix="ft" v={target} set={setTarget} placeholder="439" />
        </div>

        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          <span className="h-px flex-1 bg-stone-800" />
          Pricing
          <span className="h-px flex-1 bg-stone-800" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Your cost" suffix="$/CY" v={costPerCY} set={setCostPerCY} placeholder="0" />
          <Field label="Sell price" suffix="$/CY" v={sellPerCY} set={setSellPerCY} placeholder="0" />
        </div>
      </div>

      {/* Result */}
      {r ? (
        <div className="card card-glow p-6">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Imported (loose) • {fmt(r.liftFt, 2)} ft lift
            </p>
            <p className="font-display mt-2 num text-5xl font-bold leading-none tracking-tight text-white">
              {fmt(r.importedCY)}
            </p>
            <p className="mt-1 text-sm font-medium uppercase tracking-widest text-amber-500">
              cubic yards
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <Metric label="Cost" value={money(r.totalCost)} />
            <Metric label="Sell" value={money(r.totalSell)} accent="text-sky-300" />
            <Metric label="Profit" value={money(r.profit)} accent="text-emerald-300" />
          </div>

          {r.totalSell > 0 && (
            <div className="mt-4 rounded-xl bg-stone-900/60 px-4 py-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Margin
              </span>
              <span className="num ml-3 text-lg font-bold tracking-tight text-amber-400">
                {r.margin.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="card flex items-center justify-center p-12 text-sm text-stone-500">
          Enter acreage + elevations to see the estimate.
        </div>
      )}

      {/* Save */}
      {r && (
        <div className="space-y-2">
          {!showSave ? (
            <button onClick={() => setShowSave(true)} className="btn-secondary w-full">
              Save this quote
            </button>
          ) : (
            <div className="card space-y-2 p-3">
              <input
                className="input"
                placeholder="Client name (optional)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={save} className="btn flex-1">Save</button>
                <button onClick={() => setShowSave(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          {savedMsg && (
            <p className="text-center text-sm text-emerald-400">✓ {savedMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label, suffix, v, set, placeholder,
}: { label: string; suffix?: string; v: string; set: (s: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label">{label}</span>
        {suffix && <span className="text-[10px] font-medium text-stone-500">{suffix}</span>}
      </div>
      <input
        className="input num"
        type="number"
        inputMode="decimal"
        value={v}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-stone-900/70 px-3 py-3 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className={`num mt-1 text-base font-bold tracking-tight ${accent || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
