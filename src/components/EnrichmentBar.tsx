"use client";

export function EnrichmentBar({
  value,
  label,
  tone = "fit",
  height = 28,
}: {
  value: number;
  label?: string;
  tone?: "fit" | "amber" | "ink";
  height?: number;
}) {
  const color = tone === "fit" ? "#0FA47F" : tone === "amber" ? "#E6A23C" : "#14182B";
  const done = value >= 100;
  return (
    <div className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-full bg-hair"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${value}%`, background: done ? "#0FA47F" : color }}
        />
        <div className="absolute inset-0 flex items-center px-3">
          <span className="font-mono text-xs font-bold tabular text-ink/90">
            {value}%{label ? ` ${label}` : done ? " — you're good to go ✓" : " enriched"}
          </span>
        </div>
      </div>
    </div>
  );
}
