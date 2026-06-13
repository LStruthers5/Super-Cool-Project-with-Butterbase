// GET  /api/db/profile?userId=xxx  — load profile + portfolio state for a user
// PUT  /api/db/profile              — upsert (body: { userId, profile, portfolioIds, risk, readiness, onboarded })
import { NextResponse } from "next/server";
import { getBBClient, isBBConfigured } from "@/lib/butterbase-client";
import type { StudentProfile, PortfolioReadiness } from "@/lib/data";
import type { RiskSettings } from "@/lib/recommend";

export const runtime = "nodejs";

interface ProfileRow {
  id?: string;
  user_id: string;
  name: string | null;
  gpa: number | null;
  sat: number | null;
  act: number | null;
  rigor: number | null;
  pref_large_school: number | null;
  pref_urban: number | null;
  pref_breadth: number | null;
  pref_vibe_intense: number | null;
  extra_fields: string | null;
  portfolio_ids: string | null;
  risk_tolerance: number | null;
  risk_target_count: number | null;
  readiness: string | null;
  onboarded: boolean;
}

function rowToState(row: ProfileRow) {
  const extra = row.extra_fields ? JSON.parse(row.extra_fields) : {};
  const profile: StudentProfile = {
    name:            row.name ?? "",
    gpa:             row.gpa ?? 3.5,
    sat:             row.sat,
    act:             row.act,
    rigor:           row.rigor ?? 0.5,
    prefLargeSchool: row.pref_large_school ?? 0.5,
    prefUrban:       row.pref_urban ?? 0.5,
    prefBreadth:     row.pref_breadth ?? 0.5,
    prefVibeIntense: row.pref_vibe_intense ?? 0.5,
    interests:       extra.interests ?? [],
    ...extra,
  };
  return {
    profile,
    portfolioIds: row.portfolio_ids ? (JSON.parse(row.portfolio_ids) as string[]) : [],
    risk: {
      tolerance:   row.risk_tolerance   ?? 0.5,
      targetCount: row.risk_target_count ?? 8,
    } as RiskSettings,
    readiness: row.readiness
      ? (JSON.parse(row.readiness) as PortfolioReadiness)
      : { commonAppDone: false, testsSubmitted: false, recsRequested: false, fafsaDone: false },
    onboarded: row.onboarded ?? false,
  };
}

export async function GET(req: Request) {
  if (!isBBConfigured()) return NextResponse.json({ data: null });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const bb = getBBClient();
  const { data, error } = await bb.from<ProfileRow>("student_profiles")
    .select()
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  if (!data) return NextResponse.json({ data: null });

  return NextResponse.json({ data: rowToState(data as unknown as ProfileRow) });
}

export async function PUT(req: Request) {
  if (!isBBConfigured()) return NextResponse.json({ ok: true, skipped: true });

  const body = await req.json() as {
    userId: string;
    profile: StudentProfile;
    portfolioIds: string[];
    risk: RiskSettings;
    readiness: PortfolioReadiness;
    onboarded: boolean;
  };

  const { userId, profile, portfolioIds, risk, readiness, onboarded } = body;

  // Separate the core scalar fields from the optional JSON blob
  const {
    name, gpa, sat, act, rigor,
    prefLargeSchool, prefUrban, prefBreadth, prefVibeIntense,
    ...rest
  } = profile;

  const row: Omit<ProfileRow, "id"> = {
    user_id:           userId,
    name:              name ?? null,
    gpa:               gpa ?? null,
    sat:               sat ?? null,
    act:               act ?? null,
    rigor:             rigor ?? null,
    pref_large_school: prefLargeSchool ?? null,
    pref_urban:        prefUrban ?? null,
    pref_breadth:      prefBreadth ?? null,
    pref_vibe_intense: prefVibeIntense ?? null,
    extra_fields:      JSON.stringify(rest),
    portfolio_ids:     JSON.stringify(portfolioIds),
    risk_tolerance:    risk.tolerance,
    risk_target_count: risk.targetCount,
    readiness:         JSON.stringify(readiness),
    onboarded,
  };

  const bb = getBBClient();

  // Try update first; insert if no row exists
  const { data: existing } = await bb.from<ProfileRow>("student_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await bb.from<ProfileRow>("student_profiles")
      .update(row)
      .eq("user_id", userId);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  } else {
    const { error } = await bb.from<ProfileRow>("student_profiles").insert(row);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
