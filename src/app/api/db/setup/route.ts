// One-time schema bootstrap. Call POST /api/db/setup to create/migrate tables.
// Safe to call multiple times — Butterbase applies only the delta.
import { NextResponse } from "next/server";
import { getBBClient, isBBConfigured } from "@/lib/butterbase-client";

export const runtime = "nodejs";

export async function POST() {
  if (!isBBConfigured()) {
    return NextResponse.json({ ok: false, reason: "Butterbase not configured" }, { status: 503 });
  }

  const bb = getBBClient();
  const { data, error } = await bb.admin.schema.apply({
    tables: {
      student_profiles: {
        columns: {
          id:                { type: "uuid",                     default: "gen_random_uuid()" },
          user_id:           { type: "text",   unique: true,     nullable: false },
          name:              { type: "text",                     nullable: true },
          gpa:               { type: "numeric",                  nullable: true },
          sat:               { type: "integer",                  nullable: true },
          act:               { type: "integer",                  nullable: true },
          rigor:             { type: "numeric",                  nullable: true },
          pref_large_school: { type: "numeric",                  nullable: true },
          pref_urban:        { type: "numeric",                  nullable: true },
          pref_breadth:      { type: "numeric",                  nullable: true },
          pref_vibe_intense: { type: "numeric",                  nullable: true },
          extra_fields:      { type: "text",                     nullable: true }, // JSON: all optional profile fields
          portfolio_ids:     { type: "text",                     nullable: true }, // JSON array of college ids
          risk_tolerance:    { type: "numeric",                  nullable: true },
          risk_target_count: { type: "integer",                  nullable: true },
          readiness:         { type: "text",                     nullable: true }, // JSON PortfolioReadiness
          onboarded:         { type: "boolean", default: "false" },
          created_at:        { type: "timestamp with time zone", default: "now()" },
          updated_at:        { type: "timestamp with time zone", default: "now()" },
        },
      },

      colleges: {
        columns: {
          id:              { type: "text",    unique: true, nullable: false }, // slug e.g. "ucla"
          name:            { type: "text",                  nullable: false },
          short:           { type: "text",                  nullable: false },
          location:        { type: "text",                  nullable: false },
          acceptance_rate: { type: "numeric",               nullable: false },
          median_gpa:      { type: "numeric",               nullable: false },
          median_sat:      { type: "integer",               nullable: false },
          size:            { type: "integer",               nullable: false },
          setting:         { type: "text",                  nullable: false },
          breadth:         { type: "numeric",               nullable: false },
          vibe_intense:    { type: "numeric",               nullable: false },
          strengths:       { type: "text",                  nullable: true }, // JSON string[]
          college_type:    { type: "text",                  nullable: true },
          tuition:         { type: "integer",               nullable: true },
          values:          { type: "text",                  nullable: true },
          why_essay_angle: { type: "text",                  nullable: true },
          tour_url:        { type: "text",                  nullable: true },
          verified:        { type: "boolean", default: "false" },
          is_catalog:      { type: "boolean", default: "true" },
          created_at:      { type: "timestamp with time zone", default: "now()" },
        },
      },

      school_activity: {
        columns: {
          id:                  { type: "uuid",    default: "gen_random_uuid()" },
          user_id:             { type: "text",    nullable: false },
          college_id:          { type: "text",    nullable: false },
          visited_in_person:   { type: "boolean", default: "false" },
          virtual_tour:        { type: "boolean", default: "false" },
          talked_to_student:   { type: "boolean", default: "false" },
          found_clubs:         { type: "boolean", default: "false" },
          interviewed:         { type: "boolean", default: "false" },
          started_supplement:  { type: "boolean", default: "false" },
          finished_supplement: { type: "boolean", default: "false" },
          updated_at:          { type: "timestamp with time zone", default: "now()" },
        },
        indexes: {
          user_college_unique: { columns: ["user_id", "college_id"], unique: true },
        },
      },
    },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result: data });
}
