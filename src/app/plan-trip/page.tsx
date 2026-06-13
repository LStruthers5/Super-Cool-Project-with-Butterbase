"use client";

import { useApp } from "@/lib/app-context";
import { computeBeta } from "@/lib/beta";
import { useMemo } from "react";

// Plan a Trip — groups your confirmed portfolio by region so you can batch
// campus visits (the highest-weight enrichment action). The "Add to calendar"
// buttons open a real Google Calendar event-creation link (no OAuth needed).

const REGION: Record<string, string> = {
  "Los Angeles, CA": "Southern California",
  "Saratoga Springs, NY": "Upstate New York",
  "Clinton, NY": "Upstate New York",
};

// Build a Google Calendar event-creation URL — opens prefilled, user just saves.
function calendarUrl(name: string, loc: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Visit ${name}`,
    details: `Campus visit — the highest-impact demonstrated-interest action for ${name}. Book a tour, sit in on a class, and talk to a current student.`,
    location: loc,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function PlanTrip() {
  const { state } = useApp();

  const groups = useMemo(() => {
    if (!state) return {};
    const confirmed = new Set(state.portfolioIds);
    const g: Record<string, { name: string; short: string; loc: string; admit: number }[]> = {};
    state.colleges
      .filter((c) => confirmed.has(c.id))
      .forEach((c) => {
        const region = REGION[c.location] ?? c.location;
        const r = computeBeta(c, state.profile);
        (g[region] ??= []).push({ name: c.name, short: c.short, loc: c.location, admit: r.admit });
      });
    return g;
  }, [state]);

  if (!state) return <div className="p-10 text-muted">Loading…</div>;

  return (
    <div className="px-8 py-7 max-w-3xl">
      <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">Plan a trip</p>
      <h1 className="font-display text-3xl font-bold tracking-tight mb-2">College road trip builder</h1>
      <p className="text-muted mb-8 text-sm leading-relaxed max-w-lg">
        Visiting in person is the single biggest enrichment move. We grouped your portfolio by region so you can knock
        out a few at once.
      </p>

      <div className="space-y-5">
        {Object.entries(groups).map(([region, schools]) => (
          <div key={region} className="rounded-2xl border border-hair bg-card shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold">{region}</h2>
              <span className="text-xs text-muted">{schools.length} school{schools.length > 1 ? "s" : ""}</span>
            </div>
            <ul className="space-y-2">
              {schools.map((s) => (
                <li key={s.short} className="flex items-center justify-between rounded-lg bg-slatebg px-3 py-2.5">
                  <div>
                    <span className="font-display font-semibold text-sm">{s.name}</span>
                    <span className="text-xs text-muted ml-2">{s.loc}</span>
                  </div>
                  <a
                    href={calendarUrl(s.name, s.loc)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-fit hover:underline"
                  >
                    + Add to calendar
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {Object.keys(groups).length === 0 && (
        <p className="text-sm text-muted">
          No schools in your portfolio yet — add some from the{" "}
          <a href="/" className="text-fit hover:underline">Portfolio</a> page first.
        </p>
      )}

      <p className="mt-6 text-xs text-muted leading-relaxed">
        Calendar links open a prefilled Google Calendar event — just hit save. Connect Butterbase&apos;s Google
        Calendar integration to schedule tours and interviews without leaving the app.
      </p>
    </div>
  );
}
