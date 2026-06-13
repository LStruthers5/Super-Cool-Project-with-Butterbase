"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import type { StudentProfile } from "@/lib/data";

// ── Chip-select options ────────────────────────────────────────────────────

const SUBJECT_OPTIONS = [
  "Math", "Biology", "Chemistry", "Physics", "Computer Science",
  "English / Writing", "History", "Economics", "Psychology",
  "Art / Design", "Music / Theater", "Foreign Language",
];

const MAJOR_OPTIONS = [
  "Biology / Pre-Med", "Chemistry", "Physics", "Computer Science",
  "Mathematics / Statistics", "Engineering (General)", "Mechanical Engineering",
  "Electrical Engineering", "Environmental Science / Sustainability",
  "Psychology", "Sociology / Anthropology", "Political Science / Government",
  "Economics", "Business / Finance", "Entrepreneurship", "Marketing",
  "Communications / Media", "Journalism", "English / Literature",
  "History", "Philosophy", "Film / Media Studies", "Visual Art / Design",
  "Music", "Theater / Performing Arts", "Architecture",
  "Nursing / Health Sciences", "Education", "Social Work",
  "Pre-Law / Legal Studies",
];

const CAREER_OPTIONS = [
  "Medicine / Healthcare", "Law", "Engineering / Tech",
  "Computer Science / AI", "Finance / Banking", "Consulting",
  "Entrepreneurship / Startups", "Education / Teaching",
  "Research / Academia", "Government / Policy", "Non-profit",
  "Arts / Entertainment", "Journalism / Media", "Architecture",
  "Environmental / Sustainability",
];

const REGION_OPTIONS = [
  "New England", "Mid-Atlantic", "Southeast", "Midwest",
  "Southwest", "Mountain West", "West Coast", "Pacific Northwest",
  "No preference",
];

const INDUSTRY_OPTIONS = [
  "Tech / Silicon Valley", "Healthcare / Medical",
  "Finance / Wall Street", "Entertainment / Media",
  "Government / Policy (DC)", "Research / Academia",
  "Arts / Culture", "Environmental",
];

const DISTANCE_OPTIONS = ["< 2 hours", "2–5 hours", "5+ hours", "Anywhere is fine"];
const CLIMATE_OPTIONS = ["Warm / sunny", "Cold winters", "Four seasons", "No preference"];

// ── Tiny reusable components ───────────────────────────────────────────────

function SurveySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-6">
      <h2 className="font-display font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold block mb-0.5">{label}</span>
      {hint && <span className="text-xs text-muted block mb-1">{hint}</span>}
      {children}
    </label>
  );
}

function PrefSlider({
  leftLabel, rightLabel, value, onChange,
}: { leftLabel: string; rightLabel: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-muted mb-1.5">
        <span className="max-w-[44%]">{leftLabel}</span>
        <span className="max-w-[44%] text-right">{rightLabel}</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-fit h-2"
      />
    </div>
  );
}

function ChipSelect({
  options, selected, onToggle, max,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        const disabled = !active && max !== undefined && selected.length >= max;
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(opt)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-fit border-fit text-white"
                : disabled
                ? "border-hair text-muted/40 cursor-not-allowed"
                : "border-hair text-muted hover:border-fit hover:text-fit"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RadioGroup({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt
              ? "bg-ink border-ink text-white"
              : "border-hair text-muted hover:border-ink/40"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Main survey ────────────────────────────────────────────────────────────

export default function Onboarding() {
  const { state, setProfile, setOnboarded } = useApp();
  const router = useRouter();
  const [draft, setDraft] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (state && !draft) setDraft(state.profile);
  }, [state, draft]);

  if (!draft) return <div className="p-10 text-muted">Loading…</div>;

  const set = (patch: Partial<StudentProfile>) => setDraft((d) => d ? { ...d, ...patch } : d);

  const n = (v: number | undefined, def = 0.5) => v ?? def;

  function toggleChip(field: keyof StudentProfile, value: string) {
    if (!draft) return;
    const arr = (draft[field] as string[] | undefined) ?? [];
    const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
    set({ [field]: next } as Partial<StudentProfile>);
  }

  const chips = (field: keyof StudentProfile) => (draft[field] as string[] | undefined) ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8">
      <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">Your profile</p>
      <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
        Tell us about yourself
      </h1>
      <p className="text-muted mb-8 text-sm leading-relaxed">
        Answer what you know — every field is optional. The more you fill in, the more specific your fit signals become on each school page.
      </p>

      {/* ── 1. Academic Profile ─────────────────────────────────────────── */}
      <SurveySection title="Academic profile">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Your name">
            <input
              type="text"
              placeholder="First name"
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              className="w-full text-sm bg-transparent border-b border-hair pb-1 outline-none focus:border-ink"
            />
          </Field>
          <Field label="Unweighted GPA" hint="0–4.0 scale">
            <input
              type="number" step="0.01" min={0} max={4}
              value={draft.gpa || ""}
              onChange={(e) => set({ gpa: parseFloat(e.target.value) || 0 })}
              placeholder="3.8"
              className="w-full font-mono text-lg bg-transparent border-b border-hair pb-1 outline-none focus:border-ink"
            />
          </Field>
          <Field label="AP / IB / dual-enrollment" hint="total courses, not just this year">
            <input
              type="number" min={0}
              value={draft.apCount ?? ""}
              onChange={(e) => set({ apCount: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g. 6"
              className="w-full font-mono text-lg bg-transparent border-b border-hair pb-1 outline-none focus:border-ink"
            />
          </Field>
          <Field label="SAT" hint="leave blank = test-optional">
            <input
              type="number" min={400} max={1600}
              value={draft.sat ?? ""}
              onChange={(e) => set({ sat: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g. 1400"
              className="w-full font-mono text-lg bg-transparent border-b border-hair pb-1 outline-none focus:border-ink"
            />
          </Field>
          <Field label="ACT" hint="leave blank = not submitting">
            <input
              type="number" min={1} max={36}
              value={draft.act ?? ""}
              onChange={(e) => set({ act: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g. 32"
              className="w-full font-mono text-lg bg-transparent border-b border-hair pb-1 outline-none focus:border-ink"
            />
          </Field>
        </div>
        <PrefSlider
          leftLabel="Standard course load"
          rightLabel="Max APs / IB / all honors"
          value={draft.rigor}
          onChange={(v) => set({ rigor: v })}
        />
        <Field label="Strongest subjects" hint="Select all that apply">
          <ChipSelect
            options={SUBJECT_OPTIONS}
            selected={chips("strongestSubjects")}
            onToggle={(v) => toggleChip("strongestSubjects", v)}
          />
        </Field>
      </SurveySection>

      {/* ── 2. Majors & Career ──────────────────────────────────────────── */}
      <SurveySection title="Majors & career interests">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="undecided"
            checked={draft.undecided ?? false}
            onChange={(e) => set({ undecided: e.target.checked })}
            className="accent-fit"
          />
          <label htmlFor="undecided" className="text-sm text-ink cursor-pointer">
            I&apos;m undecided / still exploring — that&apos;s fine
          </label>
        </div>
        <Field label="Potential majors" hint="Pick up to 5, in rough order of interest">
          <ChipSelect
            options={MAJOR_OPTIONS}
            selected={chips("majorInterests")}
            onToggle={(v) => toggleChip("majorInterests", v)}
            max={5}
          />
        </Field>
        <Field label="Broader academic & extracurricular interests" hint="Topics you enjoy, even outside a declared major">
          <ChipSelect
            options={["Film", "Creative Writing", "Entrepreneurship", "Visual Art", "Music",
              "Theater", "Research", "Journalism", "Debate", "Community Service",
              "Athletics", "Coding / Tech", "Cooking", "Language / Linguistics"]}
            selected={chips("interests")}
            onToggle={(v) => toggleChip("interests", v)}
          />
        </Field>
        <Field label="Career directions you&apos;re drawn to" hint="Pick anything that feels possible">
          <ChipSelect
            options={CAREER_OPTIONS}
            selected={chips("careerInterests")}
            onToggle={(v) => toggleChip("careerInterests", v)}
            max={4}
          />
        </Field>
        <PrefSlider
          leftLabel="I know my major and want to focus"
          rightLabel="I want freedom to switch or combine fields"
          value={n(draft.majorFlexibility)}
          onChange={(v) => set({ majorFlexibility: v })}
        />
      </SurveySection>

      {/* ── 3. Cost & Aid ───────────────────────────────────────────────── */}
      <SurveySection title="Cost, aid, and budget">
        <Field label="Maximum yearly cost you can afford" hint="Rough estimate after expected aid/scholarships, in USD">
          <select
            value={draft.maxYearlyBudget ?? ""}
            onChange={(e) =>
              set({ maxYearlyBudget: e.target.value ? parseInt(e.target.value) : null })
            }
            className="w-full text-sm bg-transparent border-b border-hair pb-1 outline-none focus:border-ink text-ink"
          >
            <option value="">Not sure / skip</option>
            <option value="15000">Under $15,000/yr</option>
            <option value="25000">$15,000–$25,000/yr</option>
            <option value="35000">$25,000–$35,000/yr</option>
            <option value="50000">$35,000–$50,000/yr</option>
            <option value="70000">$50,000–$70,000/yr (no limit for fit)</option>
          </select>
        </Field>
        <div className="flex flex-col gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.needAid === true}
              onChange={(e) => set({ needAid: e.target.checked ? true : null })}
              className="accent-fit"
            />
            <span className="text-sm text-ink">Need-based financial aid is required for me to attend</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.meritImportant === true}
              onChange={(e) => set({ meritImportant: e.target.checked ? true : null })}
              className="accent-fit"
            />
            <span className="text-sm text-ink">Merit scholarships are an important factor in my choice</span>
          </label>
        </div>
        <PrefSlider
          leftLabel="Fine taking on student loans"
          rightLabel="Avoid loans as much as possible"
          value={n(draft.loanSensitivity)}
          onChange={(v) => set({ loanSensitivity: v })}
        />
      </SurveySection>

      {/* ── 4. Location ─────────────────────────────────────────────────── */}
      <SurveySection title="Location preferences">
        <Field label="Preferred regions" hint="Select all that interest you">
          <ChipSelect
            options={REGION_OPTIONS}
            selected={chips("preferredRegions")}
            onToggle={(v) => toggleChip("preferredRegions", v)}
          />
        </Field>
        <Field label="Distance from home">
          <RadioGroup
            options={DISTANCE_OPTIONS}
            value={draft.maxDistanceFromHome ?? ""}
            onChange={(v) => set({ maxDistanceFromHome: v })}
          />
        </Field>
        <Field label="Climate preference">
          <RadioGroup
            options={CLIMATE_OPTIONS}
            value={draft.climatePreference ?? ""}
            onChange={(v) => set({ climatePreference: v })}
          />
        </Field>
        <Field label="I want to be near…" hint="Industry clusters that matter for internships or career">
          <ChipSelect
            options={INDUSTRY_OPTIONS}
            selected={chips("nearIndustry")}
            onToggle={(v) => toggleChip("nearIndustry", v)}
          />
        </Field>
      </SurveySection>

      {/* ── 5. Campus & Social ──────────────────────────────────────────── */}
      <SurveySection title="Campus size & social environment">
        <PrefSlider
          leftLabel="Small — everyone knows you"
          rightLabel="Large school energy & a packed stadium"
          value={draft.prefLargeSchool}
          onChange={(v) => set({ prefLargeSchool: v })}
        />
        <PrefSlider
          leftLabel="Quiet campus in nature / suburban town"
          rightLabel="In the middle of a major city"
          value={draft.prefUrban}
          onChange={(v) => set({ prefUrban: v })}
        />
        <PrefSlider
          leftLabel="Collaborative & laid-back culture"
          rightLabel="Intense & pre-professional"
          value={draft.prefVibeIntense}
          onChange={(v) => set({ prefVibeIntense: v })}
        />
        <PrefSlider
          leftLabel="Avoid Greek life"
          rightLabel="Greek life is important to me"
          value={n(draft.greekLifePref)}
          onChange={(v) => set({ greekLifePref: v })}
        />
        <PrefSlider
          leftLabel="Sports / school spirit don&apos;t matter"
          rightLabel="Big game days are part of why I&apos;m applying"
          value={n(draft.sportsImportance)}
          onChange={(v) => set({ sportsImportance: v })}
        />
      </SurveySection>

      {/* ── 6. Learning Environment ─────────────────────────────────────── */}
      <SurveySection title="Learning style & academic priorities">
        <PrefSlider
          leftLabel="Lock in a major and go deep"
          rightLabel="Explore many fields before committing"
          value={draft.prefBreadth}
          onChange={(v) => set({ prefBreadth: v })}
        />
        <PrefSlider
          leftLabel="Large lectures are fine"
          rightLabel="Small seminars where I know the professor"
          value={n(draft.seminarVsLecture, 0.5)}
          onChange={(v) => set({ seminarVsLecture: 1 - v })}
        />
        <PrefSlider
          leftLabel="Faculty access doesn&apos;t matter much"
          rightLabel="Open-door professors are essential"
          value={n(draft.facultyAccessImportance)}
          onChange={(v) => set({ facultyAccessImportance: v })}
        />
        <PrefSlider
          leftLabel="No interest in research"
          rightLabel="Research is a top priority"
          value={n(draft.researchInterest)}
          onChange={(v) => set({ researchInterest: v })}
        />
        <PrefSlider
          leftLabel="Internships are not a factor"
          rightLabel="Strong internship pipeline is a must"
          value={n(draft.internshipImportance)}
          onChange={(v) => set({ internshipImportance: v })}
        />
        <PrefSlider
          leftLabel="Study abroad is not for me"
          rightLabel="Study abroad is very important"
          value={n(draft.studyAbroadInterest)}
          onChange={(v) => set({ studyAbroadInterest: v })}
        />
      </SurveySection>

      {/* ── 7. Application Strategy ─────────────────────────────────────── */}
      <SurveySection title="Application strategy">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.edEaWillingness ?? false}
            onChange={(e) => set({ edEaWillingness: e.target.checked })}
            className="accent-fit"
          />
          <span className="text-sm text-ink">
            I&apos;m willing to apply Early Decision or Early Action to a top-choice school
          </span>
        </label>
      </SurveySection>

      <button
        onClick={() => {
          setProfile(draft);
          setOnboarded(true);
          router.push("/");
        }}
        className="rounded-xl bg-ink text-white px-8 py-3 font-display font-semibold hover:bg-ink/90 transition-colors"
      >
        Save profile &amp; go to portfolio →
      </button>
      <p className="text-xs text-muted mt-3">
        You can return here any time to update your answers.
      </p>
    </div>
  );
}
