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
import { getUniverse } from "@/lib/catalog";
import { recommend, balancedStarter } from "@/lib/recommend";
import { blankActivity } from "@/lib/store";
import { BetaBadge } from "@/components/BetaBadge";
import { EnrichmentBar } from "@/components/EnrichmentBar";
import { RiskControls } from "@/components/RiskControls";
import { RecommendationCard } from "@/components/RecommendationCard";
import { SchoolSearch } from "@/components/SchoolSearch";

type SortKey = "beta" | "enrichment" | "fit";

const MAX_RECS = 8;

export default function Dashboard() {
  const { state, toggleReadiness, confirmToPortfolio, removeFromPortfolio, setRisk } = useApp();
  const [sort, setSort] = useState<SortKey>("beta");

  const universe = useMemo(() => (state ? getUniverse(state.colleges) : []), [state]);

  // Confirmed "true" portfolio rows.
  const rows = useMemo(() => {
    if (!state) return [];
    const confirmed = new Set(state.portfolioIds);
    return universe
      .filter((c) => confirmed.has(c.id))
      .map((c) => {
        const result = computeBeta(c, state.profile);
        const enr = schoolEnrichment(state.activity[c.id] ?? blankActivity(c.id));
        return { college: c, result, enr, next: nextSchoolAction(state.activity[c.id] ?? blankActivity(c.id)) };
      });
  }, [state, universe]);

  const portfolio = useMemo(() => {
    if (!state) return 0;
    return portfolioEnrichment(
      rows.map((r) => r.enr),
      state.readiness,
      rows.map((r) => r.result.bucket)
    );
  }, [rows, state]);

  // Ranked recommendations from the catalog, driven by the risk dials.
  const recs = useMemo(() => {
    if (!state) return [];
    return recommend(universe, state.profile, state.portfolioIds, state.risk);
  }, [state, universe]);

  const candidates = useMemo(() => {
    if (!state) return [];
    const confirmed = new Set(state.portfolioIds);
    return universe.filter((c) => !confirmed.has(c.id));
  }, [state, universe]);

  if (!state) return <div className="p-10 text-muted">Loading your portfolio…</div>;

  const sorted = [...rows].sort((a, b) => {
    if (sort === "beta") return a.result.beta - b.result.beta;
    if (sort === "fit") return b.result.fit - a.result.fit;
    return b.enr - a.enr;
  });

  const buildBalanced = () => balancedStarter(recs, state.risk.targetCount).forEach((r) => confirmToPortfolio(r.college));
  const gap = state.risk.targetCount - rows.length;

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
        {rows.length === 0 && <span className="text-sm text-muted">No schools yet — add some below.</span>}
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
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-8">
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

      {/* Confirmed school rows */}
      <div className="rounded-2xl border border-hair bg-card shadow-card overflow-hidden mb-10">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-hair text-[11px] uppercase tracking-wider text-muted font-semibold">
          <span>School</span>
          <span className="text-right">Enrichment</span>
          <span className="text-right pr-2">β</span>
          <span className="sr-only">Remove</span>
        </div>
        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">
            Build your portfolio from the recommendations below.
          </div>
        ) : (
          sorted.map((r) => (
            <Row
              key={r.college.id}
              id={r.college.id}
              short={r.college.short}
              name={r.college.name}
              loc={r.college.location}
              enr={r.enr}
              next={r.next}
              result={r.result}
              onRemove={() => removeFromPortfolio(r.college.id)}
            />
          ))
        )}
      </div>

      {/* ---- Recommendations -------------------------------------------- */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-1">
        <h2 className="font-display text-2xl font-bold tracking-tight">Recommended for you</h2>
        <button
          onClick={buildBalanced}
          className="rounded-xl border border-ink bg-card px-4 py-2 text-sm font-display font-semibold text-ink hover:bg-ink hover:text-white transition-colors"
        >
          Build a balanced list ({state.risk.targetCount})
        </button>
      </div>
      <p className="text-sm text-muted mb-4 max-w-2xl">
        Tuned to your risk appetite. {gap > 0 ? `You're ${gap} short of your ${state.risk.targetCount}-school target.` : "You've hit your target — anything below is upside."}
      </p>

      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-5">
        <RiskControls risk={state.risk} onChange={setRisk} />
      </div>

      <div className="mb-4">
        <SchoolSearch candidates={candidates} onAdd={confirmToPortfolio} />
      </div>

      <div className="flex flex-col gap-3">
        {recs.length === 0 ? (
          <p className="text-sm text-muted">You've added every school in the catalog. 🎉</p>
        ) : (
          recs
            .slice(0, MAX_RECS)
            .map((rec) => (
              <RecommendationCard key={rec.college.id} rec={rec} onAdd={() => confirmToPortfolio(rec.college)} />
            ))
        )}
      </div>

      <p className="mt-6 text-xs text-muted leading-relaxed max-w-2xl">
        <span className="font-mono font-bold text-ink">β = college risk ÷ fit.</span> Lower β anchors your portfolio;
        higher β is a reach whose upside has to justify the risk. Recommendations re-rank live as you move the dials.
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
  onRemove,
}: {
  id: string;
  short: string;
  name: string;
  loc: string;
  enr: number;
  next: string;
  result: BetaResult;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 border-b border-hair last:border-0 hover:bg-slatebg transition-colors">
      <Link href={`/college/${id}`} className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold">{name}</span>
          <span className="text-xs text-muted truncate">{loc}</span>
        </div>
        <div className="text-xs text-muted mt-0.5">
          Next: <span className="text-ink">{next}</span>
        </div>
      </Link>
      <Link href={`/college/${id}`} className="w-40">
        <EnrichmentBar value={enr} height={22} tone={enr >= 100 ? "fit" : "amber"} />
      </Link>
      <Link href={`/college/${id}`} className="pr-1">
        <BetaBadge result={result} size={56} />
      </Link>
      <button
        onClick={onRemove}
        aria-label={`Remove ${short} from portfolio`}
        title="Remove from portfolio"
        className="grid place-items-center h-7 w-7 rounded-lg border border-hair text-muted hover:border-risk hover:text-risk transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
