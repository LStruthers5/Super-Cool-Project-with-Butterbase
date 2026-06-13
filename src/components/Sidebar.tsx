"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Portfolio", hint: "Rec bar / to-dos" },
  { href: "/plan-trip", label: "Plan a Trip", hint: "College road trip" },
  { href: "/onboarding", label: "Profile", hint: "Your survey" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-[230px] shrink-0 border-r border-hair bg-card px-5 py-7 flex flex-col">
      <Link href="/" className="flex items-center gap-2 mb-9">
        <span className="font-mono text-3xl font-bold text-ink leading-none">β</span>
        <span className="font-display text-xl font-bold tracking-tight">Beta</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map((n) => {
          const active = path === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-xl px-3 py-2.5 transition-colors ${
                active ? "bg-ink text-white" : "hover:bg-slatebg text-ink"
              }`}
            >
              <div className="font-display text-sm font-semibold">{n.label}</div>
              <div className={`text-[11px] ${active ? "text-white/60" : "text-muted"}`}>{n.hint}</div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-hair">
        <p className="text-[11px] leading-relaxed text-muted">
          Apply like you&apos;d build a portfolio. Stay <span className="text-fit font-semibold">informed</span> — pop
          the bubble.
        </p>
      </div>
    </aside>
  );
}
