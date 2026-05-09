"use client";
import { useState } from "react";
import * as store from "@/lib/store";

export function LeadsView({ onChange }: { onChange: () => void }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", source: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const leads = store.listLeads();

  const set = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: any) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    const lead = store.createLead({
      name: form.name.trim(),
      company: form.company || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      source: form.source || undefined,
      notes: form.notes || undefined,
    });
    setBusy(false);
    setForm({ name: "", company: "", email: "", phone: "", source: "", notes: "" });
    window.location.hash = `/lead/${lead.id}`;
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Saved
          </p>
          <h1 className="font-display mt-1 text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
            Leads & projects
          </h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`whitespace-nowrap ${showForm ? "btn-secondary" : "btn"}`}
        >
          {showForm ? "Cancel" : "+ New lead"}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
            New lead
          </h2>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Name *</label>
              <input className="input mt-1" value={form.name} onChange={set("name")} autoFocus />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input mt-1" value={form.company} onChange={set("company")} />
            </div>
            <div>
              <label className="label">Source</label>
              <input
                className="input mt-1"
                value={form.source}
                onChange={set("source")}
                placeholder="referral, ad, etc."
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input mt-1" value={form.email} onChange={set("email")} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input mt-1" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input mt-1" rows={2} value={form.notes} onChange={set("notes")} />
            </div>
            <div className="sm:col-span-2">
              <button className="btn w-full" disabled={busy}>
                {busy ? "Adding…" : "Add lead"}
              </button>
            </div>
          </form>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
          <p className="font-display text-xl text-stone-700">No leads yet.</p>
          <p className="mt-1 text-sm text-stone-500">
            Quote on the home page and tap “Save this quote” — or add a lead above.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="t">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hidden sm:table-cell">Company</th>
                <th>Status</th>
                <th className="text-right">Projects</th>
                <th className="hidden text-right sm:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const projectCount = store.listProjectsForLead(l.id).length;
                return (
                  <tr key={l.id} className="cursor-pointer">
                    <td>
                      <a
                        href={`#/lead/${l.id}`}
                        className="font-medium text-stone-900 hover:text-emerald-900"
                      >
                        {l.name}
                      </a>
                    </td>
                    <td className="hidden text-stone-600 sm:table-cell">{l.company || "—"}</td>
                    <td>
                      <span className="chip">{l.status}</span>
                    </td>
                    <td className="text-right num text-stone-700">{projectCount}</td>
                    <td className="hidden text-right text-stone-500 sm:table-cell">
                      {new Date(l.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
