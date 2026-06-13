// ---------------------------------------------------------------------------
// Butterbase seam.
//
// Today the app persists to localStorage so it runs with zero backend during
// the demo. To go live: point these functions at your Butterbase tables/MCP.
// The UI imports ONLY from here, so swapping is a one-file change.
//
//   1) In Claude Code, with the Butterbase MCP connected, say:
//      "Create tables for students, colleges, school_activity, and
//       portfolio_readiness, then replace the localStorage calls in
//       src/lib/store.ts with Butterbase queries."
//   2) Butterbase wires auth, the DB, RAG over college docs, and the model
//      gateway used by api/source-college.
// ---------------------------------------------------------------------------

import {
  SEED_COLLEGES,
  DEFAULT_PROFILE,
  type College,
  type StudentProfile,
  type SchoolActivity,
  type PortfolioReadiness,
} from "./data";
// --- [Luke] portfolio recs ---
import { DEFAULT_RISK, type RiskSettings } from "./recommend";

const KEY = "beta.state.v1";

interface AppState {
  profile: StudentProfile;
  colleges: College[];
  activity: Record<string, SchoolActivity>;
  readiness: PortfolioReadiness;
  onboarded: boolean;
  // --- [Luke] portfolio recs ---
  portfolioIds: string[]; // the confirmed "true" portfolio (subset of colleges)
  risk: RiskSettings; // risk appetite + target portfolio size
}

function blankActivity(collegeId: string): SchoolActivity {
  return {
    collegeId,
    visitedInPerson: false,
    virtualTour: false,
    talkedToStudent: false,
    foundClubs: false,
    interviewed: false,
    startedSupplement: false,
    finishedSupplement: false,
  };
}

function seedState(): AppState {
  const activity: Record<string, SchoolActivity> = {};
  SEED_COLLEGES.forEach((c) => (activity[c.id] = blankActivity(c.id)));
  // Give the demo a little life so the bars aren't all zero.
  activity["ucla"] = { ...activity["ucla"], virtualTour: true, foundClubs: true, startedSupplement: true };
  activity["skidmore"] = { ...activity["skidmore"], visitedInPerson: true };
  return {
    profile: DEFAULT_PROFILE,
    colleges: SEED_COLLEGES,
    activity,
    readiness: { commonAppDone: false, testsSubmitted: true, recsRequested: true, fafsaDone: false },
    onboarded: false,
    // --- [Luke] portfolio recs ---
    portfolioIds: SEED_COLLEGES.map((c) => c.id), // seeds start confirmed
    risk: DEFAULT_RISK,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // --- [Luke] portfolio recs ---
    // Backfill fields added after a user's state was first persisted, so older
    // localStorage doesn't render a blank/broken dashboard.
    const seed = seedState();
    return {
      ...seed,
      ...parsed,
      portfolioIds: parsed.portfolioIds ?? (parsed.colleges ?? seed.colleges).map((c) => c.id),
      risk: { ...seed.risk, ...(parsed.risk ?? {}) },
    } as AppState;
  } catch {
    return seedState();
  }
}

export function saveState(s: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export { blankActivity };
export type { AppState };
