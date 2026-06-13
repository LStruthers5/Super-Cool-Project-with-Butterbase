// Evermind (EverOS) integration — local-first memory OS for the student agent.
// EverOS runs as a local Python server on port 8000 (pip install everos; everos server start).
// All calls are fire-and-forget: the app works fine if the server is not running.

const EVERMIND_BASE = process.env.NEXT_PUBLIC_EVERMIND_URL ?? "http://127.0.0.1:8000";
const TIMEOUT_MS = 2000;

async function post(path: string, body: unknown): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${EVERMIND_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return await res.json();
  } catch {
    // Silently ignore — Evermind is optional
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Store a student profile snapshot as an Evermind memory episode.
export async function rememberProfile(
  sessionId: string,
  profile: Record<string, unknown>
): Promise<void> {
  const messages = [
    {
      role: "user",
      content: `Student profile update for session ${sessionId}`,
    },
    {
      role: "assistant",
      content: JSON.stringify(profile, null, 2),
    },
  ];
  await post("/api/v1/memory/add", { session_id: sessionId, messages });
}

// Store a college sourcing result so the agent can recall it later.
export async function rememberCollegeSourcing(
  sessionId: string,
  collegeName: string,
  result: Record<string, unknown>
): Promise<void> {
  const messages = [
    {
      role: "user",
      content: `Sourced admissions data for ${collegeName}`,
    },
    {
      role: "assistant",
      content: JSON.stringify(result, null, 2),
    },
  ];
  await post("/api/v1/memory/add", { session_id: sessionId, messages });
}

// Search Evermind for memories relevant to a student query.
export async function searchMemories(
  query: string,
  limit = 3
): Promise<{ text: string; score: number }[]> {
  const result = (await post("/api/v1/memory/search", { query, limit })) as {
    results?: { text: string; score: number }[];
  } | null;
  return result?.results ?? [];
}
