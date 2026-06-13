"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  computeBeta,
  schoolEnrichment,
  portfolioEnrichment,
  nextSchoolAction,
  type BetaResult,
} from "@/lib/beta";
import { BetaBadge } from "@/components/BetaBadge";
import { EnrichmentBar } from "@/components/EnrichmentBar";

type SortKey = "beta" | "enrichment" | "fit";

export default function Dashboard() {
  const { state, toggleReadiness } = useApp();
  const [sort, setSort] = useState<SortKey>("beta");

  const rows = useMemo(() => {
    if (!state) return [];
    return state.colleges.map((c) => {
      const result = computeBeta(c, state.profile);
      const enr = schoolEnrichment(state.activity[c.id]);
      return { college: c, result, enr, next: nextSchoolAction(state.activity[c.id]) };
    });
  }, [state]);

  const portfolio = useMemo(() => {
    if (!state) return 0;
    return portfolioEnrichment(
      rows.map((r) => r.enr),
      state.readiness,
      rows.map((r) => r.result.bucket)
    );
  }, [rows, state]);

  if (!state) return <div className="p-10 text-muted">Loading your portfolio…</div>;

  const sorted = [...rows].sort((a, b) => {
    if (sort === "beta") return a.result.beta - b.result.beta;
    if (sort === "fit") return b.result.fit - a.result.fit;
    return b.enr - a.enr;
  });

  return (
    <div className="px-8 py-7 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">Your portfolio</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {state.profile.name === "You" ? "Your" : `${state.profile.name}'s`} college portfolio
          </h1>
        </div>
        <div className="flex gap-2 text-sm">
          {(["beta", "enrichment", "fit"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-colors ${
                sort === k ? "bg-ink text-white" : "bg-card border border-hair text-muted hover:text-ink"
              }`}
            >
              Sort: {k === "beta" ? "β" : k}
            </button>
          ))}
        </div>
      </div>

      {/* College chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {rows.map((r) => (
          <Link
            key={r.college.id}
            href={`/college/${r.college.id}`}
            className="rounded-lg border border-hair bg-card px-3 py-1.5 text-sm font-display font-semibold hover:border-ink transition-colors"
          >
            {r.college.short}
          </Link>
        ))}
      </div>

      {/* Portfolio enrichment bar */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-semibold">Portfolio readiness</span>
          <span className="text-xs text-muted">how de-risked your whole set is</span>
        </div>
        <EnrichmentBar value={portfolio} height={32} />
        <div className="flex flex-wrap gap-3 mt-4">
          {(
            [
              ["commonAppDone", "Common App"],
              ["testsSubmitted", "Tests submitted"],
              ["recsRequested", "Recs requested"],
              ["fafsaDone", "FAFSA"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleReadiness(key)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                state.readiness[key]
                  ? "border-fit bg-fitsoft text-fit font-semibold"
                  : "border-hair text-muted hover:text-ink"
              }`}
            >
              <span>{state.readiness[key] ? "✓" : "○"}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* School rows */}
      <div className="rounded-2xl border border-hair bg-card shadow-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-hair text-[11px] uppercase tracking-wider text-muted font-semibold">
          <span>School</span>
          <span className="text-right">Enrichment</span>
          <span className="text-right pr-2">β</span>
        </div>
        {sorted.map((r) => (
          <Row key={r.college.id} short={r.college.short} name={r.college.name} loc={r.college.location} id={r.college.id} enr={r.enr} next={r.next} result={r.result} />
        ))}
      </div>

      <p className="mt-5 text-xs text-muted leading-relaxed max-w-2xl">
        <span className="font-mono font-bold text-ink">β = college risk ÷ fit.</span> Lower β anchors your portfolio;
        higher β is a reach whose upside has to justify the risk. Click any school to see its values, to-dos, and the
        agent-sourced details.
      </p>
    </div>
  );
}

function Row({
  id,
  short,
  name,
  loc,
  enr,
  next,
  result,
}: {
  id: string;
  short: string;
  name: string;
  loc: string;
  enr: number;
  next: string;
  result: BetaResult;
}) {
  return (
    <Link
      href={`/college/${id}`}
      className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 border-b border-hair last:border-0 hover:bg-slatebg transition-colors"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold">{name}</span>
          <span className="text-xs text-muted truncate">{loc}</span>
        </div>
        <div className="text-xs text-muted mt-0.5">
          Next: <span className="text-ink">{next}</span>
        </div>
      </div>
      <div className="w-40">
        <EnrichmentBar value={enr} height={22} tone={enr >= 100 ? "fit" : "amber"} />
      </div>
      <div className="pr-1">
        <BetaBadge result={result} size={56} />
      </div>
    </Link>
  );
}
