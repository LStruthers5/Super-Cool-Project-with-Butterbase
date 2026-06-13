// GET  /api/db/colleges         — all colleges in the DB (catalog + user-sourced)
// POST /api/db/colleges         — upsert a college (body: College object)
import { NextResponse } from "next/server";
import { getBBClient, isBBConfigured } from "@/lib/butterbase-client";
import type { College } from "@/lib/data";

export const runtime = "nodejs";

interface CollegeRow {
  id: string;
  name: string;
  short: string;
  location: string;
  acceptance_rate: number;
  median_gpa: number;
  median_sat: number;
  size: number;
  setting: string;
  breadth: number;
  vibe_intense: number;
  strengths: string | null;
  college_type: string | null;
  tuition: number | null;
  values: string | null;
  why_essay_angle: string | null;
  tour_url: string | null;
  verified: boolean;
  is_catalog: boolean;
}

function rowToCollege(r: CollegeRow): College {
  return {
    id:             r.id,
    name:           r.name,
    short:          r.short,
    location:       r.location,
    acceptanceRate: r.acceptance_rate,
    medianGpa:      r.median_gpa,
    medianSat:      r.median_sat,
    size:           r.size,
    setting:        r.setting as College["setting"],
    breadth:        r.breadth,
    vibeIntense:    r.vibe_intense,
    strengths:      r.strengths ? JSON.parse(r.strengths) : [],
    type:           (r.college_type as College["type"]) ?? undefined,
    tuition:        r.tuition ?? undefined,
    values:         r.values ?? undefined,
    whyEssayAngle:  r.why_essay_angle ?? undefined,
    tourUrl:        r.tour_url ?? undefined,
    verified:       r.verified,
  };
}

function collegeToRow(c: College, isCatalog = false): CollegeRow {
  return {
    id:              c.id,
    name:            c.name,
    short:           c.short,
    location:        c.location,
    acceptance_rate: c.acceptanceRate,
    median_gpa:      c.medianGpa,
    median_sat:      c.medianSat,
    size:            c.size,
    setting:         c.setting,
    breadth:         c.breadth,
    vibe_intense:    c.vibeIntense,
    strengths:       JSON.stringify(c.strengths),
    college_type:    c.type ?? null,
    tuition:         c.tuition ?? null,
    values:          c.values ?? null,
    why_essay_angle: c.whyEssayAngle ?? null,
    tour_url:        c.tourUrl ?? null,
    verified:        c.verified ?? false,
    is_catalog:      isCatalog,
  };
}

export async function GET() {
  if (!isBBConfigured()) return NextResponse.json({ data: [] });

  const bb = getBBClient();
  const { data, error } = await bb.from<CollegeRow>("colleges").select();
  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });

  return NextResponse.json({ data: (data as CollegeRow[]).map(rowToCollege) });
}

export async function POST(req: Request) {
  if (!isBBConfigured()) return NextResponse.json({ ok: true, skipped: true });

  const { college, isCatalog } = await req.json() as { college: College; isCatalog?: boolean };
  const row = collegeToRow(college, isCatalog ?? false);
  const bb = getBBClient();

  // Upsert: update if exists, insert if not
  const { data: existing } = await bb.from<CollegeRow>("colleges")
    .select("id")
    .eq("id", college.id)
    .maybeSingle();

  if (existing) {
    const { error } = await bb.from<CollegeRow>("colleges")
      .update(row)
      .eq("id", college.id);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  } else {
    const { error } = await bb.from<CollegeRow>("colleges").insert(row);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
