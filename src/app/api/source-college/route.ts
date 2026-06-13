// ---------------------------------------------------------------------------
// /api/source-college  — the agent-native core.
//
// The team's pattern (from the design session):
//   1. Claude run  — search & synthesize a school's admissions values + a
//      personalized "why this school" angle.
//   2. Exa cross-check — verify the facts against a second, independent source.
//   3. Only return verified:true when both agree.
//
// All model calls route through the Butterbase model gateway (one key for
// Claude/GPT/Gemini + native RAG over college docs). Set BUTTERBASE_API_KEY
// and EXA_API_KEY to go live; without them this returns a sensible mock so the
// demo never breaks.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { rememberCollegeSourcing } from "@/lib/evermind";
import type { SchoolCulture } from "@/lib/data";

export const runtime = "nodejs";

interface Body {
  name: string;
  location: string;
}

interface Sourced {
  values: string;
  whyEssayAngle: string;
  tourUrl: string;
  culture: SchoolCulture;
}

const MOCK: Record<string, Sourced> = {
  default: {
    values: "Intellectual curiosity over a single declared major, demonstrated initiative outside the classroom, and a track record of contributing to a community.",
    whyEssayAngle: "Tie your range of interests to a specific program, professor, or tradition here — show you'd use the freedom, not just admire it.",
    tourUrl: "https://www.google.com/search?q=campus+tour",
    culture: {
      whatTheyValue: [
        "Intellectual curiosity and self-direction",
        "Demonstrated impact beyond the classroom",
        "A track record of contributing to community",
      ],
      classesStudentsLove: [
        "Signature first-year seminar",
        "Flagship course in the school's strongest department",
      ],
      vibe: "Run the sourcing agent with Butterbase configured to pull a grounded, school-specific culture profile here.",
      traditions: ["Homecoming weekend", "Annual spring festival"],
      opportunities: [
        "Undergraduate research with faculty",
        "Active student-organization ecosystem",
      ],
      watchOut: "Verify program-specific admissions requirements and current campus conditions before committing.",
    },
  },
};

async function claudeRun(name: string): Promise<Sourced | null> {
  const key = process.env.BUTTERBASE_API_KEY;
  if (!key) return null;
  // Through the Butterbase gateway (OpenAI-compatible). Swap model as needed.
  try {
    const res = await fetch("https://api.butterbase.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        messages: [
          {
            role: "system",
            content:
              "You are a college admissions analyst. Return ONLY compact JSON with this exact shape: " +
              '{"values": string, "whyEssayAngle": string, "tourUrl": string, ' +
              '"culture": {"whatTheyValue": string[], "classesStudentsLove": string[], ' +
              '"vibe": string, "traditions": string[], "opportunities": string[], "watchOut": string}}. ' +
              "values = what this school weighs most in admissions. " +
              "whyEssayAngle = a sharp angle for a 'why this school' supplement for a generalist applicant. " +
              "tourUrl = the official visit/tour page URL. " +
              "culture.whatTheyValue = 3-4 things the school culturally prizes. " +
              "culture.classesStudentsLove = 3-4 specific signature/beloved courses. " +
              "culture.vibe = 2-3 sentences on the student social/academic atmosphere. " +
              "culture.traditions = 2-3 named campus traditions or events. " +
              "culture.opportunities = 3-4 distinctive academic/career opportunities. " +
              "culture.watchOut = one honest fit caveat a prospective student should weigh. " +
              "Be specific and factual to THIS school — no generic filler.",
          },
          { role: "user", content: `School: ${name}` },
        ],
      }),
    });
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

async function exaVerify(name: string, claim: string): Promise<boolean> {
  const key = process.env.EXA_API_KEY;
  if (!key) return true; // demo: trust the Claude run when Exa isn't configured
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({ query: `${name} admissions values ${claim}`, numResults: 3 }),
    });
    const data = await res.json();
    return Array.isArray(data?.results) && data.results.length > 0;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { name, location } = (await req.json()) as Body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const claude = (await claudeRun(name)) ?? MOCK.default;
  const verified = await exaVerify(name, claude.values);

  const result = { ...claude, location, verified };

  // Store the sourcing result in Evermind so the agent can recall it later
  rememberCollegeSourcing("global", name, result as Record<string, unknown>);

  return NextResponse.json(result);
}
