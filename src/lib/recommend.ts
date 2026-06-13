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

  const recs = universe
    .filter((c) => !confirmedSet.has(c.id))
    .map<Recommendation>((college) => {
      const result = computeBeta(college, profile);
      const { beta, fit, bucket } = result;

      // Normalize β onto 0..1 (most live in 0..2.5); high = riskier.
      const nBeta = clamp(beta / 2.5, 0, 1);

      // Conservative students value low β; ambitious students value high-β
      // reaches *only when the fit is real* (keeps "Reconsider" junk down).
      const conservativePref = 1 - nBeta;
      const ambitiousPref = nBeta * fit;
      const riskScore =
        (1 - risk.tolerance) * conservativePref + risk.tolerance * ambitiousPref;

      // Discovery: comparably selective to their list, fits well, but a
      // setting/size they don't already hold → broadens the portfolio.
      const selectivity = 1 - college.acceptanceRate;
      const impressive = fit >= 0.6 && selectivity >= avgSelectivity - 0.08;
      const novel = !settingsHeld.has(college.setting) || !bracketsHeld.has(sizeBracket(college.size));
      const discovery = impressive && novel && confirmed.length > 0;

      // Fit anchors the score; risk appetite tilts it; discovery nudges.
      const score = 0.58 * fit + 0.32 * riskScore + (discovery ? 0.1 : 0);

      return { college, result, score, why: reason(bucket, fit, discovery), discovery };
    })
    .sort((a, b) => b.score - a.score);

  return recs;
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
