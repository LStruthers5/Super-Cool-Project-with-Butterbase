"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import { computeBeta, schoolEnrichment } from "@/lib/beta";
import type { BetaResult } from "@/lib/beta";
import { BetaBadge } from "@/components/BetaBadge";
import { EnrichmentBar } from "@/components/EnrichmentBar";
import type { College, SchoolActivity, StudentProfile } from "@/lib/data";

const ACTIVITY_LABELS: [keyof Omit<SchoolActivity, "collegeId">, string][] = [
  ["visitedInPerson", "Visited in person"],
  ["virtualTour", "Took the virtual tour"],
  ["talkedToStudent", "Talked to a current student"],
  ["interviewed", "Completed an interview"],
  ["foundClubs", "Found clubs to join"],
  ["startedSupplement", "Started supplemental essay"],
  ["finishedSupplement", "Finished supplemental essay"],
];

// ---- School fit profiles -------------------------------------------------------

interface SchoolFitProfile {
  whatTheyValue: string[];
  classesStudentsLove: string[];
  vibe: string;
  traditions: string[];
  opportunities: string[];
  watchOut: string;
}

const SCHOOL_FIT_PROFILES: Record<string, SchoolFitProfile> = {
  ucla: {
    whatTheyValue: [
      "Public service and civic responsibility as core to the Bruin identity",
      "Research that drives real-world impact across disciplines",
      "Diversity of backgrounds, perspectives, and lived experience",
      "Academic excellence alongside Bruin community pride",
    ],
    classesStudentsLove: [
      "Film 50 – The Hollywood Film Industry (industry-taught, legendary)",
      "CS 31 – Introduction to Computer Science I",
      "English 10A – Literature and Culture",
      "Cluster 80B – Cities and Urban Environments",
    ],
    vibe: "Large, electric, and competitive. Sports culture runs deep — Bruin Walk buzzes between classes and game days transform campus. Lower-division courses can seat 500+, but upper-division seminars and research labs feel tighter and more personal. Greek life is active but not the only social world.",
    traditions: [
      "Spring Sing — student-run variety show held since 1945",
      "Midnight Yell before rivalry games with USC",
      "Bruin Walk resource fairs and club recruitment days",
    ],
    opportunities: [
      "TFT (Theater, Film and Television) — one of the best film programs on the West Coast",
      "Direct pipeline into LA entertainment, tech, and healthcare companies",
      "Undergraduate research with Nobel-winning faculty across departments",
      "220+ student clubs, including film, writing, and entrepreneurship organizations",
    ],
    watchOut: "Lower-division lecture halls can seat 600+ students — it's easy to feel anonymous unless you proactively seek professors and smaller communities early. The social scene is sprawling; without intentional effort, the 33,000-student campus can feel impersonal.",
  },
  usc: {
    whatTheyValue: [
      "The Trojan Family network — alumni loyalty treated as a real career asset",
      "Professional ambition and industry preparation from day one",
      "Entrepreneurship, innovation, and connections in the LA ecosystem",
      "Cinematic arts as both an academic and professional discipline",
    ],
    classesStudentsLove: [
      "CTPR 290 – Introduction to Cinema Production",
      "BUAD 304 – Business Strategy and Economics",
      "COMM 204 – Media Industries and Society",
      "JOUR 205 – Introduction to News Reporting",
    ],
    vibe: "Pre-professional, socially driven, and brand-conscious. The Trojan network is treated like a superpower students graduate into. Professors often are active practitioners in their fields. LA location blurs student life with industry life — you might sit next to a showrunner at a class guest panel.",
    traditions: [
      "USC vs. UCLA rivalry game — the oldest college football rivalry in the West",
      "Conquest — the pre-game pep rally and spirit tradition",
      "Springfest outdoor concert and fair on Alumni Park",
    ],
    opportunities: [
      "School of Cinematic Arts — consistently ranked the #1 film school in the US",
      "Trojan alumni network opens doors in entertainment, finance, and tech",
      "Startups@SC ecosystem and LA's venture scene for entrepreneurial students",
      "LA location enables semester internships, not just summer placements",
    ],
    watchOut: "USC is one of the most expensive private universities in the US. Networking culture can overshadow deep intellectual exploration for students who aren't career-focused from day one. The urban campus has historically had neighborhood safety concerns — worth researching current conditions before committing.",
  },
  skidmore: {
    whatTheyValue: [
      '"Creative Thought Matters" — the school\'s defining academic identity',
      "Interdisciplinary work that blends arts, sciences, and social inquiry",
      "Student autonomy in designing their own education",
      "Environmental consciousness and community engagement",
    ],
    classesStudentsLove: [
      "Scribner Seminar — first-year interdisciplinary topics course (every student takes it)",
      "Studio Art senior thesis seminar",
      "ENVS 101 – Introduction to Environmental Studies",
      "Creative Writing workshops (all levels, workshop-style with close feedback)",
    ],
    vibe: "Collaborative, creative, and intimate. Fewer than 3,000 students — you'll recognize faces within weeks. The arts community is central, not peripheral. Students describe the culture as 'weird in the best way': people show up to events, make things together, and genuinely support each other.",
    traditions: [
      "Falstaff's — on-campus pub, a rare and beloved student social anchor",
      "Annual Spring Fling outdoor concert on campus",
      "Senior art thesis shows open to the entire campus community",
    ],
    opportunities: [
      "Close faculty mentorship — average class size is 16 students",
      "Saratoga Springs arts scene and proximity to Tanglewood music festival",
      "Strong study-abroad program with 100+ partner institutions worldwide",
      "Unusual business program within a liberal arts college — a rare combination",
    ],
    watchOut: "Saratoga Springs is a charming small city but not a major metro — semester internship access is limited without a car. If you need constant urban energy, the location may feel slow by year two. Small campus means little anonymity; social dynamics can become tight-knit to the point of insular.",
  },
  hamilton: {
    whatTheyValue: [
      "Rigorous, clear writing — the defining skill Hamilton actively builds in every student",
      "Intellectual courage and open inquiry through a fully open curriculum",
      "Student-led governance and community accountability",
      "Dialogue across political, cultural, and disciplinary difference",
    ],
    classesStudentsLove: [
      "The Writing Program — required first year, widely praised by alumni decades later",
      "POL 110 – Power, Justice, and the Political Community",
      "ECON 101 with the department's signature Socratic discussion sections",
      "Literature and Creative Writing concentration seminars",
    ],
    vibe: "Intellectually serious but not cutthroat. Small (2,000 students), fully residential, and tight-knit. Greek life exists but doesn't dominate. Winters in Clinton, NY are real — students bond over ideas, clubs, and a community identity that persists long into alumni life.",
    traditions: [
      "Fallcoming — fall homecoming weekend with strong alumni return",
      "Senior Week outdoor celebrations before commencement",
      "Annual 'Days of Remembrance' community symposium",
    ],
    opportunities: [
      "Open curriculum — no distribution requirements, total freedom to design your academic path",
      "Writing-intensive courses build skills prized in law, policy, journalism, and finance",
      "Strong NYC alumni network, especially in finance, law, and media",
      "Unusually close faculty access — professors commonly share direct cell numbers",
    ],
    watchOut: "Clinton, NY is genuinely rural — internship access requires a car or trips to Syracuse/NYC. Social life on a 2,000-person campus can feel repetitive for students who need variety or anonymity. Very little ability to disappear into a crowd, which some love and others find stressful.",
  },
};

// ── Fit breakdown types & helpers ─────────────────────────────────────────────

type FitStatus = "strong" | "good" | "mixed" | "mismatch" | "unknown";

interface FitCategory {
  key: string;
  label: string;
  score: number;              // 0–100; meaningful only when status !== "unknown"
  status: FitStatus;
  fitReason: string | null;   // grounded in actual survey answer or school fact
  mismatchReason: string | null;
  inputsUsed: string[];
}

// True only when a 0–1 slider has moved meaningfully off the neutral midpoint.
const sig = (v: number | undefined, lo = 0.35, hi = 0.65): boolean =>
  v !== undefined && (v < lo || v > hi);

const clampN = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

function scoreToStatus(s: number): FitStatus {
  return s >= 78 ? "strong" : s >= 60 ? "good" : s >= 40 ? "mixed" : "mismatch";
}

const INDUSTRY_MAP: Record<string, string[]> = {
  "Tech / Silicon Valley":     ["ucla", "usc"],
  "Entertainment / Media":    ["ucla", "usc"],
  "Healthcare / Medical":     ["ucla", "usc"],
  "Finance / Wall Street":    ["hamilton"],
  "Government / Policy (DC)": ["hamilton"],
  "Arts / Culture":           ["skidmore"],
  "Research / Academia":      ["ucla", "hamilton"],
};

const SCHOOL_GREEK: Record<string, number>  = { ucla: 0.55, usc: 0.75, skidmore: 0.25, hamilton: 0.45 };
const SCHOOL_SPORTS: Record<string, number> = { ucla: 0.9,  usc: 0.85, skidmore: 0.2,  hamilton: 0.35 };

function buildFitBreakdown(
  college: College,
  profile: StudentProfile,
  result: BetaResult,
  onboarded: boolean
): FitCategory[] {
  const cats: FitCategory[] = [];

  // ── 1. Academics & major match ────────────────────────────────────────────
  {
    const allInterests = [...(profile.majorInterests ?? []), ...(profile.interests ?? [])];
    const hasInputs = allInterests.length > 0 || profile.undecided === true;

    if (!hasInputs) {
      cats.push({ key: "academic", label: "Academics & major match", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      const iset = new Set(allInterests.map((i) => i.toLowerCase()));
      const matched = allInterests.filter((interest) =>
        college.strengths.some(
          (s) => s.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(s.toLowerCase())
        )
      );
      const hasFilm    = iset.has("film") || iset.has("film / media studies");
      const hasWriting = iset.has("creative writing") || iset.has("english / literature") || iset.has("english / writing");
      const hasEntrepr = iset.has("entrepreneurship");
      const hasBiz     = iset.has("business / finance") || hasEntrepr;
      const hasBio     = iset.has("biology / pre-med") || iset.has("nursing / health sciences");
      const hasCS      = iset.has("computer science") || iset.has("coding / tech");
      const hasArt     = iset.has("visual art / design") || iset.has("studio art");
      const hasEnviro  = iset.has("environmental science / sustainability");

      const special: string[] = [];
      if (hasFilm   && (college.id === "ucla" || college.id === "usc")) special.push("Film");
      if (hasWriting && college.id === "hamilton")  special.push("Creative Writing / Writing Program");
      if (hasWriting && college.id === "skidmore")  special.push("Creative Writing");
      if (hasBio    && college.id === "ucla")       special.push("Biology / Pre-Med");
      if (hasCS     && college.id === "ucla")       special.push("Computer Science");
      if (hasBiz    && college.id === "usc")        special.push("Business / Entrepreneurship");
      if (hasEntrepr && college.id === "ucla")      special.push("Entrepreneurship");
      if (hasArt    && college.id === "skidmore")   special.push("Studio Art");
      if (hasEnviro && college.id === "skidmore")   special.push("Environmental Studies");

      const totalMatched = matched.length + special.length;
      let score: number;
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;

      if (profile.undecided === true && allInterests.length === 0) {
        score = 58;
        fitReason = "You're open to exploring — check if this school's advising structure actively supports undecided students.";
      } else if (totalMatched === 0) {
        score = 32;
        mismatchReason = `Your listed interests don't closely overlap with ${college.short}'s declared strengths — research whether an adjacent major could work.`;
      } else {
        score = clampN(62 + totalMatched * 11, 62, 95);
        const names = [...new Set([...matched, ...special])].slice(0, 3).join(", ");
        fitReason = `You listed ${names} — ${college.short} has recognized strength${totalMatched > 1 ? "s" : ""} in these areas.`;
        if (hasFilm && college.id === "usc") mismatchReason = "SCA is ranked #1 in the country for film — expect a competitive, pre-professional environment.";
        else if (hasFilm && college.id === "ucla") mismatchReason = "TFT is selective even within UCLA — confirm program-specific admissions requirements.";
        else if (totalMatched === 1 && allInterests.length > 3) mismatchReason = "Only one of your interests maps to this school's core strengths — some subjects may be less developed here.";
      }

      cats.push({
        key: "academic", label: "Academics & major match", score, status: scoreToStatus(score),
        fitReason, mismatchReason, inputsUsed: allInterests.length > 0 ? ["Majors", "Interests"] : ["Undecided flag"],
      });
    }
  }

  // ── 2. Curriculum flexibility ─────────────────────────────────────────────
  {
    const hasBreadthInput = (sig(profile.prefBreadth) && onboarded) || profile.undecided === true || profile.majorFlexibility !== undefined;
    if (!hasBreadthInput) {
      cats.push({ key: "curriculum", label: "Curriculum flexibility", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      let effPref = onboarded ? profile.prefBreadth : 0.5;
      if (profile.undecided === true) effPref = Math.max(effPref, 0.65);
      if ((profile.majorFlexibility ?? 0.5) > 0.65) effPref = Math.max(effPref, 0.6);
      const score = clampN(Math.round(100 - Math.abs(effPref - college.breadth) * 120), 20, 95);
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;
      if (effPref > 0.65 && college.breadth > 0.85) {
        const note = college.id === "hamilton" ? "no distribution requirements at all" : "a highly flexible curriculum";
        fitReason = `You want to explore many fields — ${college.name} has ${note}.`;
      } else if (effPref < 0.35 && college.breadth > 0.9) {
        mismatchReason = `You prefer to focus in one area, but ${college.name}'s open curriculum may feel unstructured without a clear plan.`;
      } else if (effPref > 0.65 && college.breadth < 0.7) {
        mismatchReason = `You want broad exploration, but ${college.name} is more program-focused — switching majors may be harder.`;
      } else if (score >= 70) {
        fitReason = `Your curriculum preference aligns well with ${college.name}'s academic structure.`;
      }
      cats.push({ key: "curriculum", label: "Curriculum flexibility", score, status: scoreToStatus(score), fitReason, mismatchReason, inputsUsed: ["Curriculum breadth preference"] });
    }
  }

  // ── 3. Campus size ────────────────────────────────────────────────────────
  {
    if (!sig(profile.prefLargeSchool) || !onboarded) {
      cats.push({ key: "size", label: "Campus size", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      const bigness = clampN((college.size - 1500) / 33_500, 0, 1);
      const score = clampN(Math.round(100 - Math.abs(profile.prefLargeSchool - bigness) * 130), 20, 95);
      const sizeLabel = college.size > 15000 ? "large" : college.size > 5000 ? "mid-sized" : "small";
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;
      if (profile.prefLargeSchool > 0.65 && bigness > 0.55) fitReason = `You prefer larger schools — ${college.name}'s ~${college.size.toLocaleString()} undergrads fits that.`;
      else if (profile.prefLargeSchool < 0.35 && bigness < 0.35) fitReason = `You prefer a smaller community — ${college.name}'s ~${college.size.toLocaleString()} undergrads should feel close-knit.`;
      else if (profile.prefLargeSchool > 0.65 && bigness < 0.35) mismatchReason = `You lean large, but ${college.name} is ${sizeLabel} (~${college.size.toLocaleString()} students) — may feel more intimate than expected.`;
      else if (profile.prefLargeSchool < 0.35 && bigness > 0.55) mismatchReason = `You prefer smaller schools, but ${college.name} has ~${college.size.toLocaleString()} undergrads — community requires effort to build.`;
      cats.push({ key: "size", label: "Campus size", score, status: scoreToStatus(score), fitReason, mismatchReason, inputsUsed: ["School size preference"] });
    }
  }

  // ── 4. Location & industry access ─────────────────────────────────────────
  {
    const hasUrban    = sig(profile.prefUrban) && onboarded;
    const hasRegions  = (profile.preferredRegions ?? []).length > 0;
    const hasIndustry = (profile.nearIndustry ?? []).length > 0;
    if (!hasUrban && !hasRegions && !hasIndustry) {
      cats.push({ key: "location", label: "Location & industry access", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      const settingVal = college.setting === "urban" ? 1 : college.setting === "suburban" ? 0.5 : 0;
      const inputsUsed: string[] = [];
      let score = 60;
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;
      if (hasUrban) {
        const diff = Math.abs(profile.prefUrban - settingVal);
        score += diff < 0.2 ? 20 : diff < 0.4 ? 5 : -20;
        if (profile.prefUrban > 0.65 && settingVal >= 0.8) fitReason = `You prefer an urban setting — ${college.location} is a major city environment.`;
        else if (profile.prefUrban < 0.35 && settingVal <= 0.2) fitReason = `You prefer a quieter setting — ${college.name}'s ${college.setting} campus fits.`;
        else if (profile.prefUrban > 0.65 && settingVal <= 0.2) mismatchReason = `You prefer city life, but ${college.name} is ${college.setting}.`;
        else if (profile.prefUrban < 0.35 && settingVal >= 0.8) mismatchReason = `You prefer a quieter setting, but ${college.name} is urban — the city energy is constant.`;
        inputsUsed.push("Urban/rural preference");
      }
      if (hasIndustry) {
        const hits = (profile.nearIndustry ?? []).filter((ind) => (INDUSTRY_MAP[ind] ?? []).includes(college.id));
        if (hits.length > 0) { score += 15; fitReason = fitReason ?? `${college.name}'s location gives you in-semester access to ${hits.join(" and ")}.`; }
        else if (college.setting === "rural") { score -= 15; mismatchReason = mismatchReason ?? `The industries you listed aren't reachable from ${college.name}'s rural location in-semester.`; }
        inputsUsed.push("Industry clusters");
      }
      if (hasRegions) {
        const schoolRegion =
          (college.id === "ucla" || college.id === "usc") ? "West Coast" :
          (college.id === "skidmore" || college.id === "hamilton") ? "New England" : "";
        const match = schoolRegion && ((profile.preferredRegions ?? []).includes(schoolRegion) || (profile.preferredRegions ?? []).includes("No preference"));
        if (match) { score += 12; fitReason = fitReason ?? `${college.name} is in the ${schoolRegion} — one of your preferred regions.`; }
        else if (schoolRegion && !(profile.preferredRegions ?? []).includes("No preference")) { score -= 10; mismatchReason = mismatchReason ?? `${college.name} is in the ${schoolRegion}, which wasn't among your preferred regions.`; }
        inputsUsed.push("Preferred regions");
      }
      cats.push({ key: "location", label: "Location & industry access", score: clampN(score, 20, 95), status: scoreToStatus(clampN(score, 20, 95)), fitReason, mismatchReason, inputsUsed });
    }
  }

  // ── 5. Cost & aid ─────────────────────────────────────────────────────────
  {
    const hasNeedAid = profile.needAid != null;
    const hasBudget  = profile.maxYearlyBudget != null;
    const hasMerit   = profile.meritImportant != null;
    const hasLoan    = sig(profile.loanSensitivity) && onboarded;
    if (!hasNeedAid && !hasBudget && !hasMerit && !hasLoan) {
      cats.push({ key: "cost", label: "Cost & aid", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      const tuition = college.tuition ?? 50000;
      const inputsUsed: string[] = [];
      let score = 65;
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;
      if (hasBudget) {
        const ratio = tuition / profile.maxYearlyBudget!;
        if (ratio <= 0.85) { score += 20; fitReason = `${college.name}'s sticker price (~$${(tuition / 1000).toFixed(0)}k/yr) is within your stated budget.`; }
        else if (ratio <= 1.1) { /* on the edge, neutral */ }
        else if (ratio <= 1.3) { score -= 15; mismatchReason = `${college.name}'s sticker price (~$${(tuition / 1000).toFixed(0)}k/yr) is ~${Math.round((ratio - 1) * 100)}% above your budget — aid eligibility matters.`; }
        else { score -= 30; mismatchReason = `${college.name}'s sticker price (~$${(tuition / 1000).toFixed(0)}k/yr) significantly exceeds your budget — confirm aid before applying.`; }
        inputsUsed.push("Budget");
      }
      if (hasNeedAid && profile.needAid === true) {
        if (college.type === "private" && tuition > 55000) { score -= 10; mismatchReason = mismatchReason ?? `You need financial aid — research ${college.name}'s aid generosity carefully before applying.`; }
        if (college.type === "public") { score += 10; fitReason = fitReason ?? `Public universities often have strong need-based aid formulas.`; }
        inputsUsed.push("Need-based aid");
      }
      if (hasMerit && profile.meritImportant === true) {
        if (college.type === "public") { score += 10; fitReason = fitReason ?? `${college.name} as a public university may offer merit scholarships — check Regents/Chancellor awards.`; }
        if (college.type === "private") { score -= 5; mismatchReason = mismatchReason ?? `Merit awards at private schools like ${college.name} can be competitive and unpredictable.`; }
        inputsUsed.push("Merit scholarships");
      }
      if (hasLoan && (profile.loanSensitivity ?? 0) > 0.65 && tuition > 55000 && college.type === "private") {
        score -= 15;
        mismatchReason = mismatchReason ?? `You want to avoid loans, but ${college.name}'s ~$${(tuition / 1000).toFixed(0)}k sticker without substantial aid would require significant borrowing.`;
        inputsUsed.push("Loan sensitivity");
      }
      const s = clampN(score, 20, 95);
      cats.push({ key: "cost", label: "Cost & aid", score: s, status: scoreToStatus(s), fitReason, mismatchReason, inputsUsed });
    }
  }

  // ── 6. Social atmosphere ──────────────────────────────────────────────────
  {
    const hasVibe   = sig(profile.prefVibeIntense) && onboarded;
    const hasGreek  = sig(profile.greekLifePref) && onboarded;
    const hasSports = sig(profile.sportsImportance) && onboarded;
    if (!hasVibe && !hasGreek && !hasSports) {
      cats.push({ key: "social", label: "Social atmosphere", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      const inputsUsed: string[] = [];
      let score = 60;
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;
      if (hasVibe) {
        const diff = Math.abs(profile.prefVibeIntense - college.vibeIntense);
        score += diff < 0.2 ? 20 : diff < 0.35 ? 8 : -15;
        if (profile.prefVibeIntense > 0.65 && college.vibeIntense > 0.55) fitReason = `You prefer an ambitious, pre-professional culture — ${college.name} leans that way.`;
        else if (profile.prefVibeIntense < 0.35 && college.vibeIntense < 0.45) fitReason = `You want a collaborative, low-key environment — ${college.name} is known for that.`;
        else if (profile.prefVibeIntense < 0.35 && college.vibeIntense > 0.6) mismatchReason = `You prefer a relaxed culture, but ${college.name} leans more intense and pre-professional.`;
        else if (profile.prefVibeIntense > 0.65 && college.vibeIntense < 0.4) mismatchReason = `You want an ambitious culture, but ${college.name} is known as more laid-back and exploratory.`;
        inputsUsed.push("Campus vibe preference");
      }
      if (hasGreek) {
        const schoolGreek = SCHOOL_GREEK[college.id] ?? 0.4;
        const diff = Math.abs((profile.greekLifePref ?? 0.5) - schoolGreek);
        score += diff < 0.2 ? 8 : diff > 0.4 ? -12 : 0;
        if ((profile.greekLifePref ?? 0.5) > 0.65 && schoolGreek < 0.4) mismatchReason = mismatchReason ?? `Greek life is important to you, but ${college.name} has a relatively small Greek presence.`;
        else if ((profile.greekLifePref ?? 0.5) < 0.35 && schoolGreek > 0.6) mismatchReason = mismatchReason ?? `You prefer to avoid Greek life, but it's quite active at ${college.name} — not mandatory, but socially present.`;
        inputsUsed.push("Greek life preference");
      }
      if (hasSports) {
        const schoolSports = SCHOOL_SPORTS[college.id] ?? 0.4;
        const diff = Math.abs((profile.sportsImportance ?? 0.5) - schoolSports);
        score += diff < 0.2 ? 8 : diff > 0.4 ? -10 : 0;
        if ((profile.sportsImportance ?? 0.5) > 0.65 && schoolSports > 0.7) fitReason = fitReason ?? `You love school spirit — ${college.name} has major Division I sports and a strong game-day culture.`;
        else if ((profile.sportsImportance ?? 0.5) > 0.65 && schoolSports < 0.35) mismatchReason = mismatchReason ?? `Sports culture matters to you, but ${college.name} is Division III — game days are lower-key.`;
        inputsUsed.push("Sports / school spirit");
      }
      const s = clampN(score, 20, 95);
      cats.push({ key: "social", label: "Social atmosphere", score: s, status: scoreToStatus(s), fitReason, mismatchReason, inputsUsed });
    }
  }

  // ── 7. Learning environment ───────────────────────────────────────────────
  {
    const hasSeminar  = profile.seminarVsLecture !== undefined && onboarded;
    const hasFaculty  = profile.facultyAccessImportance !== undefined && onboarded;
    const hasResearch = profile.researchInterest !== undefined && onboarded;
    const hasSA       = profile.studyAbroadInterest !== undefined && onboarded;
    if (!hasSeminar && !hasFaculty && !hasResearch && !hasSA) {
      cats.push({ key: "learning", label: "Learning environment", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      const inputsUsed: string[] = [];
      let score = 60;
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;
      const bigSchool   = college.size > 15000;
      const smallSchool = college.size < 4000;
      if (hasSeminar) {
        const semPref = profile.seminarVsLecture!; // 0 = prefers seminars, 1 = large lectures ok
        if (semPref < 0.35 && smallSchool) { score += 20; fitReason = `You prefer small seminars — ${college.name}'s size naturally supports that.`; }
        else if (semPref < 0.35 && bigSchool) { score -= 20; mismatchReason = `You prefer small seminars, but lower-division courses at ${college.name} can seat hundreds. Upper-division and honors programs help.`; }
        else if (semPref > 0.65 && bigSchool) { score += 10; fitReason = fitReason ?? `You're comfortable with large lectures — ${college.name}'s big-university format fits.`; }
        inputsUsed.push("Class-size preference");
      }
      if (hasFaculty) {
        const facPref = profile.facultyAccessImportance!;
        if (facPref > 0.65 && smallSchool) { score += 15; fitReason = fitReason ?? `Open-door professors matter to you — at ${college.name}'s small size, close faculty access is the norm.`; }
        else if (facPref > 0.65 && bigSchool) { score -= 10; mismatchReason = mismatchReason ?? `Faculty access is important to you — at ${college.name}'s scale, you'll need to seek out office hours and research roles proactively.`; }
        inputsUsed.push("Faculty access");
      }
      if (hasResearch) {
        const resPref = profile.researchInterest!;
        if (resPref > 0.65 && bigSchool && college.type === "public") { score += 12; fitReason = fitReason ?? `You want research experience — large public universities like ${college.name} have extensive undergrad research programs.`; }
        else if (resPref > 0.65 && smallSchool) { score += 10; fitReason = fitReason ?? `Small schools like ${college.name} often let undergrads co-author with faculty earlier than large universities.`; }
        inputsUsed.push("Research interest");
      }
      if (hasSA) {
        const saInt = profile.studyAbroadInterest!;
        if (saInt > 0.65 && college.id === "skidmore") { score += 10; fitReason = fitReason ?? `You're interested in studying abroad — Skidmore has 100+ partner programs worldwide.`; }
        else if (saInt > 0.65) { score += 5; }
        inputsUsed.push("Study abroad interest");
      }
      const s = clampN(score, 20, 95);
      cats.push({ key: "learning", label: "Learning environment", score: s, status: scoreToStatus(s), fitReason, mismatchReason, inputsUsed });
    }
  }

  // ── 8. Career & internship access ─────────────────────────────────────────
  {
    const hasInternship = profile.internshipImportance !== undefined && onboarded;
    const hasIndustry   = (profile.nearIndustry ?? []).length > 0;
    const hasCareer     = (profile.careerInterests ?? []).length > 0;
    if (!hasInternship && !hasIndustry && !hasCareer) {
      cats.push({ key: "career", label: "Career & internship access", score: 50, status: "unknown", fitReason: null, mismatchReason: null, inputsUsed: [] });
    } else {
      const inputsUsed: string[] = [];
      let score = 60;
      let fitReason: string | null = null;
      let mismatchReason: string | null = null;
      if (hasInternship) {
        const intPref = profile.internshipImportance!;
        if (intPref > 0.65 && college.setting === "urban") { score += 22; fitReason = `You ranked internships as a must — ${college.name}'s urban location enables semester internships, not just summer ones.`; }
        else if (intPref > 0.65 && college.setting === "rural") { score -= 25; mismatchReason = `You ranked internships as essential, but ${college.name}'s rural setting limits in-semester access — summers and alumni outreach will be key.`; }
        else if (intPref > 0.65) { score -= 5; }
        inputsUsed.push("Internship importance");
      }
      if (hasIndustry) {
        const hits = (profile.nearIndustry ?? []).filter((ind) => (INDUSTRY_MAP[ind] ?? []).includes(college.id));
        if (hits.length > 0) { score += 15; fitReason = fitReason ?? `${college.name}'s location gives you access to ${hits.join(" and ")} — a direct career advantage.`; }
        else if (college.setting === "rural") { score -= 10; mismatchReason = mismatchReason ?? `The industries you listed aren't accessible from ${college.name}'s rural location in-semester.`; }
        inputsUsed.push("Industry clusters");
      }
      if (hasCareer) {
        const careers = (profile.careerInterests ?? []).map((c) => c.toLowerCase());
        const wantsFilm    = careers.some((c) => c.includes("arts") || c.includes("entertainment"));
        const wantsFinance = careers.some((c) => c.includes("finance") || c.includes("banking") || c.includes("consulting"));
        const wantsMed     = careers.some((c) => c.includes("medicine") || c.includes("healthcare"));
        const wantsTech    = careers.some((c) => c.includes("tech") || c.includes("computer") || c.includes("ai"));
        const wantsLaw     = careers.some((c) => c.includes("law"));
        const wantsGovt    = careers.some((c) => c.includes("government") || c.includes("policy"));
        if (wantsFilm    && (college.id === "usc" || college.id === "ucla")) { score += 12; fitReason = fitReason ?? `Your career interest in entertainment aligns directly with ${college.name}'s LA industry access.`; }
        if (wantsFinance && college.id === "hamilton") { score += 10; fitReason = fitReason ?? `Hamilton's NYC alumni network is strong in finance — a useful pipeline for your career goals.`; }
        if (wantsMed     && college.id === "ucla")     { score += 10; fitReason = fitReason ?? `UCLA's pre-med pipeline and proximity to major medical centers supports your healthcare career interest.`; }
        if (wantsTech    && (college.id === "ucla" || college.id === "usc")) { score += 10; fitReason = fitReason ?? `LA's tech scene is accessible from ${college.name} for career exploration during the school year.`; }
        if (wantsLaw     && college.id === "hamilton") { score += 10; fitReason = fitReason ?? `Hamilton sends a high proportion of graduates to top law schools.`; }
        if (wantsGovt    && college.id === "hamilton") { score += 8;  fitReason = fitReason ?? `Hamilton's Politics concentration and DC-area alumni support your interest in government.`; }
        inputsUsed.push("Career interests");
      }
      const s = clampN(score, 20, 95);
      cats.push({ key: "career", label: "Career & internship access", score: s, status: scoreToStatus(s), fitReason, mismatchReason, inputsUsed });
    }
  }

  // ── 9. Admission odds ─────────────────────────────────────────────────────
  {
    const admitPct = Math.round(result.admit * 100);
    const score    = clampN(admitPct, 5, 95);
    let fitReason: string | null = null;
    let mismatchReason: string | null = null;
    if (result.bucket === "Safety")      { fitReason = `Your academic profile comfortably clears ${college.name}'s typical range — this school anchors your portfolio.`; }
    else if (result.bucket === "Target") { fitReason = `Your profile is competitive at ${college.name} — demonstrated interest and a sharp supplement move the needle.`; mismatchReason = `Admission isn't guaranteed — treat this as a swing, not a lock.`; }
    else if (result.bucket === "Reach")  { mismatchReason = `Odds (~${admitPct}%) are below typical — a strong supplement and early application strengthen your case.`; }
    else                                 { mismatchReason = `High risk and softer odds (~${admitPct}%) — weigh carefully before spending an application here.`; }
    cats.push({
      key: "admissions", label: "Admission odds", score, status: scoreToStatus(score),
      fitReason, mismatchReason,
      inputsUsed: ["GPA", profile.sat != null ? "SAT" : "Test-optional", "Course rigor"],
    });
  }

  return cats;
}

function generateFitSummary(
  college: College,
  profile: StudentProfile,
  result: BetaResult,
  onboarded: boolean
): string {
  const fitPct = Math.round(result.fit * 100);
  const admitPct = Math.round(result.admit * 100);
  const sizeDesc = college.size > 15000 ? "large" : college.size > 5000 ? "mid-sized" : "small";
  const settingDesc = college.setting === "urban" ? "urban" : college.setting === "suburban" ? "suburban" : "rural";
  const fitAdj = result.fit > 0.7 ? "well" : result.fit > 0.5 ? "reasonably well" : "loosely";

  // Only reference named interests the user actually entered
  const allInterests = [...(profile.majorInterests ?? []), ...(profile.interests ?? [])];
  const namedTwo = allInterests.slice(0, 2);
  const interestPhrase =
    namedTwo.length > 0
      ? ` Your interests in ${namedTwo.join(" and ")} show some overlap with ${college.short}'s strengths.`
      : "";

  const prefPhrase = onboarded
    ? ` Its ${sizeDesc} ${settingDesc} campus aligns ${fitAdj} with your stated preferences.`
    : "";

  return (
    `${college.name} scores a ${fitPct}% personal fit for you — placing it in the "${result.bucket}" tier.` +
    interestPhrase +
    prefPhrase +
    ` Estimated admit odds: ${admitPct}%.`
  );
}

export default function CollegePage({ params }: { params: { id: string } }) {
  const { state, toggleActivity, upsertCollege } = useApp();
  const [sourcing, setSourcing] = useState(false);
  const [sourceLog, setSourceLog] = useState<string[]>([]);

  const college = state?.colleges.find((c) => c.id === params.id);
  const activity = state?.activity[params.id];

  const result = useMemo(
    () => (college && state ? computeBeta(college, state.profile) : null),
    [college, state]
  );
  const enr = activity ? schoolEnrichment(activity) : 0;

  if (!state) return <div className="p-10 text-muted">Loading…</div>;
  if (!college || !activity || !result)
    return (
      <div className="p-10">
        <p className="text-muted">College not found.</p>
        <Link href="/" className="text-fit underline">
          Back to portfolio
        </Link>
      </div>
    );

  async function runSourcingAgent() {
    setSourcing(true);
    setSourceLog(["Claude run: searching admissions data + institutional values…"]);
    try {
      const res = await fetch("/api/source-college", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: college!.name, location: college!.location }),
      });
      const data = await res.json();
      setSourceLog((l) => [...l, "Exa cross-check: verifying facts against second source…", data.verified ? "✓ Double-verified." : "⚠ Could not fully verify — showing best estimate."]);
      upsertCollege({
        ...college!,
        values: data.values,
        whyEssayAngle: data.whyEssayAngle,
        tourUrl: data.tourUrl,
        verified: data.verified,
      });
    } catch {
      setSourceLog((l) => [...l, "Agent unavailable — connect Butterbase model gateway in api/source-college."]);
    } finally {
      setSourcing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-7">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Portfolio
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mt-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">{college.name}</h1>
          <p className="text-muted mt-1">{college.location}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/80">{result.blurb}</p>
        </div>
        <BetaBadge result={result} size={96} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Acceptance rate" value={`${Math.round(college.acceptanceRate * 100)}%`} />
        <Stat label="Your admit odds" value={`${Math.round(result.admit * 100)}%`} tone="amber" />
        <Stat label="Fit for you" value={`${Math.round(result.fit * 100)}%`} tone="fit" />
        <Stat label="Median SAT" value={`${college.medianSat}`} />
      </div>

      {/* School enrichment */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-semibold">School enrichment</span>
          <span className="text-xs text-muted">how much you&apos;ve done to de-risk {college.short}</span>
        </div>
        <EnrichmentBar value={enr} height={30} tone={enr >= 100 ? "fit" : "amber"} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* To-dos */}
        <div className="rounded-2xl border border-hair bg-card shadow-card p-5">
          <h2 className="font-display font-semibold mb-3">To-dos</h2>
          <ul className="flex flex-col gap-1.5">
            {ACTIVITY_LABELS.map(([key, label]) => {
              const done = activity[key];
              const isTour = key === "visitedInPerson";
              return (
                <li key={key}>
                  <button
                    onClick={() => toggleActivity(college.id, key)}
                    className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slatebg transition-colors"
                  >
                    <span
                      className={`grid place-items-center h-5 w-5 rounded border text-xs ${
                        done ? "bg-fit border-fit text-white" : "border-hair text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={`text-sm flex-1 ${done ? "line-through text-muted" : "text-ink"}`}>
                      {label}
                    </span>
                    {isTour && college.tourUrl && (
                      <a
                        href={college.tourUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-fit hover:underline"
                      >
                        Book →
                      </a>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Application values & aspects (agent-sourced) */}
        <div className="rounded-2xl border border-hair bg-card shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Values &amp; aspects</h2>
            {college.verified && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-fit bg-fitsoft px-2 py-0.5 rounded">
                ✓ Verified
              </span>
            )}
          </div>

          {college.values ? (
            <div className="space-y-3 text-sm leading-relaxed">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">What they value</p>
                <p className="text-ink/90">{college.values}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">Why-this-school angle</p>
                <p className="text-ink/90">{college.whyEssayAngle}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted mb-4">
              Run the sourcing agent to pull this school&apos;s values and a personalized essay angle — Claude searches,
              Exa double-checks.
            </p>
          )}

          <button
            onClick={runSourcingAgent}
            disabled={sourcing}
            className="mt-4 w-full rounded-xl bg-ink text-white py-2.5 text-sm font-display font-semibold hover:bg-ink/90 disabled:opacity-60 transition-colors"
          >
            {sourcing ? "Running agents…" : college.values ? "Re-run sourcing agent" : "Run sourcing agent"}
          </button>

          {sourceLog.length > 0 && (
            <div className="mt-3 rounded-lg bg-slatebg p-3 font-mono text-[11px] leading-relaxed text-muted space-y-1">
              {sourceLog.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personal fit section */}
      <PersonalFitSection college={college} profile={state.profile} result={result} onboarded={state.onboarded} />

      {/* Strengths chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {college.strengths.map((s) => (
          <span key={s} className="rounded-full border border-hair bg-card px-3 py-1 text-xs text-muted">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "fit" | "amber" }) {
  const color = tone === "fit" ? "text-fit" : tone === "amber" ? "text-amber" : "text-ink";
  return (
    <div className="rounded-xl border border-hair bg-card p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`font-mono text-2xl font-bold tabular mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function FitAccordion({
  label,
  items,
  prose = false,
  warn = false,
}: {
  label: string;
  items: string[];
  prose?: boolean;
  warn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-hair bg-slatebg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-fit rounded-lg ${
          warn ? "text-amber" : "text-muted"
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span
          className={`flex-shrink-0 text-xs transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-3 pb-3 pt-1">
          {prose ? (
            <p className="text-sm text-ink/80 leading-relaxed">{items[0]}</p>
          ) : (
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink/80">
                  <span className="text-muted flex-shrink-0 mt-0.5">·</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ cat }: { cat: FitCategory }) {
  const [open, setOpen] = useState(false);
  const hasDetail = cat.fitReason !== null || cat.mismatchReason !== null;
  const barColor =
    cat.status === "strong" || cat.status === "good" ? "bg-fit" :
    cat.status === "mixed" ? "bg-amber" :
    cat.status === "mismatch" ? "bg-risk" : "";
  const scoreColor =
    cat.status === "strong" || cat.status === "good" ? "text-fit" :
    cat.status === "mixed" ? "text-amber" :
    cat.status === "mismatch" ? "text-risk" : "text-muted";
  return (
    <div className="border-b border-hair last:border-0 py-2.5">
      <button
        onClick={() => hasDetail && setOpen((v) => !v)}
        disabled={!hasDetail}
        className={`w-full flex items-center gap-3 text-left ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className="text-xs font-medium text-ink/80 w-[130px] flex-shrink-0 leading-tight">{cat.label}</span>
        <div className="flex-1 h-1.5 rounded-full bg-hair overflow-hidden">
          {cat.status !== "unknown" && (
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${cat.score}%` }} />
          )}
        </div>
        <span className={`text-[11px] font-semibold tabular-nums w-8 text-right flex-shrink-0 ${scoreColor}`}>
          {cat.status === "unknown" ? "—" : `${cat.score}%`}
        </span>
        {hasDetail ? (
          <span className={`text-[10px] text-muted flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-out ${open ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
        <div className="space-y-1.5 pb-1 pl-[142px]">
          {cat.fitReason && (
            <p className="text-xs text-ink/75 leading-relaxed flex gap-1.5">
              <span className="text-fit flex-shrink-0 mt-0.5">✓</span>
              <span>{cat.fitReason}</span>
            </p>
          )}
          {cat.mismatchReason && (
            <p className="text-xs text-amber leading-relaxed flex gap-1.5">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span>{cat.mismatchReason}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalFitSection({
  college,
  profile,
  result,
  onboarded,
}: {
  college: College;
  profile: StudentProfile;
  result: BetaResult;
  onboarded: boolean;
}) {
  const fitProfile = SCHOOL_FIT_PROFILES[college.id] ?? null;
  const breakdown = buildFitBreakdown(college, profile, result, onboarded);
  const summary = generateFitSummary(college, profile, result, onboarded);

  const allInterests = [...(profile.majorInterests ?? []), ...(profile.interests ?? [])];
  const profileIsEmpty = !onboarded && allInterests.length === 0 && profile.needAid == null && profile.maxYearlyBudget == null;

  const bestFit = breakdown.filter(
    (c) => (c.status === "strong" || c.status === "good") && c.fitReason !== null
  );
  const mismatches = breakdown.filter(
    (c) => (c.status === "mismatch" || c.status === "mixed") && c.mismatchReason !== null
  );

  return (
    <div className="mt-6 rounded-2xl border border-hair bg-card shadow-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="font-display font-semibold">Your fit with this school</h2>
        <Link href="/onboarding" className="text-xs text-fit hover:underline flex-shrink-0 mt-0.5">
          Edit profile →
        </Link>
      </div>

      {/* Summary callout */}
      {profileIsEmpty ? (
        <div className="mt-3 mb-5 rounded-xl bg-slatebg border border-hair px-4 py-3">
          <p className="text-sm text-muted leading-relaxed">
            <span className="font-semibold text-ink">No profile answers yet.</span>{" "}
            Complete the survey to see a personalized fit breakdown — majors, budget, location, and learning preferences all factor in.{" "}
            <Link href="/onboarding" className="text-fit hover:underline">Start the profile →</Link>
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-fitsoft px-4 py-3 mt-3 mb-5">
          <p className="text-sm text-ink/80 leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: fit breakdown */}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Fit breakdown</p>
          <div className="rounded-xl border border-hair bg-slatebg px-3 py-1">
            {breakdown.map((cat) => (
              <CategoryRow key={cat.key} cat={cat} />
            ))}
          </div>
          {!onboarded && (
            <p className="text-[11px] text-muted italic mt-2">
              Several categories show "—" until you{" "}
              <Link href="/onboarding" className="text-fit hover:underline">complete the full survey</Link>.
            </p>
          )}
        </div>

        {/* Right: school culture accordions */}
        {fitProfile ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">School culture</p>
            <div className="space-y-1.5">
              <FitAccordion label="What they value"           items={fitProfile.whatTheyValue} />
              <FitAccordion label="Classes students love"     items={fitProfile.classesStudentsLove} />
              <FitAccordion label="Student vibe / atmosphere" items={[fitProfile.vibe]} prose />
              <FitAccordion label="Traditions & events"       items={fitProfile.traditions} />
              <FitAccordion label="Opportunities to explore"  items={fitProfile.opportunities} />
              <FitAccordion label="⚠ Watch-out / fit question" items={[fitProfile.watchOut]} prose warn />
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">School culture</p>
            {college.strengths.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {college.strengths.map((s) => (
                  <span key={s} className="rounded-full bg-slatebg border border-hair px-2.5 py-0.5 text-xs text-muted">{s}</span>
                ))}
              </div>
            )}
            {college.values && <p className="text-ink/80">{college.values}</p>}
            <p className="text-xs text-muted italic">Detailed culture profile not yet available. Run the sourcing agent above to enrich this school.</p>
          </div>
        )}
      </div>

      {/* Best-fit reasons + mismatches */}
      {(bestFit.length > 0 || mismatches.length > 0) && (
        <div className="mt-6 grid sm:grid-cols-2 gap-4 pt-5 border-t border-hair">
          {bestFit.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Best-fit reasons</p>
              <ul className="space-y-2">
                {bestFit.map((c) => (
                  <li key={c.key} className="flex gap-2 text-xs text-ink/80 leading-relaxed">
                    <span className="text-fit flex-shrink-0 mt-0.5 font-bold">✓</span>
                    <span>{c.fitReason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {mismatches.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Potential mismatches</p>
              <ul className="space-y-2">
                {mismatches.map((c) => (
                  <li key={c.key} className="flex gap-2 text-xs text-amber leading-relaxed">
                    <span className="flex-shrink-0 mt-0.5">⚠</span>
                    <span>{c.mismatchReason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
