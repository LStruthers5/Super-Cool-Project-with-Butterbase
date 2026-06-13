"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { loadState, saveState, resetState, blankActivity, type AppState } from "./store";
import type { College, SchoolActivity, StudentProfile, PortfolioReadiness } from "./data";

interface Ctx {
  state: AppState | null;
  setProfile: (p: StudentProfile) => void;
  setOnboarded: (v: boolean) => void;
  toggleActivity: (collegeId: string, key: keyof Omit<SchoolActivity, "collegeId">) => void;
  toggleReadiness: (key: keyof PortfolioReadiness) => void;
  upsertCollege: (c: College) => void;
  reset: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => setState(loadState()), []);
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const ctx: Ctx = {
    state,
    setProfile: (p) => setState((s) => (s ? { ...s, profile: p } : s)),
    setOnboarded: (v) => setState((s) => (s ? { ...s, onboarded: v } : s)),
    toggleActivity: (collegeId, key) =>
      setState((s) => {
        if (!s) return s;
        const cur = s.activity[collegeId] ?? blankActivity(collegeId);
        return { ...s, activity: { ...s.activity, [collegeId]: { ...cur, [key]: !cur[key] } } };
      }),
    toggleReadiness: (key) =>
      setState((s) => (s ? { ...s, readiness: { ...s.readiness, [key]: !s.readiness[key] } } : s)),
    upsertCollege: (c) =>
      setState((s) => {
        if (!s) return s;
        const exists = s.colleges.some((x) => x.id === c.id);
        const colleges = exists ? s.colleges.map((x) => (x.id === c.id ? c : x)) : [...s.colleges, c];
        const activity = s.activity[c.id] ? s.activity : { ...s.activity, [c.id]: blankActivity(c.id) };
        return { ...s, colleges, activity };
      }),
    reset: () => {
      resetState();
      setState(loadState());
    },
  };

  return <AppCtx.Provider value={ctx}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}
