"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import { computeBeta, schoolEnrichment } from "@/lib/beta";
import { BetaBadge } from "@/components/BetaBadge";
import { EnrichmentBar } from "@/components/EnrichmentBar";
import type { SchoolActivity } from "@/lib/data";

const ACTIVITY_LABELS: [keyof Omit<SchoolActivity, "collegeId">, string][] = [
  ["visitedInPerson", "Visited in person"],
  ["virtualTour", "Took the virtual tour"],
  ["talkedToStudent", "Talked to a current student"],
  ["interviewed", "Completed an interview"],
  ["foundClubs", "Found clubs to join"],
  ["startedSupplement", "Started supplemental essay"],
  ["finishedSupplement", "Finished supplemental essay"],
];

export default function CollegePage({ params }: { params: { id: string } }) {
  const { state, toggleActivity, upsertCollege } = useApp();
  const [sourcing, setSourcing] = useState(false);
  const [sourceLog, setSourceLog] = useState<string[]>([]);

  const college = state?.colleges.find((c) => c.id === params.id);
  const activity = state?.activity[params.id];

  const result = useMemo(
    () => (college && state ? computeBeta(college, state.profile) : null),
    [college, state]
  );
  const enr = activity ? schoolEnrichment(activity) : 0;

  if (!state) return <div className="p-10 text-muted">Loading…</div>;
  if (!college || !activity || !result)
    return (
      <div className="p-10">
        <p className="text-muted">College not found.</p>
        <Link href="/" className="text-fit underline">
          Back to portfolio
        </Link>
      </div>
    );

  async function runSourcingAgent() {
    setSourcing(true);
    setSourceLog(["Claude run: searching admissions data + institutional values…"]);
    try {
      const res = await fetch("/api/source-college", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: college!.name, location: college!.location }),
      });
      const data = await res.json();
      setSourceLog((l) => [...l, "Exa cross-check: verifying facts against second source…", data.verified ? "✓ Double-verified." : "⚠ Could not fully verify — showing best estimate."]);
      upsertCollege({
        ...college!,
        values: data.values,
        whyEssayAngle: data.whyEssayAngle,
        tourUrl: data.tourUrl,
        verified: data.verified,
      });
    } catch {
      setSourceLog((l) => [...l, "Agent unavailable — connect Butterbase model gateway in api/source-college."]);
    } finally {
      setSourcing(false);
    }
  }

  return (
    <div className="px-8 py-7 max-w-3xl">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Portfolio
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mt-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">{college.name}</h1>
          <p className="text-muted mt-1">{college.location}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/80">{result.blurb}</p>
        </div>
        <BetaBadge result={result} size={96} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Acceptance rate" value={`${Math.round(college.acceptanceRate * 100)}%`} />
        <Stat label="Your admit odds" value={`${Math.round(result.admit * 100)}%`} tone="amber" />
        <Stat label="Fit for you" value={`${Math.round(result.fit * 100)}%`} tone="fit" />
        <Stat label="Median SAT" value={`${college.medianSat}`} />
      </div>

      {/* School enrichment */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-semibold">School enrichment</span>
          <span className="text-xs text-muted">how much you&apos;ve done to de-risk {college.short}</span>
        </div>
        <EnrichmentBar value={enr} height={30} tone={enr >= 100 ? "fit" : "amber"} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* To-dos */}
        <div className="rounded-2xl border border-hair bg-card shadow-card p-5">
          <h2 className="font-display font-semibold mb-3">To-dos</h2>
          <ul className="flex flex-col gap-1.5">
            {ACTIVITY_LABELS.map(([key, label]) => {
              const done = activity[key];
              const isTour = key === "visitedInPerson";
              return (
                <li key={key}>
                  <button
                    onClick={() => toggleActivity(college.id, key)}
                    className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slatebg transition-colors"
                  >
                    <span
                      className={`grid place-items-center h-5 w-5 rounded border text-xs ${
                        done ? "bg-fit border-fit text-white" : "border-hair text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={`text-sm flex-1 ${done ? "line-through text-muted" : "text-ink"}`}>
                      {label}
                    </span>
                    {isTour && college.tourUrl && (
                      <a
                        href={college.tourUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-fit hover:underline"
                      >
                        Book →
                      </a>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Application values & aspects (agent-sourced) */}
        <div className="rounded-2xl border border-hair bg-card shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Values &amp; aspects</h2>
            {college.verified && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-fit bg-fitsoft px-2 py-0.5 rounded">
                ✓ Verified
              </span>
            )}
          </div>

          {college.values ? (
            <div className="space-y-3 text-sm leading-relaxed">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">What they value</p>
                <p className="text-ink/90">{college.values}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">Why-this-school angle</p>
                <p className="text-ink/90">{college.whyEssayAngle}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted mb-4">
              Run the sourcing agent to pull this school&apos;s values and a personalized essay angle — Claude searches,
              Exa double-checks.
            </p>
          )}

          <button
            onClick={runSourcingAgent}
            disabled={sourcing}
            className="mt-4 w-full rounded-xl bg-ink text-white py-2.5 text-sm font-display font-semibold hover:bg-ink/90 disabled:opacity-60 transition-colors"
          >
            {sourcing ? "Running agents…" : college.values ? "Re-run sourcing agent" : "Run sourcing agent"}
          </button>

          {sourceLog.length > 0 && (
            <div className="mt-3 rounded-lg bg-slatebg p-3 font-mono text-[11px] leading-relaxed text-muted space-y-1">
              {sourceLog.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strengths chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {college.strengths.map((s) => (
          <span key={s} className="rounded-full border border-hair bg-card px-3 py-1 text-xs text-muted">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "fit" | "amber" }) {
  const color = tone === "fit" ? "text-fit" : tone === "amber" ? "text-amber" : "text-ink";
  return (
    <div className="rounded-xl border border-hair bg-card p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`font-mono text-2xl font-bold tabular mt-1 ${color}`}>{value}</div>
    </div>
  );
}
