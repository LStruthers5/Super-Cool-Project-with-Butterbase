"use client";

import type { BetaResult } from "@/lib/beta";

const bucketColor: Record<BetaResult["bucket"], string> = {
  Safety: "#0FA47F",
  Target: "#E6A23C",
  Reach: "#E0533D",
  Reconsider: "#9AA0B4",
};

/**
 * The β gauge — product signature. A ring split into a risk arc and a fit arc,
 * with the β value set in mono at the center (Bloomberg-terminal energy, but
 * friendly). Size scales the whole thing.
 */
export function BetaBadge({ result, size = 64 }: { result: BetaResult; size?: number }) {
  const { beta, admit, fit, bucket } = result;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const fitArc = c * fit; // green portion = potential return
  const riskArc = c * (1 - admit); // colored portion = risk
  const color = bucketColor[bucket];

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E7F0" strokeWidth={5} />
        {/* fit arc (returns) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#0FA47F"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${fitArc} ${c}`}
          opacity={0.35}
        />
        {/* risk arc (overlaid, bucket-colored) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${riskArc} ${c}`}
        />
      </svg>
      <div
        className="font-mono font-bold tabular leading-none"
        style={{ marginTop: -size + size / 2 - 6, fontSize: size * 0.26, color }}
      >
        {beta.toFixed(2)}
      </div>
      <div style={{ marginTop: size / 2 - 2 }} className="text-[10px] uppercase tracking-wider font-semibold" >
        <span style={{ color }}>{bucket}</span>
      </div>
    </div>
  );
}
