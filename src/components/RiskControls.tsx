"use client";

import { MIN_SCHOOLS, MAX_SCHOOLS, type RiskSettings } from "@/lib/recommend";

// Two dials that drive the recommendation list: how much risk the student
// will take, and how many schools they're aiming to hold. [Luke]

function toleranceLabel(t: number): string {
  if (t < 0.25) return "Conservative";
  if (t < 0.5) return "Measured";
  if (t < 0.75) return "Ambitious";
  return "Go big";
}

export function RiskControls({
  risk,
  onChange,
}: {
  risk: RiskSettings;
  onChange: (patch: Partial<RiskSettings>) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {/* Risk tolerance */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="tolerance" className="font-display font-semibold text-sm">
            Risk appetite
          </label>
          <span className="font-mono text-xs font-bold text-ink">{toleranceLabel(risk.tolerance)}</span>
        </div>
        <input
          id="tolerance"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={risk.tolerance}
          onChange={(e) => onChange({ tolerance: Number(e.target.value) })}
          className="w-full accent-ink cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-muted mt-0.5">
          <span>Safe, sure picks</span>
          <span>High-upside reaches</span>
        </div>
      </div>

      {/* Target portfolio size */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="targetCount" className="font-display font-semibold text-sm">
            Target portfolio size
          </label>
          <span className="font-mono text-xs font-bold text-ink">{risk.targetCount} schools</span>
        </div>
        <input
          id="targetCount"
          type="range"
          min={MIN_SCHOOLS}
          max={MAX_SCHOOLS}
          step={1}
          value={risk.targetCount}
          onChange={(e) => onChange({ targetCount: Number(e.target.value) })}
          className="w-full accent-ink cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-muted mt-0.5">
          <span>Focused ({MIN_SCHOOLS})</span>
          <span>Wide ({MAX_SCHOOLS})</span>
        </div>
      </div>
    </div>
  );
}
