"use client";

import { useState } from "react";
import {
  KIND_META,
  type AlphaLead,
  type AlphaLeadStatus,
} from "./alpha-data";

// The Alpha Inbox: sourced opportunities the student triages into their plan.
// Lead state is owned by the dashboard (page.tsx) so progress + next-actions
// react to it. [Claude / UI lane]

type Filter = "active" | "new" | "accepted" | "converted" | "dismissed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "new", label: "New" },
  { key: "accepted", label: "In plan" },
  { key: "converted", label: "Captured" },
  { key: "dismissed", label: "Dismissed" },
];

export function AlphaInbox({
  leads,
  onSetStatus,
}: {
  leads: AlphaLead[];
  onSetStatus: (id: string, status: AlphaLeadStatus) => void;
}) {
  const [filter, setFilter] = useState<Filter>("active");

  const count = (f: Filter) =>
    f === "active"
      ? leads.filter((l) => l.status === "new" || l.status === "accepted").length
      : leads.filter((l) => l.status === f).length;

  const shown = leads.filter((l) =>
    filter === "active" ? l.status === "new" || l.status === "accepted" : l.status === filter
  );

  const newCount = count("new");

  return (
    <div className="rounded-2xl border border-hair bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold tracking-tight">Alpha Inbox</h2>
          {newCount > 0 && (
            <span className="rounded-full bg-ink text-white text-[11px] font-bold px-2 py-0.5">
              {newCount} new
            </span>
          )}
        </div>
        <span className="text-xs text-muted">Sourced opportunities that move your application</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-5 pb-3 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-ink text-white"
                : "bg-slatebg text-muted hover:text-ink"
            }`}
          >
            {f.label} {count(f.key) > 0 && <span className="tabular">({count(f.key)})</span>}
          </button>
        ))}
      </div>

      <div className="border-t border-hair">
        {shown.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          shown.map((lead) => <LeadRow key={lead.id} lead={lead} onSetStatus={onSetStatus} />)
        )}
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  onSetStatus,
}: {
  lead: AlphaLead;
  onSetStatus: (id: string, status: AlphaLeadStatus) => void;
}) {
  const meta = KIND_META[lead.kind];
  const isNew = lead.status === "new";
  const isAccepted = lead.status === "accepted";
  const isConverted = lead.status === "converted";

  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 border-b border-hair last:border-0 transition-colors ${
        isNew ? "bg-card" : isConverted ? "bg-fitsoft/40" : "bg-slatebg/40"
      }`}
    >
      <div className={`shrink-0 mt-[18px] h-2 w-2 rounded-full ${meta.dot}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider font-bold ${meta.text}`}>{meta.label}</span>
          {lead.school && <span className="text-[10px] text-muted font-semibold">· {lead.school}</span>}
          {lead.due && (
            <span className="text-[10px] font-bold text-risk bg-risksoft rounded px-1.5 py-0.5">
              due {lead.due}
            </span>
          )}
          {isNew && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-white bg-ink rounded px-1.5 py-0.5">
              new
            </span>
          )}
          {isConverted && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-fit">✓ captured</span>
          )}
        </div>
        <p className={`font-display font-bold mt-0.5 ${isConverted ? "line-through text-muted" : ""}`}>
          {lead.title}
        </p>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">{lead.detail}</p>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-mono font-bold text-fit tabular">+{lead.impact} strength</span>
          <span className="text-muted">·</span>
          {/* actions per state */}
          {isNew && (
            <>
              <button
                onClick={() => onSetStatus(lead.id, "accepted")}
                className="rounded-lg bg-ink text-white px-3 py-1 text-xs font-semibold hover:bg-ink/90 transition-colors"
              >
                {lead.cta}
              </button>
              <button
                onClick={() => onSetStatus(lead.id, "dismissed")}
                className="rounded-lg border border-hair text-muted px-3 py-1 text-xs font-medium hover:text-ink transition-colors"
              >
                Dismiss
              </button>
            </>
          )}
          {isAccepted && (
            <>
              <button
                onClick={() => onSetStatus(lead.id, "converted")}
                className="rounded-lg bg-fit text-white px-3 py-1 text-xs font-semibold hover:opacity-90 transition-colors"
              >
                Mark done
              </button>
              <button
                onClick={() => onSetStatus(lead.id, "new")}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                Back to new
              </button>
            </>
          )}
          {isConverted && (
            <button
              onClick={() => onSetStatus(lead.id, "accepted")}
              className="text-xs text-muted hover:text-ink transition-colors"
            >
              Undo
            </button>
          )}
          {lead.status === "dismissed" && (
            <button
              onClick={() => onSetStatus(lead.id, "new")}
              className="text-xs text-muted hover:text-ink transition-colors"
            >
              Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const copy: Record<Filter, string> = {
    active: "Inbox zero. Every sourced opportunity is triaged — nice work.",
    new: "No new leads right now. The sourcing agent will drop more here.",
    accepted: "Nothing in your plan yet. Accept a lead to start working it.",
    converted: "No captured wins yet. Mark a lead done to bank the strength.",
    dismissed: "Nothing dismissed.",
  };
  return <div className="px-5 py-8 text-center text-sm text-muted">{copy[filter]}</div>;
}
