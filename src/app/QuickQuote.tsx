"use client";
import { useMemo, useState } from "react";
import { computeDirt } from "@/lib/dirt";
import * as store from "@/lib/store";

const SQFT_PER_ACRE = 43560;
const CF_PER_CY = 27;

const fmt = (n: any, d = 0) =>
  n == null || !Number.isFinite(Number(n)) ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const money = (n: any) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: any) =>
  n == null || !Number.isFinite(Number(n)) ? "—" : `${Number(n).toFixed(1)}%`;

export function QuickQuote() {
  // Inputs
  const [acreage, setAcreage] = useState("");
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");
  const [shrink, setShrink] = useState("20");
  const [costPerCY, setCostPerCY] = useState("");
  const [haulPerCY, setHaulPerCY] = useState("");
  const [pricingMode, setPricingMode] = useState<"sell" | "margin">("margin");
  const [sellPerCY, setSellPerCY] = useState("");
  const [marginPct, setMarginPct] = useState("25");

  // Save form
  const [saveOpen, setSaveOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const result = useMemo(() => {
    const a = Number(acreage);
    const c = Number(current);
    const t = Number(target);
    if (!a || !Number.isFinite(c) || !Number.isFinite(t)) return null;

    const dirt = computeDirt({
      acreage: a,
      targetElevation: t,
      shots: [{ elevation: c }],
      shrinkagePct: Number(shrink) || 0,
      costPerCY: Number(costPerCY) || 0,
      haulCostPerCY: Number(haulPerCY) || 0,
    });

    const cost = dirt.totalCost;
    const importedCY = Math.max(0, dirt.loadedVolumeCY);

    let sellPriceTotal = 0;
    let pricePerCY = 0;
    if (pricingMode === "sell" && sellPerCY) {
      pricePerCY = Number(sellPerCY);
      sellPriceTotal = pricePerCY * importedCY;
    } else if (pricingMode === "margin" && marginPct) {
      const m = Number(marginPct) / 100;
      // margin = (price - cost) / price → price = cost / (1 - margin)
      sellPriceTotal = m < 1 ? cost / (1 - m) : 0;
      pricePerCY = importedCY > 0 ? sellPriceTotal / importedCY : 0;
    }
    const profit = sellPriceTotal - cost;
    const realizedMargin = sellPriceTotal > 0 ? (profit / sellPriceTotal) * 100 : 0;

    return { ...dirt, cost, importedCY, sellPriceTotal, pricePerCY, profit, realizedMargin };
  }, [acreage, current, target, shrink, costPerCY, haulPerCY, pricingMode, sellPerCY, marginPct]);

  const canSave = !!result && (clientName.trim() || projectName.trim());

  const save = () => {
    if (!result) return;
    const lead = store.createLead({
      name: clientName.trim() || "Untitled client",
    });
    const project = store.createProject({
      leadId: lead.id,
      name: projectName.trim() || `${fmt(Number(acreage))}-acre fill`,
      acreage: Number(acreage),
    });
    store.addShots(project.id, [
      { elevation: Number(current), source: "manual" as const },
    ]);
    store.addEstimate(project.id, {
      type: "dirt_import",
      acreage: Number(acreage),
      targetElevation: Number(target),
      avgElevation: Number(current),
      shrinkagePct: Number(shrink) || 0,
      costPerCY: Number(costPerCY) || 0,
      haulCostPerCY: Number(haulPerCY) || 0,
      neatVolumeCY: result.neatVolumeCY,
      loadedVolumeCY: result.loadedVolumeCY,
      totalCost: result.cost,
      notes: `Sell: ${money(result.sellPriceTotal)} • Profit: ${money(result.profit)} • Margin: ${pct(result.realizedMargin)}`,
    });
    setSavedMsg(`Saved to ${clientName.trim() || "Untitled client"} → ${projectName.trim() || "fill project"}`);
    setSaveOpen(false);
    setClientName("");
    setProjectName("");
    setTimeout(() => setSavedMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quick Quote</h1>
        <p className="text-sm text-stone-600">
          Type your numbers — the estimate updates live. Save it to your CRM only when you want.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        {/* INPUTS */}
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Acreage" suffix="ac">
              <input className="input" type="number" step="0.01" value={acreage} onChange={(e) => setAcreage(e.target.value)} placeholder="200" />
            </Field>
            <Field label="Shrinkage" suffix="%">
              <input className="input" type="number" value={shrink} onChange={(e) => setShrink(e.target.value)} placeholder="20" />
            </Field>
            <Field label="Current elevation" suffix="ft">
              <input className="input" type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="427.26" />
            </Field>
            <Field label="Target elevation" suffix="ft">
              <input className="input" type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="439" />
            </Field>
          </div>

          <div className="border-t border-stone-200 pt-3">
            <p className="label">Your costs</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Material" suffix="$/CY">
                <input className="input" type="number" step="0.01" value={costPerCY} onChange={(e) => setCostPerCY(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Haul" suffix="$/CY">
                <input className="input" type="number" step="0.01" value={haulPerCY} onChange={(e) => setHaulPerCY(e.target.value)} placeholder="0" />
              </Field>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-3">
            <p className="label">Your pricing</p>
            <div className="mb-2 flex gap-2 text-xs">
              <button
                onClick={() => setPricingMode("margin")}
                className={`rounded-md px-2 py-1 ${pricingMode === "margin" ? "bg-stone-900 text-white" : "border border-stone-300 bg-white"}`}
              >
                Set margin %
              </button>
              <button
                onClick={() => setPricingMode("sell")}
                className={`rounded-md px-2 py-1 ${pricingMode === "sell" ? "bg-stone-900 text-white" : "border border-stone-300 bg-white"}`}
              >
                Set sell $/CY
              </button>
            </div>
            {pricingMode === "margin" ? (
              <Field label="Target margin" suffix="%">
                <input className="input" type="number" step="0.1" value={marginPct} onChange={(e) => setMarginPct(e.target.value)} placeholder="25" />
              </Field>
            ) : (
              <Field label="Sell price" suffix="$/CY">
                <input className="input" type="number" step="0.01" value={sellPerCY} onChange={(e) => setSellPerCY(e.target.value)} placeholder="0" />
              </Field>
            )}
          </div>
        </div>

        {/* RESULT */}
        <div className="card border-stone-300 bg-gradient-to-br from-stone-50 to-stone-100">
          {!result ? (
            <div className="flex h-full min-h-[300px] items-center justify-center text-center text-sm text-stone-500">
              Fill in acreage + elevations to see the estimate.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Lift</p>
                <p className="text-lg font-semibold">
                  {fmt(result.liftFt, 2)} ft over {fmt(Number(acreage), 2)} ac
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat label="Compacted (neat)" value={`${fmt(result.neatVolumeCY)} CY`} sub="what stays in place" />
                <Stat label="Imported (loose)" value={`${fmt(result.importedCY)} CY`} sub={`${shrink}% shrinkage`} highlight />
              </div>

              <div className="rounded-lg bg-white p-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-stone-500">Your cost</p>
                    <p className="text-lg font-semibold text-stone-900">{money(result.cost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-stone-500">Sell price</p>
                    <p className="text-lg font-semibold text-blue-700">{money(result.sellPriceTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-stone-500">Profit</p>
                    <p className="text-lg font-semibold text-green-700">{money(result.profit)}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 border-t border-stone-200 pt-2 text-center text-xs text-stone-600">
                  <div>{result.cost > 0 && result.importedCY > 0 ? `${money(result.cost / result.importedCY)} /CY` : "—"}</div>
                  <div>{result.pricePerCY ? `${money(result.pricePerCY)} /CY` : "—"}</div>
                  <div>{result.realizedMargin ? `${pct(result.realizedMargin)} margin` : "—"}</div>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-3">
                {!saveOpen ? (
                  <button onClick={() => setSaveOpen(true)} className="btn-secondary w-full">
                    💾 Save this quote
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" placeholder="Client name (optional)" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                      <input className="input" placeholder="Project name (optional)" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={save} className="btn flex-1">Save</button>
                      <button onClick={() => setSaveOpen(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}
                {savedMsg && <p className="mt-2 text-center text-xs text-green-700">✅ {savedMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label flex items-center justify-between">
        <span>{label}</span>
        {suffix && <span className="font-normal text-stone-400">{suffix}</span>}
      </label>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-stone-900 text-white" : "bg-white"}`}>
      <p className={`text-[10px] uppercase tracking-wide ${highlight ? "text-stone-300" : "text-stone-500"}`}>{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className={`text-[10px] ${highlight ? "text-stone-400" : "text-stone-500"}`}>{sub}</p>}
    </div>
  );
}
