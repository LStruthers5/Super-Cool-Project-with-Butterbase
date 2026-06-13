"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import type { StudentProfile } from "@/lib/data";

// "Would you rather" pairs that map to a 0..1 preference, per the design session.
const SLIDERS: { key: keyof StudentProfile; left: string; right: string }[] = [
  { key: "prefLargeSchool", left: "Small, everyone knows you", right: "Big school energy & a packed stadium" },
  { key: "prefUrban", left: "Quiet campus in nature", right: "In the middle of a city" },
  { key: "prefBreadth", left: "Lock in one major now", right: "Explore lots of fields first" },
  { key: "prefVibeIntense", left: "Collaborative & low-key", right: "Intense & pre-professional" },
];

export default function Onboarding() {
  const { state, setProfile, setOnboarded } = useApp();
  const router = useRouter();
  const [draft, setDraft] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (state && !draft) setDraft(state.profile);
  }, [state, draft]);

  if (!draft) return <div className="p-10 text-muted">Loading…</div>;

  const set = (patch: Partial<StudentProfile>) => setDraft({ ...draft, ...patch });

  return (
    <div className="px-8 py-7 max-w-2xl">
      <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">Your profile</p>
      <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Let&apos;s size up your portfolio</h1>
      <p className="text-muted mb-8 text-sm leading-relaxed max-w-lg">
        No vague dropdowns. Just pick a side — these tune your fit scores and personalized admit odds.
      </p>

      {/* Academics */}
      <div className="rounded-2xl border border-hair bg-card shadow-card p-5 mb-6 grid grid-cols-3 gap-4">
        <Field label="Unweighted GPA">
          <input
            type="number"
            step="0.01"
            max={4}
            min={0}
            value={draft.gpa}
            onChange={(e) => set({ gpa: parseFloat(e.target.value) || 0 })}
            className="w-full font-mono text-lg tabular bg-transparent outline-none"
          />
        </Field>
        <Field label="SAT (blank = test-optional)">
          <input
            type="number"
            max={1600}
            min={400}
            value={draft.sat ?? ""}
            onChange={(e) => set({ sat: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full font-mono text-lg tabular bg-transparent outline-none"
          />
        </Field>
        <Field label="Course rigor">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.rigor}
            onChange={(e) => set({ rigor: parseFloat(e.target.value) })}
            className="w-full accent-ink"
          />
        </Field>
      </div>

      {/* Would-you-rather */}
      <div className="space-y-5 mb-8">
        {SLIDERS.map((s) => (
          <div key={s.key} className="rounded-2xl border border-hair bg-card shadow-card p-5">
            <div className="flex justify-between text-sm font-medium mb-3">
              <span className="text-muted max-w-[45%]">{s.left}</span>
              <span className="text-muted max-w-[45%] text-right">{s.right}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={draft[s.key] as number}
              onChange={(e) => set({ [s.key]: parseFloat(e.target.value) } as Partial<StudentProfile>)}
              className="w-full accent-fit h-2"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setProfile(draft);
          setOnboarded(true);
          router.push("/");
        }}
        className="rounded-xl bg-ink text-white px-6 py-3 font-display font-semibold hover:bg-ink/90 transition-colors"
      >
        Build my portfolio →
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold block mb-1">{label}</span>
      {children}
    </label>
  );
}
