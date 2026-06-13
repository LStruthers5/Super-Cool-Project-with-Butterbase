"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  computeBeta,
  schoolEnrichment,
  nextSchoolAction,
  type BetaResult,
} from "@/lib/beta";
import { getUniverse } from "@/lib/catalog";
import { recommend, balancedStarter, riskPriority, priorityLabel } from "@/lib/recommend";
import { blankActivity } from "@/lib/store";
import { BetaBadge } from "@/components/BetaBadge";
import { RiskControls } from "@/components/RiskControls";
import { RecommendationCard } from "@/components/RecommendationCard";
import { SchoolSearch } from "@/components/SchoolSearch";

type SortKey = "priority" | "beta" | "admit" | "fit";

const MAX_RECS = 8;

const BUCKET_META: Record<
  BetaResult["bucket"],
  { color: string; range: string; desc: string }
> = {
  Safety:    { color: "#0FA47F", range: "β < 0.6",    desc: "Likely admit, strong fit — anchors your portfolio." },
  Target:    { color: "#E6A23C", range: "β 0.6–1.4",  desc: "Balanced risk and reward. Demonstrated interest moves the needle most." },
  Reach:     { color: "#E0533D", range: "β > 1.4",    desc: "Ambitious, but the fit justifies the swing." },
  Reconsider:{ color: "#9AA0B4", range: "high β, low fit", desc: "High risk and soft fit — spend this application somewhere better." },
};

export default function Dashboard() {
  const { state, toggleReadiness, confirmToPortfolio, removeFromPortfolio, setRisk } = useApp();
  const [sort, setSort] = useState<SortKey>("priority");

  const universe = useMemo(() => (state ? getUniverse(state.colleges) : []), [state]);

  // Each confirmed school carries a live priority derived from the risk dial —
  // recomputes the instant the student drags risk appetite.
  const rows = useMemo(() => {
    if (!state) return [];
    const confirmed = new Set(state.portfolioIds);
    return universe
      .filter((c) => confirmed.has(c.id))
      .map((c) => {
        const result = computeBeta(c, state.profile);
        const enr = schoolEnrichment(state.activity[c.id] ?? blankActivity(c.id));
        const priority = riskPriority(result.beta, result.fit, state.risk.tolerance);
        return {
          college: c,
          result,
          enr,
          priority,
          next: nextSchoolAction(state.activity[c.id] ?? blankActivity(c.id)),
        };
      });
  }, [state, universe]);

  const recs = useMemo(() => {
    if (!state) return [];
    return recommend(universe, state.profile, state.portfolioIds, state.risk);
  }, [state, universe]);

  const candidates = useMemo(() => {
    if (!state) return [];
    const confirmed = new Set(state.portfolioIds);
    return universe.filter((c) => !confirmed.has(c.id));
  }, [state, universe]);

  // Portfolio-level risk metrics — the core thesis
  const riskMetrics = useMemo(() => {
    if (!rows.length) return null;
    const buckets: Record<BetaResult["bucket"], number> = { Safety: 0, Target: 0, Reach: 0, Reconsider: 0 };
    let sumBeta = 0, sumAdmit = 0, sumFit = 0;
    rows.forEach((r) => {
      buckets[r.result.bucket]++;
      sumBeta  += r.result.beta;
      sumAdmit += r.result.admit;
      sumFit   += r.result.fit;
    });
    const n = rows.length;
    return { buckets, avgBeta: sumBeta / n, avgAdmit: sumAdmit / n, avgFit: sumFit / n };
  }, [rows]);

  if (!state) return <div className="p-10 text-muted">Loading your portfolio…</div>;

  const sorted = [...rows].sort((a, b) => {
    if (sort === "priority") return b.priority    - a.priority;
    if (sort === "beta")     return a.result.beta - b.result.beta;
    if (sort === "admit")    return b.result.admit - a.result.admit;
    return b.result.fit - a.result.fit;
  });

  const buildBalanced = () =>
    balancedStarter(recs, state.risk.targetCount).forEach((r) => confirmToPortfolio(r.college));
  const gap = state.risk.targetCount - rows.length;

  return (
    <div className="px-8 py-7 max-w-5xl">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">College portfolio</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {state.profile.name && state.profile.name !== "You"
              ? `${state.profile.name}'s portfolio`
              : "Your portfolio"}
          </h1>
        </div>
        <div className="flex gap-2 text-sm">
          {(["priority", "beta", "admit", "fit"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                sort === k ? "bg-ink text-white" : "bg-card border border-hair text-muted hover:text-ink"
              }`}
            >
              {k === "priority" ? "Sort: priority" : k === "beta" ? "Sort: β" : k === "admit" ? "Sort: odds" : "Sort: fit"}
            </button>
          ))}
        </div>
      </div>

      {/* School chips — beta-colored so risk is legible at a glance */}
      <div className="flex flex-wrap gap-2 mb-6">
        {rows.length === 0 && <span className="text-sm text-muted">No schools yet — add some below.</span>}
        {rows.map((r) => (
          <Link
            key={r.college.id}
            href={`/college/${r.college.id}`}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-display font-semibold hover:opacity-80 transition-opacity"
            style={{ borderColor: BUCKET_META[r.result.bucket].color }}
          >
            <span
              className="font-mono text-[11px] font-bold"
              style={{ color: BUCKET_META[r.result.bucket].color }}
            >
              β{r.result.beta.toFixed(1)}
            </span>
            {r.college.short}
          </Link>
        ))}
      </div>

      {/* ── Portfolio Beta Profile ─────────────────────────────────────────── */}
      {riskMetrics ? (
        <div className="rounded-2xl border border-hair bg-ink text-white shadow-card p-6 mb-5">
          <p className="text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-1">
            Portfolio beta profile
          </p>
          <p className="text-sm text-white/60 mb-5 max-w-xl">
            β = risk ÷ fit. A well-structured portfolio holds low-β anchors, mid-β targets, and
            high-β reaches only where the fit is real.
          </p>

          {/* Key stats */}
          <div className="flex gap-8 mb-5">
            <div>
              <div className="font-mono text-3xl font-bold tabular leading-none">
                {riskMetrics.avgBeta.toFixed(2)}
              </div>
              <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">avg β</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold tabular leading-none text-amber">
                {Math.round(riskMetrics.avgAdmit * 100)}%
              </div>
              <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">avg admit odds</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold tabular leading-none text-fit">
                {Math.round(riskMetrics.avgFit * 100)}%
              </div>
              <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">avg fit</div>
            </div>
          </div>

          {/* Allocation bar */}
          <div className="flex h-10 rounded-xl overflow-hidden gap-0.5 mb-4">
            {(["Safety", "Target", "Reach", "Reconsider"] as const).map((b) => {
              const count = riskMetrics.buckets[b];
              if (!count) return null;
              const pct = (count / rows.length) * 100;
              return (
                <div
                  key={b}
                  style={{ width: `${pct}%`, backgroundColor: BUCKET_META[b].color }}
                  className="flex items-center justify-center text-white text-sm font-bold font-mono"
                  title={`${b}: ${count} school${count !== 1 ? "s" : ""}`}
                >
                  {count}
                </div>
              );
            })}
          </div>

          {/* Bucket legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {(["Safety", "Target", "Reach", "Reconsider"] as const).map((b) => (
              <div key={b} className="flex items-start gap-2">
                <div
                  className="mt-0.5 w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: BUCKET_META[b].color }}
                />
                <div className="text-[11px] text-white/60 leading-snug">
                  <span className="font-semibold text-white">{b}</span>
                  <span className="font-mono ml-1 text-white/40">{BUCKET_META[b].range}</span>
                  <span className="ml-1 font-mono font-bold" style={{ color: BUCKET_META[b].color }}>
                    ×{riskMetrics.buckets[b]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-hair bg-card shadow-card p-6 mb-5 text-center text-sm text-muted">
          Add schools below to see your portfolio beta profile.
        </div>
      )}

      {/* ── Portfolio strategy (risk dials) ────────────────────────────────── */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold">Portfolio strategy</span>
          <span className="text-xs text-muted">risk appetite live-rates every school&apos;s priority</span>
        </div>
        <RiskControls risk={state.risk} onChange={setRisk} />
      </div>

      {/* ── School rows ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-hair bg-card shadow-card overflow-hidden mb-6">
        <div className="grid grid-cols-[1fr_88px_72px_72px_72px_32px] gap-4 px-5 py-3 border-b border-hair text-[11px] uppercase tracking-wider text-muted font-semibold">
          <span>School</span>
          <span className="text-right">Priority</span>
          <span className="text-right">Odds</span>
          <span className="text-right">Fit</span>
          <span className="text-right pr-2">β</span>
          <span />
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
              next={r.next}
              result={r.result}
              priority={r.priority}
              onRemove={() => removeFromPortfolio(r.college.id)}
            />
          ))
        )}
      </div>

      {/* ── Application readiness ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-10">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold">Application readiness</span>
          <span className="text-xs text-muted">global de-riskers that lift every school</span>
        </div>
        <div className="flex flex-wrap gap-3">
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

      {/* ── Add to portfolio ───────────────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-1">
        <h2 className="font-display text-2xl font-bold tracking-tight">Add to your portfolio</h2>
        <button
          onClick={buildBalanced}
          className="rounded-xl border border-ink bg-card px-4 py-2 text-sm font-display font-semibold text-ink hover:bg-ink hover:text-white transition-colors"
        >
          Build balanced ({state.risk.targetCount})
        </button>
      </div>
      <p className="text-sm text-muted mb-4 max-w-2xl">
        Ranked by your risk appetite.{" "}
        {gap > 0
          ? `You're ${gap} short of your ${state.risk.targetCount}-school target.`
          : "You've hit your target — anything below is upside."}
      </p>

      <div className="mb-4">
        <SchoolSearch candidates={candidates} onAdd={confirmToPortfolio} />
      </div>

      <div className="flex flex-col gap-3">
        {recs.length === 0 ? (
          <p className="text-sm text-muted">You've added every school in the catalog.</p>
        ) : (
          recs
            .slice(0, MAX_RECS)
            .map((rec) => (
              <RecommendationCard key={rec.college.id} rec={rec} onAdd={() => confirmToPortfolio(rec.college)} />
            ))
        )}
      </div>

      <p className="mt-6 text-xs text-muted leading-relaxed max-w-2xl">
        <span className="font-mono font-bold text-ink">β = risk ÷ fit.</span> Risk is your personal rejection
        probability at this school. Fit is how well it matches your preferences. Low β anchors the portfolio;
        high β is only worth it when the fit is real. Recommendations re-rank live as you move the dials.
      </p>
    </div>
  );
}

function Row({
  id,
  short,
  name,
  loc,
  next,
  result,
  priority,
  onRemove,
}: {
  id: string;
  short: string;
  name: string;
  loc: string;
  next: string;
  result: BetaResult;
  priority: number;
  onRemove: () => void;
}) {
  const pLabel = priorityLabel(priority);
  const pColor = pLabel === "High" ? "#0FA47F" : pLabel === "Medium" ? "#E6A23C" : "#9AA0B4";
  return (
    <div className="grid grid-cols-[1fr_88px_72px_72px_72px_32px] items-center gap-4 px-5 py-4 border-b border-hair last:border-0 hover:bg-slatebg transition-colors">
      <Link href={`/college/${id}`} className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold">{name}</span>
          <span className="text-xs text-muted truncate">{loc}</span>
        </div>
        <div className="text-xs text-muted mt-0.5">
          Next: <span className="text-ink">{next}</span>
        </div>
      </Link>
      <div className="flex justify-end">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ color: pColor, backgroundColor: `${pColor}1A` }}
          title="Priority is driven by your risk appetite — drag the dial to re-rank"
        >
          {pLabel}
        </span>
      </div>
      <Link href={`/college/${id}`} className="text-right">
        <div className="font-mono font-bold tabular" style={{ color: "#E6A23C" }}>
          {Math.round(result.admit * 100)}%
        </div>
        <div className="text-[10px] text-muted">your odds</div>
      </Link>
      <Link href={`/college/${id}`} className="text-right">
        <div className="font-mono font-bold tabular text-fit">
          {Math.round(result.fit * 100)}%
        </div>
        <div className="text-[10px] text-muted">fit</div>
      </Link>
      <Link href={`/college/${id}`} className="flex justify-end pr-1">
        <BetaBadge result={result} size={64} />
      </Link>
      <button
        onClick={onRemove}
        aria-label={`Remove ${short} from portfolio`}
        className="grid place-items-center h-7 w-7 rounded-lg border border-hair text-muted hover:border-risk hover:text-risk transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
