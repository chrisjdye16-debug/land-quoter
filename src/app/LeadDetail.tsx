"use client";
import { useState } from "react";
import * as store from "@/lib/store";

export function LeadDetail({ leadId, onChange }: { leadId: string; onChange: () => void }) {
  const [form, setForm] = useState({ name: "", location: "", acreage: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const lead = store.getLead(leadId);
  if (!lead) {
    return (
      <div className="card p-6 text-center">
        <p className="text-stone-600">Lead not found.</p>
        <a href="#/saved" className="btn-secondary mt-3 inline-block">
          ← Back to saved
        </a>
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
    window.location.hash = "/saved";
    onChange();
  };

  return (
    <div className="space-y-6">
      <div>
        <a href="#/saved" className="text-sm text-stone-500 hover:text-stone-900">
          ← All leads
        </a>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display truncate text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
              {lead.name}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="chip">{lead.status}</span>
              {lead.source && (
                <span className="text-xs text-stone-500">via {lead.source}</span>
              )}
            </div>
          </div>
          <button onClick={handleDelete} className="btn-danger shrink-0">
            Delete
          </button>
        </div>
        {lead.notes && (
          <p className="mt-3 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
            {lead.notes}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
          Projects ({projects.length})
        </h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`whitespace-nowrap ${showForm ? "btn-secondary" : "btn"}`}
        >
          {showForm ? "Cancel" : "+ New project"}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Project name *</label>
              <input className="input mt-1" value={form.name} onChange={set("name")} autoFocus />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input mt-1"
                value={form.location}
                onChange={set("location")}
                placeholder="city, county, parcel ID"
              />
            </div>
            <div>
              <label className="label">Acreage</label>
              <input
                className="input mt-1"
                type="number"
                step="0.01"
                value={form.acreage}
                onChange={set("acreage")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input mt-1" rows={2} value={form.notes} onChange={set("notes")} />
            </div>
            <div className="sm:col-span-2">
              <button className="btn w-full" disabled={busy}>
                {busy ? "Adding…" : "Add project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-sm text-stone-500">No projects yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="t">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hidden sm:table-cell">Location</th>
                <th className="text-right">Acres</th>
                <th className="text-right">Estimates</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <a
                      href={`#/project/${p.id}`}
                      className="font-medium text-stone-900 hover:text-emerald-900"
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="hidden text-stone-600 sm:table-cell">{p.location || "—"}</td>
                  <td className="text-right num text-stone-700">{p.acreage ?? "—"}</td>
                  <td className="text-right num text-stone-700">{p.estimates.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
