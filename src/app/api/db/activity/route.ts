// GET  /api/db/activity?userId=xxx  — all school activity rows for a user
// POST /api/db/activity              — upsert one activity row (body: { userId, activity: SchoolActivity })
import { NextResponse } from "next/server";
import { getBBClient, isBBConfigured } from "@/lib/butterbase-client";
import type { SchoolActivity } from "@/lib/data";

export const runtime = "nodejs";

interface ActivityRow {
  id?: string;
  user_id: string;
  college_id: string;
  visited_in_person: boolean;
  virtual_tour: boolean;
  talked_to_student: boolean;
  found_clubs: boolean;
  interviewed: boolean;
  started_supplement: boolean;
  finished_supplement: boolean;
}

function rowToActivity(r: ActivityRow): SchoolActivity {
  return {
    collegeId:         r.college_id,
    visitedInPerson:   r.visited_in_person,
    virtualTour:       r.virtual_tour,
    talkedToStudent:   r.talked_to_student,
    foundClubs:        r.found_clubs,
    interviewed:       r.interviewed,
    startedSupplement: r.started_supplement,
    finishedSupplement:r.finished_supplement,
  };
}

export async function GET(req: Request) {
  if (!isBBConfigured()) return NextResponse.json({ data: [] });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const bb = getBBClient();
  const { data, error } = await bb.from<ActivityRow>("school_activity")
    .select()
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  return NextResponse.json({ data: (data as ActivityRow[]).map(rowToActivity) });
}

export async function POST(req: Request) {
  if (!isBBConfigured()) return NextResponse.json({ ok: true, skipped: true });

  const { userId, activity } = await req.json() as { userId: string; activity: SchoolActivity };
  const bb = getBBClient();

  const row: ActivityRow = {
    user_id:            userId,
    college_id:         activity.collegeId,
    visited_in_person:  activity.visitedInPerson,
    virtual_tour:       activity.virtualTour,
    talked_to_student:  activity.talkedToStudent,
    found_clubs:        activity.foundClubs,
    interviewed:        activity.interviewed,
    started_supplement: activity.startedSupplement,
    finished_supplement:activity.finishedSupplement,
  };

  const { data: existing } = await bb.from<ActivityRow>("school_activity")
    .select("id")
    .eq("user_id", userId)
    .eq("college_id", activity.collegeId)
    .maybeSingle();

  if (existing) {
    const { error } = await bb.from<ActivityRow>("school_activity")
      .update(row)
      .eq("user_id", userId);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  } else {
    const { error } = await bb.from<ActivityRow>("school_activity").insert(row);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
