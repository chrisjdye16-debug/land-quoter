"use client";
import { useState } from "react";
import * as store from "@/lib/store";

export function LeadDetail({ leadId, onChange }: { leadId: string; onChange: () => void }) {
  const [form, setForm] = useState({ name: "", location: "", acreage: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const lead = store.getLead(leadId);
  if (!lead) {
    return (
      <div className="card">
        <p>Lead not found.</p>
        <a href="#/" className="btn-secondary mt-2 inline-block">Back to leads</a>
      </div>
    );
  }
  const projects = store.listProjectsForLead(leadId);

  const set = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: any) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    const p = store.createProject({
      leadId,
      name: form.name.trim(),
      location: form.location || undefined,
      acreage: form.acreage ? Number(form.acreage) : undefined,
      notes: form.notes || undefined,
    });
    setBusy(false);
    window.location.hash = `/project/${p.id}`;
    onChange();
  };

  const handleDelete = () => {
    if (!confirm(`Delete ${lead.name} and all their projects? This cannot be undone.`)) return;
    store.deleteLead(leadId);
    window.location.hash = "/";
    onChange();
  };

  return (
    <div className="space-y-6">
      <div>
        <a href="#/" className="text-sm text-stone-500 hover:underline">← All leads</a>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <p className="text-sm text-stone-600">
              {[lead.company, lead.email, lead.phone].filter(Boolean).join(" • ") || "—"}
            </p>
            <p className="mt-1">
              <span className="chip">{lead.status}</span>
              {lead.source && <span className="ml-2 text-xs text-stone-500">via {lead.source}</span>}
            </p>
          </div>
          <button onClick={handleDelete} className="btn-danger">Delete lead</button>
        </div>
        {lead.notes && <p className="mt-2 whitespace-pre-wrap rounded-md bg-stone-100 p-3 text-sm">{lead.notes}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-stone-500">No projects yet — add one →</p>
          ) : (
            <table className="t">
              <thead><tr><th>Name</th><th>Location</th><th>Acreage</th><th>Estimates</th></tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td><a href={`#/project/${p.id}`} className="font-medium hover:underline">{p.name}</a></td>
                    <td>{p.location || "—"}</td>
                    <td>{p.acreage ?? "—"}</td>
                    <td>{p.estimates.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">New Project</h2>
          <form onSubmit={submit} className="space-y-2">
            <div><label className="label">Project name *</label><input className="input" value={form.name} onChange={set("name")} /></div>
            <div><label className="label">Location</label><input className="input" value={form.location} onChange={set("location")} placeholder="city, county, parcel ID" /></div>
            <div><label className="label">Acreage</label><input className="input" type="number" step="0.01" value={form.acreage} onChange={set("acreage")} /></div>
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={set("notes")} /></div>
            <button className="btn w-full" disabled={busy}>{busy ? "Adding…" : "Add Project"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
