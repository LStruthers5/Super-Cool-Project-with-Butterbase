// ---------------------------------------------------------------------------
// Beta (β) — the core IP.
//
//        College Risk (of YOUR acceptance)
//   β  = ----------------------------------
//        Potential Returns (fit: how good a college is FOR YOU)
//
// Low β   -> safe relative to reward (anchor your portfolio)
// Mid β   -> a target worth the swing
// High β  -> reach; the upside has to justify the risk
// Very hi -> reconsider; risky AND not even a great fit
//
// Two SEPARATE enrichment formulas, per the team's spec:
//   - school enrichment   = how much you've done to de-risk THIS school
//   - portfolio enrichment = how much you've done to de-risk the whole set
// ---------------------------------------------------------------------------

import type {
  College,
  StudentProfile,
  SchoolActivity,
  PortfolioReadiness,
} from "./data";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/**
 * Personalized admit probability — NOT just the base acceptance rate.
 * We nudge the base rate up or down by how the student's profile compares to
 * the school's typical admit, through a logistic-style multiplier.
 */
export function admitProbability(c: College, p: StudentProfile): number {
  const gpaDelta = (p.gpa - c.medianGpa) / 0.4; // ~per 0.4 GPA points
  const satDelta = p.sat ? (p.sat - c.medianSat) / 120 : 0; // ~per 120 SAT pts
  const rigorDelta = (p.rigor - 0.7) / 0.3;

  // Weighted strength signal. Test-optional applicants lean more on GPA/rigor.
  const wSat = p.sat ? 0.4 : 0;
  const wGpa = p.sat ? 0.4 : 0.6;
  const wRigor = p.sat ? 0.2 : 0.4;
  const strength = wGpa * gpaDelta + wSat * satDelta + wRigor * rigorDelta;

  const k = 0.9; // sensitivity
  const prob = c.acceptanceRate * Math.exp(k * strength);
  return clamp(prob, 0.02, 0.96);
}

/** Fit (potential returns) 0-1: a generalist match, not a single-major bet. */
export function fitScore(c: College, p: StudentProfile): number {
  // Size: map enrollment to a 0-1 "bigness" and compare to preference.
  const bigness = clamp((c.size - 1500) / (35000 - 1500), 0, 1);
  const sizeMatch = 1 - Math.abs(bigness - p.prefLargeSchool);

  // Setting: urban=1, suburban=0.5, rural=0.
  const settingVal = c.setting === "urban" ? 1 : c.setting === "suburban" ? 0.5 : 0;
  const settingMatch = 1 - Math.abs(settingVal - p.prefUrban);

  // Curricular breadth vs the student's desire to explore (generalist thesis).
  const breadthMatch = 1 - Math.abs(c.breadth - p.prefBreadth);

  // Culture / intensity.
  const vibeMatch = 1 - Math.abs(c.vibeIntense - p.prefVibeIntense);

  const fit =
    0.28 * sizeMatch +
    0.22 * settingMatch +
    0.3 * breadthMatch +
    0.2 * vibeMatch;

  return clamp(fit, 0.05, 1);
}

export interface BetaResult {
  beta: number;
  admit: number; // 0-1
  fit: number; // 0-1
  bucket: "Safety" | "Target" | "Reach" | "Reconsider";
  blurb: string;
}

export function computeBeta(c: College, p: StudentProfile): BetaResult {
  const admit = admitProbability(c, p);
  const fit = fitScore(c, p);
  const risk = 1 - admit; // 0-1
  const beta = risk / fit; // 0 .. ~19

  let bucket: BetaResult["bucket"];
  if (beta < 0.6) bucket = "Safety";
  else if (beta < 1.4) bucket = "Target";
  else if (fit >= 0.55) bucket = "Reach";
  else bucket = "Reconsider";

  const blurb =
    bucket === "Safety"
      ? "Strong fit and a likely admit — anchors your portfolio."
      : bucket === "Target"
      ? "Balanced risk and reward. Your demonstrated interest moves the needle most here."
      : bucket === "Reach"
      ? "A reach, but the fit justifies the swing. De-risk with visits and a sharp supplement."
      : "High risk and a soft fit. Worth a second look before you spend an application on it.";

  return { beta, admit, fit, bucket, blurb };
}

// ---- Enrichment: per-school -------------------------------------------------
// Weighted demonstrated-interest + application progress for ONE school.
const SCHOOL_WEIGHTS: Record<keyof Omit<SchoolActivity, "collegeId">, number> = {
  visitedInPerson: 22,
  virtualTour: 10,
  talkedToStudent: 15,
  foundClubs: 10,
  interviewed: 18,
  startedSupplement: 10,
  finishedSupplement: 15,
};

export function schoolEnrichment(a: SchoolActivity): number {
  let score = 0;
  (Object.keys(SCHOOL_WEIGHTS) as (keyof typeof SCHOOL_WEIGHTS)[]).forEach((k) => {
    if (a[k]) score += SCHOOL_WEIGHTS[k];
  });
  return clamp(Math.round(score), 0, 100);
}

/** The single best next action to raise THIS school's enrichment fastest. */
export function nextSchoolAction(a: SchoolActivity): string {
  const order: [keyof typeof SCHOOL_WEIGHTS, string][] = [
    ["visitedInPerson", "Book a campus tour"],
    ["interviewed", "Request an admissions interview"],
    ["talkedToStudent", "Talk to a current student"],
    ["finishedSupplement", "Finish your supplemental essay"],
    ["foundClubs", "Find 2-3 clubs you'd join"],
    ["startedSupplement", "Start your supplemental essay"],
    ["virtualTour", "Take the virtual tour"],
  ];
  // pick highest-weight uncompleted item
  const ranked = order
    .filter(([k]) => !a[k])
    .sort((x, y) => SCHOOL_WEIGHTS[y[0]] - SCHOOL_WEIGHTS[x[0]]);
  return ranked.length ? ranked[0][1] : "You've done everything you can here ✓";
}

// ---- Enrichment: portfolio --------------------------------------------------
// DIFFERENT formula: how de-risked is the whole portfolio you chose?
// Blends (a) average school enrichment, (b) application readiness, and
// (c) a balance bonus for holding a healthy spread of buckets.
export function portfolioEnrichment(
  perSchool: number[],
  readiness: PortfolioReadiness,
  buckets: BetaResult["bucket"][]
): number {
  const avgSchool = perSchool.length
    ? perSchool.reduce((a, b) => a + b, 0) / perSchool.length
    : 0;

  const readyItems = [
    readiness.commonAppDone,
    readiness.testsSubmitted,
    readiness.recsRequested,
    readiness.fafsaDone,
  ];
  const readyPct = (readyItems.filter(Boolean).length / readyItems.length) * 100;

  // Balance bonus: reward a portfolio that isn't all reaches or all safeties.
  const hasSafety = buckets.some((b) => b === "Safety");
  const hasTarget = buckets.some((b) => b === "Target");
  const hasReach = buckets.some((b) => b === "Reach" || b === "Reconsider");
  const balance = ((hasSafety ? 1 : 0) + (hasTarget ? 1 : 0) + (hasReach ? 1 : 0)) / 3;

  const score = 0.55 * avgSchool + 0.3 * readyPct + 0.15 * (balance * 100);
  return clamp(Math.round(score), 0, 100);
}
