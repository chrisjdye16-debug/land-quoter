"use client";
import { useMemo, useState } from "react";
import { computeDirt } from "@/lib/dirt";
import * as store from "@/lib/store";

const fmt = (n: any, d = 0) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const money = (n: any) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const moneyCompact = (n: any) => {
  const v = Number(n);
  if (n == null || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(abs >= 10e6 ? 1 : 2)}M`;
  if (abs >= 1e4) return `${sign}$${Math.round(abs / 1e3)}K`;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

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
    const a = Number(acreage),
      c = Number(current),
      t = Number(target);
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
    <div className="space-y-7">
      {/* Hero */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Dirt estimate
        </p>
        <h1 className="font-display mt-1.5 text-[2.5rem] font-medium leading-[1.05] tracking-tight text-stone-900 sm:text-5xl">
          Quote in <em className="italic text-emerald-900">seconds.</em>
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-stone-600">
          Live calculation — acreage, lift, shrinkage, cost. Save only when you want to.
        </p>
      </div>

      {/* Inputs */}
      <div className="card p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Field label="Acreage" suffix="ac" v={acreage} set={setAcreage} placeholder="200" />
          <Field label="Shrinkage" suffix="%" v={shrink} set={setShrink} />
          <Field label="Current elev." suffix="ft" v={current} set={setCurrent} placeholder="427.26" />
          <Field label="Target elev." suffix="ft" v={target} set={setTarget} placeholder="439" />
        </div>

        <div className="divider my-5">Pricing</div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Field label="Your cost" suffix="$/CY" v={costPerCY} set={setCostPerCY} placeholder="0" />
          <Field label="Sell price" suffix="$/CY" v={sellPerCY} set={setSellPerCY} placeholder="0" />
        </div>
      </div>

      {/* Result */}
      {r ? (
        <div className="card-feature p-7 sm:p-8">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Imported (loose)
              {Number.isFinite(r.liftFt) && (
                <span className="ml-2 text-stone-400">· {fmt(r.liftFt, 2)} ft lift</span>
              )}
            </p>
            <p className="font-display num mt-3 text-[64px] font-medium leading-none tracking-tight text-stone-900 sm:text-7xl">
              {fmt(r.importedCY)}
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800">
              cubic yards
            </p>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-3">
            <Metric label="Cost" value={moneyCompact(r.totalCost)} title={money(r.totalCost)} />
            <Metric label="Sell" value={moneyCompact(r.totalSell)} title={money(r.totalSell)} />
            <Metric label="Profit" value={moneyCompact(r.profit)} title={money(r.profit)} accent />
          </div>

          {r.totalSell > 0 && (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Margin
              </span>
              <span
                className={`num text-lg font-semibold tracking-tight ${
                  r.margin >= 0 ? "text-emerald-800" : "text-red-700"
                }`}
              >
                {r.margin.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="card flex items-center justify-center px-6 py-14 text-center text-sm text-stone-500">
          Enter acreage and elevations to see your estimate.
        </div>
      )}

      {/* Save */}
      {r && r.importedCY > 0 && (
        <div className="space-y-2">
          {!showSave ? (
            <button onClick={() => setShowSave(true)} className="btn-secondary w-full">
              Save this quote
            </button>
          ) : (
            <div className="card space-y-2.5 p-4">
              <input
                className="input"
                placeholder="Client name (optional)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={save} className="btn flex-1">
                  Save
                </button>
                <button onClick={() => setShowSave(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {savedMsg && (
            <p className="text-center text-sm font-medium text-emerald-800">✓ {savedMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  suffix,
  v,
  set,
  placeholder,
}: {
  label: string;
  suffix?: string;
  v: string;
  set: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label">{label}</span>
        {suffix && <span className="text-[10px] font-medium text-stone-400">{suffix}</span>}
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

function Metric({
  label,
  value,
  title,
  accent,
}: {
  label: string;
  value: string;
  title?: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "metric metric-accent" : "metric"} title={title}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p
        className={`num mt-1 text-[17px] font-semibold tracking-tight sm:text-lg ${
          accent ? "text-emerald-900" : "text-stone-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
