// ---------------------------------------------------------------------------
// Alpha Leads — FRONTEND MOCK. [Claude / UI lane]
//
// The "Alpha engine" sources opportunities (deadlines, scholarships, essay
// angles, visits, insights, connections) that improve a student's application
// strategy. Backend (Codex) will own the canonical `AlphaLead` type + scoring
// helpers and feed these from real sourcing agents (Evermind/Butterbase).
//
// Until then this seed lets the Alpha + Beta story render demo-ready with no
// backend. When Codex's type lands, swap this import for theirs — the shape is
// intentionally simple so reconciliation is a near drop-in.
// ---------------------------------------------------------------------------

export type AlphaLeadKind =
  | "deadline"
  | "scholarship"
  | "essay"
  | "visit"
  | "insight"
  | "connection";

export type AlphaLeadStatus = "new" | "accepted" | "converted" | "dismissed";

export interface AlphaLead {
  id: string;
  kind: AlphaLeadKind;
  title: string;
  detail: string;
  school?: string; // short label, e.g. "USC"
  impact: number; // strength points this opportunity is worth
  due?: string; // human label, e.g. "Nov 1"
  cta: string; // primary action label
  status: AlphaLeadStatus;
}

export interface KindMeta {
  label: string;
  icon: string;
  /** tailwind text + soft-bg pair from the project palette */
  text: string;
  bg: string;
}

export const KIND_META: Record<AlphaLeadKind, KindMeta> = {
  deadline: { label: "Deadline", icon: "⏰", text: "text-risk", bg: "bg-risksoft" },
  scholarship: { label: "Scholarship", icon: "💰", text: "text-fit", bg: "bg-fitsoft" },
  essay: { label: "Essay angle", icon: "✍️", text: "text-ink", bg: "bg-slatebg" },
  visit: { label: "Visit", icon: "📍", text: "text-amber", bg: "bg-slatebg" },
  insight: { label: "Insight", icon: "💡", text: "text-fit", bg: "bg-fitsoft" },
  connection: { label: "Connection", icon: "🤝", text: "text-ink", bg: "bg-slatebg" },
};

export const SEED_ALPHA_LEADS: AlphaLead[] = [
  {
    id: "lead-usc-trustee",
    kind: "scholarship",
    title: "Trustee Scholarship — full tuition",
    detail: "USC's top merit award. Your GPA + rigor clear the bar; needs the Dec 1 priority app.",
    school: "USC",
    impact: 20,
    due: "Dec 1",
    cta: "Add to plan",
    status: "new",
  },
  {
    id: "lead-usc-ea",
    kind: "deadline",
    title: "USC Early Action closes Nov 1",
    detail: "Non-binding, and it's the only way to be considered for merit scholarships.",
    school: "USC",
    impact: 14,
    due: "Nov 1",
    cta: "Add to plan",
    status: "new",
  },
  {
    id: "lead-usc-alum",
    kind: "connection",
    title: "USC alum working in film — intro available",
    detail: "Recent grad in your field is open to a 20-min call. Demonstrated interest + real signal for your essay.",
    school: "USC",
    impact: 12,
    cta: "Request intro",
    status: "new",
  },
  {
    id: "lead-ucla-film",
    kind: "insight",
    title: "UCLA weighs demonstrated interest in Film",
    detail: "Applicants who name specific programs + faculty convert noticeably better. Worth a targeted supplement.",
    school: "UCLA",
    impact: 9,
    cta: "Use in supplement",
    status: "new",
  },
  {
    id: "lead-ham-why",
    kind: "essay",
    title: "Sharp 'why Hamilton' angle: open curriculum",
    detail: "Tie your generalist, multi-interest profile to their no-distribution-requirements pitch.",
    school: "Ham",
    impact: 10,
    cta: "Draft angle",
    status: "new",
  },
  {
    id: "lead-skid-visit",
    kind: "visit",
    title: "Skidmore virtual info session — Tue 6pm",
    detail: "Counts as demonstrated interest and de-risks your Skidmore β. Easy win.",
    school: "Skid",
    impact: 8,
    due: "Tue",
    cta: "Reserve seat",
    status: "new",
  },
  {
    id: "lead-fafsa",
    kind: "deadline",
    title: "FAFSA is open — file early",
    detail: "Some aid is first-come. Filing now protects need-based and merit packaging across every school.",
    impact: 11,
    cta: "Start FAFSA",
    status: "new",
  },
  {
    id: "lead-regional-merit",
    kind: "scholarship",
    title: "Regional merit award you qualify for",
    detail: "A local foundation award matching your profile. Small effort, stacks with school aid.",
    impact: 7,
    cta: "Add to plan",
    status: "new",
  },
];

export const totalAlphaImpact = (leads: AlphaLead[]): number =>
  leads.reduce((sum, l) => sum + l.impact, 0);
