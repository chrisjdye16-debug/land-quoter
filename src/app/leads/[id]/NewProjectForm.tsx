"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", acreage: "", notes: "" });
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    const r = await fetch("/api/projects", { method: "POST", body: JSON.stringify({ ...form, leadId }), headers: { "content-type": "application/json" } });
    const p = await r.json();
    setBusy(false);
    router.push(`/projects/${p.id}`);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div><label className="label">Project name *</label><input className="input" value={form.name} onChange={set("name")} /></div>
      <div><label className="label">Location</label><input className="input" value={form.location} onChange={set("location")} placeholder="city, county, parcel ID" /></div>
      <div><label className="label">Acreage</label><input className="input" type="number" step="0.01" value={form.acreage} onChange={set("acreage")} /></div>
      <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={set("notes")} /></div>
      <button className="btn w-full" disabled={busy}>{busy ? "Adding…" : "Add Project"}</button>
    </form>
  );
}
