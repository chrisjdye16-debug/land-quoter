"use client";
import { useState } from "react";
import * as store from "@/lib/store";

export function LeadsView({ onChange }: { onChange: () => void }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", source: "", notes: "" });
  const [busy, setBusy] = useState(false);
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
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Leads</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-stone-500">No leads yet — add one on the right →</p>
        ) : (
          <table className="t">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Status</th>
                <th>Projects</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const projectCount = store.listProjectsForLead(l.id).length;
                return (
                  <tr key={l.id} className="hover:bg-stone-50">
                    <td>
                      <a href={`#/lead/${l.id}`} className="font-medium hover:underline">{l.name}</a>
                    </td>
                    <td>{l.company || "—"}</td>
                    <td><span className="chip">{l.status}</span></td>
                    <td>{projectCount}</td>
                    <td className="text-stone-500">{new Date(l.updatedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">New Lead</h2>
        <form onSubmit={submit} className="space-y-2">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={set("name")} /></div>
          <div><label className="label">Company</label><input className="input" value={form.company} onChange={set("company")} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={set("email")} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
          <div><label className="label">Source</label><input className="input" value={form.source} onChange={set("source")} placeholder="referral, ad, etc." /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={set("notes")} /></div>
          <button className="btn w-full" disabled={busy}>{busy ? "Adding…" : "Add Lead"}</button>
        </form>
      </div>
    </div>
  );
}
