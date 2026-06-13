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
import { AlphaInbox } from "@/components/alpha/AlphaInbox";
import {
  SEED_ALPHA_LEADS,
  totalAlphaImpact,
  type AlphaLead,
  type AlphaLeadStatus,
} from "@/components/alpha/alpha-data";

type SortKey = "beta" | "enrichment" | "fit";

const MAX_RECS = 8;

// Application-strength levels — the gamified spine of the dashboard.
const LEVELS = [
  { min: 0, name: "Explorer" },
  { min: 20, name: "Researcher" },
  { min: 40, name: "Strategist" },
  { min: 60, name: "Contender" },
  { min: 80, name: "Front-runner" },
];

function levelFor(strength: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (strength >= LEVELS[i].min) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const span = (next ? next.min : 100) - cur.min;
  const into = strength - cur.min;
  const pct = Math.round((into / span) * 100);
  return { level: idx + 1, name: cur.name, pct: Math.min(100, pct), next: next?.name };
}

export default function Dashboard() {
  const { state, toggleReadiness, confirmToPortfolio, removeFromPortfolio, setRisk } = useApp();
  const [sort, setSort] = useState<SortKey>("beta");

  // Alpha Leads live in local UI state (frontend-only until Codex's backend
  // feeds them). Progress + next-actions derive from these.
  const [leads, setLeads] = useState<AlphaLead[]>(SEED_ALPHA_LEADS);
  const setLeadStatus = (id: string, status: AlphaLeadStatus) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
  const convertedPoints = leads.filter((l) => l.status === "converted").reduce((s, l) => s + l.impact, 0);
  const acceptedLeads = leads.filter((l) => l.status === "accepted");

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

  // Application Strength = the gamified composite: how ready your set is,
  // how much Alpha upside you've captured, and how close to your target size.
  const alphaPct = (convertedPoints / Math.max(1, totalAlphaImpact(leads))) * 100;
  const coveragePct = Math.min(1, rows.length / Math.max(1, state.risk.targetCount)) * 100;
  const strength = Math.round(0.6 * portfolio + 0.25 * alphaPct + 0.15 * coveragePct);
  const lvl = levelFor(strength);

  // Next best actions: highest-impact things to do right now.
  const nextActions = [
    ...acceptedLeads.map((l) => ({
      id: l.id,
      label: l.title,
      context: l.school ? `Alpha · ${l.school}` : "Alpha",
      impact: l.impact,
      do: () => setLeadStatus(l.id, "converted"),
      doLabel: "Mark done",
    })),
    ...sorted
      .filter((r) => r.enr < 100)
      .map((r) => ({
        id: `school-${r.college.id}`,
        label: r.next,
        context: `β · ${r.college.short}`,
        impact: Math.max(4, Math.round((100 - r.enr) / 8)),
        href: `/college/${r.college.id}`,
      })),
  ]
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 4);

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

      {/* Application Strength — gamified hero */}
      <div className="rounded-2xl border border-hair bg-ink text-white shadow-card p-5 mb-5">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Application strength</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">Lvl {lvl.level}</span>
              <span className="font-display text-lg font-semibold text-fit">{lvl.name}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl font-bold tabular leading-none">{strength}</div>
            <div className="text-[11px] text-white/50">/ 100 overall</div>
          </div>
        </div>
        {/* XP bar to next level */}
        <div className="relative w-full h-3 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-fit transition-[width] duration-700 ease-out"
            style={{ width: `${lvl.pct}%` }}
          />
        </div>
        <p className="text-[11px] text-white/60 mt-1.5">
          {lvl.next ? `${lvl.pct}% to ${lvl.next}` : "Maxed out — front-runner status."} · capture Alpha leads and
          de-risk schools to level up.
        </p>
      </div>

      {/* Readiness checklist */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-semibold">Portfolio readiness</span>
          <span className="text-xs text-muted">how de-risked your whole set is</span>
        </div>
        <EnrichmentBar value={portfolio} height={28} />
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

      {/* Next best actions */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold">Next best actions</span>
          <span className="text-xs text-muted">highest-impact moves right now</span>
        </div>
        {nextActions.length === 0 ? (
          <p className="text-sm text-muted">You&apos;re all caught up. Source more Alpha leads to keep climbing.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {nextActions.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-hair px-3 py-2.5">
                <span className="font-mono text-xs font-bold text-fit tabular shrink-0">+{a.impact}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{a.label}</p>
                  <p className="text-[11px] text-muted">{a.context}</p>
                </div>
                {"do" in a && a.do ? (
                  <button
                    onClick={a.do}
                    className="shrink-0 rounded-lg bg-fit text-white px-3 py-1 text-xs font-semibold hover:opacity-90 transition-colors"
                  >
                    {a.doLabel}
                  </button>
                ) : (
                  <Link
                    href={(a as { href: string }).href}
                    className="shrink-0 rounded-lg border border-ink text-ink px-3 py-1 text-xs font-semibold hover:bg-ink hover:text-white transition-colors"
                  >
                    Open
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alpha Inbox */}
      <div className="mb-8">
        <AlphaInbox leads={leads} onSetStatus={setLeadStatus} />
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
