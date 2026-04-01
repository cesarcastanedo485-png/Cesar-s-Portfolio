"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const STORAGE_KEY = "cesar-portfolio-progression-v1";

export type LeadRecord = {
  id: string;
  username: string;
  email: string;
  source: string;
  createdAt: string;
};

export type DreamBrief = {
  id: string;
  type: "app" | "website" | "other";
  vibePrompt: string;
  primaryGoal: string;
  features: string;
  createdAt: string;
};

export type StoredProgression = {
  levelOneComplete: boolean;
  username: string;
  email: string;
  leads: LeadRecord[];
  briefs: DreamBrief[];
};

type ProgressionContextValue = {
  hydrated: boolean;
  overlayCollapsed: boolean;
  playMode: boolean;
  levelOneComplete: boolean;
  username: string;
  leads: LeadRecord[];
  briefs: DreamBrief[];
  collapseOverlay: () => void;
  openOverlay: (options?: { openForm?: boolean }) => void;
  startPlay: () => void;
  submitLevelOne: (input: { username: string; email: string; source?: string }) => void;
  addDreamBrief: (input: Omit<DreamBrief, "id" | "createdAt">) => void;
  exportLeadsCsv: () => void;
};

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

const emptyState: StoredProgression = {
  levelOneComplete: false,
  username: "",
  email: "",
  leads: [],
  briefs: [],
};

export function safeParseProgression(raw: string | null): StoredProgression {
  if (!raw) return emptyState;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredProgression>;
    return {
      levelOneComplete: Boolean(parsed.levelOneComplete),
      username: parsed.username?.trim() ?? "",
      email: parsed.email?.trim() ?? "",
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      briefs: Array.isArray(parsed.briefs) ? parsed.briefs : [],
    };
  } catch {
    return emptyState;
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [overlayCollapsed, setOverlayCollapsed] = useState(false);
  const [playMode, setPlayMode] = useState(false);
  const [state, setState] = useState<StoredProgression>(emptyState);

  useEffect(() => {
    const next = safeParseProgression(window.localStorage.getItem(STORAGE_KEY));
    setState(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const collapseOverlay = useCallback(() => {
    setOverlayCollapsed(true);
  }, []);

  const openOverlay = useCallback((options?: { openForm?: boolean }) => {
    setOverlayCollapsed(false);
    if (options?.openForm) {
      setPlayMode(true);
    }
  }, []);

  const startPlay = useCallback(() => {
    setPlayMode(true);
    setOverlayCollapsed(false);
  }, []);

  const submitLevelOne = useCallback(
    (input: { username: string; email: string; source?: string }) => {
      const createdAt = new Date().toISOString();
      const nextLead: LeadRecord = {
        id: makeId("lead"),
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        source: input.source ?? "level-one",
        createdAt,
      };

      setState((prev) => ({
        ...prev,
        levelOneComplete: true,
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        leads: [nextLead, ...prev.leads],
      }));
      setOverlayCollapsed(true);
      setPlayMode(false);
    },
    [],
  );

  const addDreamBrief = useCallback((input: Omit<DreamBrief, "id" | "createdAt">) => {
    const next: DreamBrief = {
      id: makeId("dream"),
      createdAt: new Date().toISOString(),
      ...input,
    };
    setState((prev) => ({
      ...prev,
      briefs: [next, ...prev.briefs],
    }));
  }, []);

  const exportLeadsCsv = useCallback(() => {
    const rows = [
      ["id", "username", "email", "source", "createdAt"],
      ...state.leads.map((lead) => [
        lead.id,
        lead.username,
        lead.email,
        lead.source,
        lead.createdAt,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [state.leads]);

  const value = useMemo<ProgressionContextValue>(
    () => ({
      hydrated,
      overlayCollapsed,
      playMode,
      levelOneComplete: state.levelOneComplete,
      username: state.username,
      leads: state.leads,
      briefs: state.briefs,
      collapseOverlay,
      openOverlay,
      startPlay,
      submitLevelOne,
      addDreamBrief,
      exportLeadsCsv,
    }),
    [
      hydrated,
      overlayCollapsed,
      playMode,
      state,
      collapseOverlay,
      openOverlay,
      startPlay,
      submitLevelOne,
      addDreamBrief,
      exportLeadsCsv,
    ],
  );

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>;
}

export function useProgression() {
  const ctx = useContext(ProgressionContext);
  if (!ctx) {
    throw new Error("useProgression must be used within ProgressionProvider");
  }
  return ctx;
}

