// ---------------------------------------------------------------------------
// Recommendation engine. [Luke / dashboard lane]
//
// Ranks the catalog (minus what's already confirmed) into a list the student
// confirms into their "true" portfolio. Two levers:
//   - tolerance (0..1)  how much acceptance risk they'll take for upside
//   - targetCount       how many schools they're aiming to hold
//
// It also surfaces "discovery" picks: schools that fit well and are just as
// impressive as what they've already chosen, but sit off their radar
// (different setting / size than their current list).
//
// Reads computeBeta() from beta.ts read-only — the β math stays Ethan's.
// ---------------------------------------------------------------------------

import { computeBeta, type BetaResult } from "./beta";
import type { College, StudentProfile } from "./data";

export interface RiskSettings {
  tolerance: number; // 0 = conservative, 1 = ambitious
  targetCount: number; // how many schools the student wants to hold
}

export const DEFAULT_RISK: RiskSettings = { tolerance: 0.5, targetCount: 8 };
export const MIN_SCHOOLS = 6;
export const MAX_SCHOOLS = 14;
// Keep "off your radar" a genuine highlight, not a label on everything.
const MAX_DISCOVERY = 2;

export interface Recommendation {
  college: College;
  result: BetaResult;
  score: number; // 0..1-ish, for ranking only
  why: string; // plain-language reason (clarity > a bare number)
  discovery: boolean; // "you probably aren't thinking about this one"
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

const sizeBracket = (size: number): "small" | "mid" | "large" =>
  size < 5000 ? "small" : size <= 20000 ? "mid" : "large";

/**
 * Risk-appetite priority (0..1) — how much THIS school deserves attention given
 * the student's current risk dial. The single lever that makes the whole app
 * react to risk appetite:
 *   - conservative dial  → low-β anchors score highest
 *   - ambitious dial     → high-β reaches score highest, but only when fit is real
 * Used both to rank recommendations and to prioritize the confirmed portfolio.
 */
export function riskPriority(beta: number, fit: number, tolerance: number): number {
  const nBeta = clamp(beta / 2.5, 0, 1); // most β live in 0..2.5; high = riskier
  const conservativePref = 1 - nBeta;
  const ambitiousPref = nBeta * fit;
  return (1 - tolerance) * conservativePref + tolerance * ambitiousPref;
}

/** Bucketed label for the priority score, for compact UI badges. */
export function priorityLabel(p: number): "High" | "Medium" | "Low" {
  return p >= 0.6 ? "High" : p >= 0.35 ? "Medium" : "Low";
}

/**
 * Rank every candidate (universe minus confirmed) for this student + risk
 * appetite. Returns highest-scoring first.
 */
export function recommend(
  universe: College[],
  profile: StudentProfile,
  confirmedIds: string[],
  risk: RiskSettings
): Recommendation[] {
  const confirmedSet = new Set(confirmedIds);
  const confirmed = universe.filter((c) => confirmedSet.has(c.id));

  // Portfolio shape, used to flag "impressive but off your radar" picks.
  const avgSelectivity = confirmed.length
    ? confirmed.reduce((a, c) => a + (1 - c.acceptanceRate), 0) / confirmed.length
    : 0.5;
  const settingsHeld = new Set(confirmed.map((c) => c.setting));
  const bracketsHeld = new Set(confirmed.map((c) => sizeBracket(c.size)));

  type Scored = Recommendation & { eligible: boolean };
  const scored = universe
    .filter((c) => !confirmedSet.has(c.id))
    .map<Scored>((college) => {
      const result = computeBeta(college, profile);
      const { beta, fit } = result;

      // Conservative students value low β; ambitious students value high-β
      // reaches *only when the fit is real* (keeps "Reconsider" junk down).
      const riskScore = riskPriority(beta, fit, risk.tolerance);

      // Discovery candidate: a great fit, comparably selective to their list,
      // but bringing a setting AND size they don't already hold → genuinely
      // broadens the portfolio. We only *flag* the best couple (below).
      const selectivity = 1 - college.acceptanceRate;
      const impressive = fit >= 0.7 && selectivity >= avgSelectivity - 0.05;
      // "Off radar" = a size/type they're under-exposed to, or a setting they
      // don't hold at all. Either makes it something they likely overlooked.
      const novel = !bracketsHeld.has(sizeBracket(college.size)) || !settingsHeld.has(college.setting);
      const eligible = impressive && novel && confirmed.length > 0;

      const score = 0.58 * fit + 0.32 * riskScore + (eligible ? 0.06 : 0);
      return { college, result, score, eligible, discovery: false, why: "" };
    })
    .sort((a, b) => b.score - a.score);

  // Promote only the top few eligible candidates to true "discovery" picks.
  let promoted = 0;
  for (const r of scored) {
    r.discovery = r.eligible && promoted < MAX_DISCOVERY;
    if (r.discovery) promoted++;
    r.why = reason(r.result.bucket, r.result.fit, r.discovery);
  }

  return scored.map(({ eligible, ...rec }) => rec);
}

function reason(bucket: BetaResult["bucket"], fit: number, discovery: boolean): string {
  if (discovery) return "Just as impressive as your list — and a strong fit you may not be considering.";
  if (bucket === "Safety") return "A reliable anchor that genuinely fits you.";
  if (bucket === "Target") return "A balanced bet — realistic odds and a strong match.";
  if (bucket === "Reach") return "Ambitious, but the fit makes the swing worth it.";
  return fit >= 0.5 ? "A long shot — solid fit, but tough odds." : "High risk and a soft fit — probably skip.";
}

/**
 * Auto-suggest a balanced starter list of ~targetCount schools spread across
 * Safety / Target / Reach. Nothing is added silently — the UI still asks the
 * student to confirm each one.
 */
export function balancedStarter(recs: Recommendation[], targetCount: number): Recommendation[] {
  const n = clamp(Math.round(targetCount), MIN_SCHOOLS, MAX_SCHOOLS);
  const want = {
    Safety: Math.max(1, Math.round(n * 0.3)),
    Target: Math.max(1, Math.round(n * 0.4)),
    Reach: Math.max(1, Math.round(n * 0.3)),
  };

  const picked: Recommendation[] = [];
  const taken = new Set<string>();
  (["Safety", "Target", "Reach"] as const).forEach((bucket) => {
    recs
      .filter((r) => r.result.bucket === bucket)
      .slice(0, want[bucket])
      .forEach((r) => {
        picked.push(r);
        taken.add(r.college.id);
      });
  });

  // Top up to n with the next best regardless of bucket.
  for (const r of recs) {
    if (picked.length >= n) break;
    if (!taken.has(r.college.id)) {
      picked.push(r);
      taken.add(r.college.id);
    }
  }

  return picked.slice(0, n);
}
