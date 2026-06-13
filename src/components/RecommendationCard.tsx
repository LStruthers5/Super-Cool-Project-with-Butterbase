"use client";

import { BetaBadge } from "@/components/BetaBadge";
import type { Recommendation } from "@/lib/recommend";

// One recommended school the student can confirm into their portfolio. [Luke]

export function RecommendationCard({
  rec,
  onAdd,
}: {
  rec: Recommendation;
  onAdd: () => void;
}) {
  const { college, result, why, discovery } = rec;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-hair bg-card shadow-card px-5 py-4">
      <div className="shrink-0">
        <BetaBadge result={result} size={56} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold">{college.name}</span>
          <span className="text-xs text-muted">{college.location}</span>
          {discovery && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-fit bg-fitsoft px-2 py-0.5 rounded">
              Off your radar
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">{why}</p>
        <div className="flex gap-4 mt-1.5 text-[11px]">
          <span className="text-muted">
            Your odds{" "}
            <span className="font-mono font-bold" style={{ color: "#E6A23C" }}>
              {Math.round(result.admit * 100)}%
            </span>
          </span>
          <span className="text-muted">
            Fit{" "}
            <span className="font-mono font-bold text-fit">
              {Math.round(result.fit * 100)}%
            </span>
          </span>
          <span className="text-muted">
            Bucket{" "}
            <span className="font-semibold text-ink">{result.bucket}</span>
          </span>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="shrink-0 rounded-xl bg-ink text-white px-4 py-2 text-sm font-display font-semibold hover:bg-ink/90 transition-colors"
      >
        + Add
      </button>
    </div>
  );
}
