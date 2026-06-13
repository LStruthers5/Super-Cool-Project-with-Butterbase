// ---------------------------------------------------------------------------
// Types + seed data.
//
// In production these rows live in Butterbase (Postgres). This file is the
// single seam: `lib/store.ts` reads from here today, and swaps to Butterbase
// queries later without any UI changes. Acceptance rates / medians below are
// approximate public figures used for the demo; the "Run sourcing agent"
// button (api/source-college) is how a real, double-verified row gets created.
// ---------------------------------------------------------------------------

export type Setting = "urban" | "suburban" | "rural";

// Rich "school culture" profile — hand-authored for seed schools, or produced
// by the sourcing agent (api/source-college) for any school the student adds.
export interface SchoolCulture {
  whatTheyValue: string[];
  classesStudentsLove: string[];
  vibe: string;
  traditions: string[];
  opportunities: string[];
  watchOut: string;
}

export interface StudentProfile {
  name: string;

  // ── Academic ──────────────────────────────────────────────────────────────
  gpa: number;              // unweighted 0–4
  sat: number | null;       // 400–1600, null = test-optional / not submitting
  act?: number | null;      // 1–36, null = not submitting
  rigor: number;            // 0–1 course-load intensity
  apCount?: number;         // total AP/IB/dual-enrollment courses taken or planned
  strongestSubjects?: string[];

  // ── Major & Career ────────────────────────────────────────────────────────
  interests: string[];           // broad academic/extracurricular interests
  majorInterests?: string[];     // declared or leaning majors (ordered by preference)
  undecided?: boolean;           // true = actively exploring, no declared major
  careerInterests?: string[];
  majorFlexibility?: number;     // 0 = locked in, 1 = very open to switching
  interdisciplinaryInterest?: number; // 0 = single dept, 1 = loves crossing fields

  // ── Cost & Aid ────────────────────────────────────────────────────────────
  maxYearlyBudget?: number | null;  // null = not entered; USD/year
  needAid?: boolean | null;         // null = not answered
  meritImportant?: boolean | null;
  loanSensitivity?: number;         // 0 = ok with loans, 1 = avoid at all costs

  // ── Location ─────────────────────────────────────────────────────────────
  preferredRegions?: string[];      // e.g. ["Northeast", "West Coast"]
  maxDistanceFromHome?: string;     // "< 2 hours" | "2–5 hours" | "anywhere"
  climatePreference?: string;       // "warm" | "cold" | "four seasons" | "no preference"
  nearIndustry?: string[];          // ["tech", "healthcare", "arts", "finance", ...]

  // ── Campus preferences (existing 0–1 sliders kept for beta compat) ───────
  prefLargeSchool: number;   // 0 = small, 1 = large
  prefUrban: number;         // 0 = rural, 1 = urban/city
  prefBreadth: number;       // 0 = focused major, 1 = explore many fields
  prefVibeIntense: number;   // 0 = collaborative/laid-back, 1 = intense/pre-professional
  greekLifePref?: number;    // 0 = avoid, 0.5 = neutral, 1 = important
  sportsImportance?: number; // 0 = irrelevant, 1 = big sports school matters

  // ── Learning environment ─────────────────────────────────────────────────
  seminarVsLecture?: number;          // 0 = small seminars, 1 = large lectures ok
  facultyAccessImportance?: number;   // 0 = doesn't matter, 1 = open-door profs essential
  researchInterest?: number;          // 0 = not interested, 1 = core priority
  internshipImportance?: number;      // 0 = not a factor, 1 = must have strong pipeline
  studyAbroadInterest?: number;       // 0 = not interested, 1 = very important

  // ── Application strategy ─────────────────────────────────────────────────
  edEaWillingness?: boolean;
}

export interface College {
  id: string;
  name: string;
  short: string; // chip label
  location: string;
  acceptanceRate: number; // 0-1 base rate
  medianGpa: number; // 0-4
  medianSat: number; // 400-1600
  size: number; // undergrad enrollment
  setting: Setting;
  breadth: number; // 0-1, how flexible/generalist the curriculum is
  vibeIntense: number; // 0-1
  strengths: string[]; // academic strengths, used for fit + "values"
  type?: "public" | "private";
  tuition?: number;      // approximate sticker price per year (USD)
  // Agent-sourced, double-verified fields (Claude run + Exa cross-check)
  values?: string;
  whyEssayAngle?: string;
  tourUrl?: string;
  verified?: boolean;
  culture?: SchoolCulture; // agent-enriched school-culture profile
}

export interface SchoolActivity {
  collegeId: string;
  // demonstrated-interest + application actions -> per-school enrichment
  visitedInPerson: boolean;
  virtualTour: boolean;
  talkedToStudent: boolean;
  foundClubs: boolean;
  interviewed: boolean;
  startedSupplement: boolean;
  finishedSupplement: boolean;
}

export interface PortfolioReadiness {
  commonAppDone: boolean;
  testsSubmitted: boolean;
  recsRequested: boolean;
  fafsaDone: boolean;
}

export const SEED_COLLEGES: College[] = [
  {
    id: "ucla",
    name: "UCLA",
    short: "UCLA",
    location: "Los Angeles, CA",
    acceptanceRate: 0.09,
    medianGpa: 3.9,
    medianSat: 1430,
    size: 33000,
    setting: "urban",
    breadth: 0.85,
    vibeIntense: 0.6,
    strengths: ["Film", "CS", "Biology", "Public Health"],
    type: "public",
    tuition: 44000,
  },
  {
    id: "usc",
    name: "USC",
    short: "USC",
    location: "Los Angeles, CA",
    acceptanceRate: 0.12,
    medianGpa: 3.85,
    medianSat: 1440,
    size: 21000,
    setting: "urban",
    breadth: 0.8,
    vibeIntense: 0.7,
    strengths: ["Film", "Business", "Engineering", "Communications"],
    type: "private",
    tuition: 68000,
  },
  {
    id: "skidmore",
    name: "Skidmore College",
    short: "Skid",
    location: "Saratoga Springs, NY",
    acceptanceRate: 0.27,
    medianGpa: 3.6,
    medianSat: 1330,
    size: 2700,
    setting: "suburban",
    breadth: 0.95,
    vibeIntense: 0.3,
    strengths: ["Studio Art", "Liberal Arts", "Business", "Environmental Studies"],
    type: "private",
    tuition: 65000,
  },
  {
    id: "hamilton",
    name: "Hamilton College",
    short: "Ham",
    location: "Clinton, NY",
    acceptanceRate: 0.11,
    medianGpa: 3.8,
    medianSat: 1450,
    size: 2000,
    setting: "rural",
    breadth: 0.97,
    vibeIntense: 0.45,
    strengths: ["Open Curriculum", "Writing", "Economics", "Government"],
    type: "private",
    tuition: 67000,
  },
];

// DEFAULT_PROFILE is the blank starting point for new users.
// All numeric sliders sit at the neutral midpoint (0.5) so no preference
// signals fire until the student completes the survey.
// Do NOT add fake interests/majors here — use only values a user would enter.
export const DEFAULT_PROFILE: StudentProfile = {
  name: "",
  gpa: 3.5,
  sat: null,
  rigor: 0.5,
  prefLargeSchool: 0.5,
  prefUrban: 0.5,
  prefBreadth: 0.5,
  prefVibeIntense: 0.5,
  interests: [],
};
