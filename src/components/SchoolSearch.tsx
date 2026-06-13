"use client";

import { useMemo, useState } from "react";
import type { College } from "@/lib/data";

// Lets the student start with schools they already want by name.
// If no catalog match is found, offers to source the college via the AI agent.

export function SchoolSearch({
  candidates,
  onAdd,
}: {
  candidates: College[];
  onAdd: (c: College) => void;
}) {
  const [q, setQ] = useState("");
  const [sourcing, setSourcing] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return candidates
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.short.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [q, candidates]);

  const query = q.trim();
  const showSourceOption = query.length >= 3 && matches.length === 0 && !sourcing;

  async function sourceCollege() {
    setSourcing(true);
    setSourceError(null);
    try {
      // Step 1: ask the AI agent to source admissions data for this school name
      const res = await fetch("/api/source-college", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query, location: "" }),
      });
      const sourced = await res.json() as {
        values?: string;
        whyEssayAngle?: string;
        tourUrl?: string;
        verified?: boolean;
        error?: string;
      };

      if (sourced.error) throw new Error(sourced.error);

      // Step 2: build a minimal College object with safe defaults for unknown schools.
      // The student can adjust their profile to tune β after adding.
      const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const college: College = {
        id:             slug,
        name:           query,
        short:          query.split(" ").slice(-1)[0], // last word as chip label
        location:       "",
        acceptanceRate: 0.2,   // neutral default — β will reflect uncertainty
        medianGpa:      3.7,
        medianSat:      1380,
        size:           8000,
        setting:        "suburban",
        breadth:        0.8,
        vibeIntense:    0.5,
        strengths:      [],
        values:         sourced.values,
        whyEssayAngle:  sourced.whyEssayAngle,
        tourUrl:        sourced.tourUrl,
        verified:       sourced.verified ?? false,
      };

      // Step 3: persist to Butterbase colleges table
      fetch("/api/db/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ college, isCatalog: false }),
      });

      onAdd(college);
      setQ("");
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Sourcing failed");
    } finally {
      setSourcing(false);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setSourceError(null); }}
        placeholder="Add a school by name — search catalog or source any college via AI…"
        className="w-full rounded-xl border border-hair bg-card px-4 py-2.5 text-sm outline-none focus:border-ink transition-colors"
      />

      {/* Catalog matches */}
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl border border-hair bg-card shadow-card overflow-hidden">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => { onAdd(c); setQ(""); }}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slatebg transition-colors"
              >
                <span>
                  <span className="font-display font-semibold text-sm">{c.name}</span>
                  <span className="text-xs text-muted ml-2">{c.location}</span>
                </span>
                <span className="text-xs font-semibold text-fit">+ Add</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Source unknown college */}
      {showSourceOption && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-hair bg-card shadow-card overflow-hidden">
          <button
            onClick={sourceCollege}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slatebg transition-colors"
          >
            <span className="min-w-0">
              <span className="font-display font-semibold text-sm block">&ldquo;{query}&rdquo;</span>
              <span className="text-xs text-muted">Not in catalog — source via AI agent</span>
            </span>
            <span className="text-xs font-semibold text-ink shrink-0">Source →</span>
          </button>
        </div>
      )}

      {/* Sourcing spinner */}
      {sourcing && (
        <p className="absolute mt-1 text-xs text-muted px-1">
          Sourcing &ldquo;{query}&rdquo; via Claude + Exa…
        </p>
      )}

      {/* Error */}
      {sourceError && (
        <p className="absolute mt-1 text-xs text-risk px-1">{sourceError}</p>
      )}
    </div>
  );
}
