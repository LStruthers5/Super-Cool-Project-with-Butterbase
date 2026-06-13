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

export interface StudentProfile {
  name: string;
  gpa: number; // unweighted 0-4
  sat: number | null; // 400-1600, null = test optional / not submitting
  rigor: number; // 0-1, how demanding the course load (AP/IB count proxy)
  // Survey "would you rather" preferences, each 0-1
  prefLargeSchool: number; // 1 = wants big, 0 = wants small
  prefUrban: number; // 1 = city, 0 = rural
  prefBreadth: number; // 1 = explore many fields, 0 = one focused major
  prefVibeIntense: number; // 1 = intense/preprofessional, 0 = collaborative/laid-back
  interests: string[];
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
  // Agent-sourced, double-verified fields (Claude run + Exa cross-check)
  values?: string;
  whyEssayAngle?: string;
  tourUrl?: string;
  verified?: boolean;
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
  },
];

export const DEFAULT_PROFILE: StudentProfile = {
  name: "You",
  gpa: 3.82,
  sat: 1410,
  rigor: 0.75,
  prefLargeSchool: 0.55,
  prefUrban: 0.7,
  prefBreadth: 0.85,
  prefVibeIntense: 0.5,
  interests: ["Film", "Creative Writing", "Entrepreneurship"],
};
