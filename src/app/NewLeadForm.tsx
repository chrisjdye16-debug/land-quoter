"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewLeadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", source: "", notes: "" });

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    const r = await fetch("/api/leads", { method: "POST", body: JSON.stringify(form), headers: { "content-type": "application/json" } });
    const lead = await r.json();
    setBusy(false);
    router.push(`/leads/${lead.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div><label className="label">Name *</label><input className="input" value={form.name} onChange={set("name")} /></div>
      <div><label className="label">Company</label><input className="input" value={form.company} onChange={set("company")} /></div>
      <div><label className="label">Email</label><input className="input" value={form.email} onChange={set("email")} /></div>
      <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
      <div><label className="label">Source</label><input className="input" value={form.source} onChange={set("source")} placeholder="referral, ad, etc." /></div>
      <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={set("notes")} /></div>
      <button className="btn w-full" disabled={busy}>{busy ? "Adding…" : "Add Lead"}</button>
    </form>
  );
}
