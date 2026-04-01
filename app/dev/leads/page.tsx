"use client";

import { useEffect, useMemo, useState } from "react";
import {
  STORAGE_KEY,
  type DreamBrief,
  type LeadRecord,
  type StoredProgression,
  safeParseProgression,
} from "@/lib/progression";

function toCsv(records: LeadRecord[]): string {
  const rows = [
    ["id", "username", "email", "source", "createdAt"],
    ...records.map((lead) => [
      lead.id,
      lead.username,
      lead.email,
      lead.source,
      lead.createdAt,
    ]),
  ];
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

export default function DevLeadsPage() {
  const [state, setState] = useState<StoredProgression | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    setState(safeParseProgression(raw));
  }, []);

  const leads = useMemo<LeadRecord[]>(() => state?.leads ?? [], [state]);
  const briefs = useMemo<DreamBrief[]>(() => state?.briefs ?? [], [state]);

  const exportCsv = () => {
    const csv = toCsv(leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
            Private dev view
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Lead Inbox</h1>
          <p className="text-sm text-white/65">
            Local browser storage only. Export CSV and import into Google Sheets.
          </p>
        </header>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Level 1 Leads ({leads.length})</h2>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-full border border-cyan-400/35 bg-cyan-950/35 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-900/40"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/65">
                  <th className="px-2 py-2">Username</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5">
                    <td className="px-2 py-2">{lead.username}</td>
                    <td className="px-2 py-2">{lead.email}</td>
                    <td className="px-2 py-2">{lead.source}</td>
                    <td className="px-2 py-2 text-white/60">{lead.createdAt}</td>
                  </tr>
                ))}
                {!leads.length ? (
                  <tr>
                    <td className="px-2 py-4 text-white/50" colSpan={4}>
                      No leads yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="mb-4 text-lg font-medium">Dream Briefs ({briefs.length})</h2>
          <div className="space-y-3">
            {briefs.map((brief) => (
              <article
                key={brief.id}
                className="rounded-lg border border-white/10 bg-[#0b1020]/80 p-3"
              >
                <p className="text-xs uppercase tracking-wide text-fuchsia-200/70">
                  {brief.type}
                </p>
                <p className="mt-2 text-sm text-white/90">{brief.vibePrompt}</p>
                <p className="mt-2 text-sm text-white/70">{brief.primaryGoal}</p>
                <p className="mt-2 text-sm text-white/65">{brief.features}</p>
              </article>
            ))}
            {!briefs.length ? (
              <p className="text-sm text-white/55">No dream briefs yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

