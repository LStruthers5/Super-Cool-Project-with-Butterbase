"use client";

import { useMemo, useState } from "react";
import type { College } from "@/lib/data";

// Lets the student start with schools they already want by name. Filters the
// recommendation universe; confirmed schools are excluded by the caller. [Luke]

export function SchoolSearch({
  candidates,
  onAdd,
}: {
  candidates: College[]; // universe minus already-confirmed
  onAdd: (c: College) => void;
}) {
  const [q, setQ] = useState("");

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

  return (
    <div className="relative">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Add a school you already want — search by name…"
        className="w-full rounded-xl border border-hair bg-card px-4 py-2.5 text-sm outline-none focus:border-ink transition-colors"
      />
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl border border-hair bg-card shadow-card overflow-hidden">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  onAdd(c);
                  setQ("");
                }}
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
      {q.trim() && matches.length === 0 && (
        <p className="absolute mt-1 text-xs text-muted px-1">No match in the catalog yet.</p>
      )}
    </div>
  );
}
