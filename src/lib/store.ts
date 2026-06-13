// ---------------------------------------------------------------------------
// Persistence layer — localStorage as primary cache, Butterbase as the
// durable backend.
//
// Pattern:
//   loadState()       → synchronous read from localStorage (instant)
//   syncFromBB()      → async read from Butterbase (called on mount to merge)
//   saveState(s)      → synchronous write to localStorage
//   syncToBB(userId,s)→ async fire-and-forget write to Butterbase
//
// The app works with zero backend; Butterbase syncs data across devices.
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
// Bump this whenever a migration is needed to fix saved profile data.
const PROFILE_SCHEMA_VERSION = 1;

interface AppState {
  profile: StudentProfile;
  colleges: College[];
  activity: Record<string, SchoolActivity>;
  readiness: PortfolioReadiness;
  onboarded: boolean;
  profileSchemaVersion?: number;
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
    profileSchemaVersion: PROFILE_SCHEMA_VERSION,
    // --- [Luke] portfolio recs ---
    portfolioIds: SEED_COLLEGES.map((c) => c.id), // seeds start confirmed
    risk: DEFAULT_RISK,
  };
}

// Merges a stored profile with the current DEFAULT_PROFILE shape so that new
// optional fields are always present, and clears interests that were never
// user-entered (they came from the old DEFAULT_PROFILE demo values).
function migrateState(raw: AppState): AppState {
  const isPreMigration = !raw.profileSchemaVersion;
  const profile: StudentProfile = { ...DEFAULT_PROFILE, ...raw.profile };
  if (isPreMigration) {
    // Before v1, interests were seeded from DEFAULT_PROFILE ("Film",
    // "Creative Writing", "Entrepreneurship") — never entered by the user.
    profile.interests = [];
  }
  return { ...raw, profile, profileSchemaVersion: PROFILE_SCHEMA_VERSION };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const seed = seedState();
    // Backfill fields added after a user's state was first persisted, so older
    // localStorage doesn't render a blank/broken dashboard.
    return migrateState({
      ...seed,
      ...parsed,
      portfolioIds: parsed.portfolioIds ?? (parsed.colleges ?? seed.colleges).map((c) => c.id),
      risk: { ...seed.risk, ...(parsed.risk ?? {}) },
    } as AppState);
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
  window.localStorage.removeItem(USER_ID_KEY);
}

// ── User identity ────────────────────────────────────────────────────────────
// No auth required for the demo: a UUID is generated on first visit and
// persisted in localStorage. All Butterbase rows are scoped to this ID.

const USER_ID_KEY = "beta.user_id.v1";

export function getUserId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

// ── Butterbase async sync ────────────────────────────────────────────────────

export async function syncFromBB(userId: string): Promise<Partial<AppState> | null> {
  try {
    const [profRes, actRes] = await Promise.all([
      fetch(`/api/db/profile?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/db/activity?userId=${encodeURIComponent(userId)}`),
    ]);
    const profJson = await profRes.json() as { data: null | {
      profile: AppState["profile"];
      portfolioIds: string[];
      risk: AppState["risk"];
      readiness: AppState["readiness"];
      onboarded: boolean;
    }};
    const actJson = await actRes.json() as { data: { collegeId: string; [k: string]: unknown }[] };

    if (!profJson.data) return null;

    const activity: AppState["activity"] = {};
    for (const a of (actJson.data ?? [])) {
      activity[a.collegeId] = a as unknown as AppState["activity"][string];
    }

    return {
      profile:      profJson.data.profile,
      portfolioIds: profJson.data.portfolioIds,
      risk:         profJson.data.risk,
      readiness:    profJson.data.readiness,
      onboarded:    profJson.data.onboarded,
      ...(Object.keys(activity).length > 0 ? { activity } : {}),
    };
  } catch {
    return null;
  }
}

export async function syncToBB(userId: string, s: AppState): Promise<void> {
  try {
    await Promise.all([
      fetch("/api/db/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          profile:      s.profile,
          portfolioIds: s.portfolioIds,
          risk:         s.risk,
          readiness:    s.readiness,
          onboarded:    s.onboarded,
        }),
      }),
      // Sync activity entries that changed (fire all in parallel)
      ...Object.values(s.activity).map((activity) =>
        fetch("/api/db/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, activity }),
        })
      ),
    ]);
  } catch {
    // Fire-and-forget — never block the UI
  }
}

export { blankActivity };
export type { AppState };
