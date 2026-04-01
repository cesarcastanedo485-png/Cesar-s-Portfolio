"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const STORAGE_KEY = "cesar-portfolio-progression-v1";
export const MAX_LEVEL = 5;

const LEVEL_ONE_EVENT_TYPES = new Set(["atmosphere-play", "atmosphere-minimize"]);

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
  version: number;
  currentLevel: number;
  levelOneComplete: boolean;
  username: string;
  email: string;
  leads: LeadRecord[];
  briefs: DreamBrief[];
  awardedEventKeys: string[];
  lastAwardedAtMs: number;
};

export type LevelEventInput = {
  type: string;
  key?: string;
  source?: string;
};

export type LevelEventResult = {
  leveled: boolean;
  level: number;
};

type ProgressionContextValue = {
  hydrated: boolean;
  overlayCollapsed: boolean;
  playMode: boolean;
  currentLevel: number;
  maxLevel: number;
  levelOneComplete: boolean;
  canAccessOracle: boolean;
  username: string;
  leads: LeadRecord[];
  briefs: DreamBrief[];
  collapseOverlay: () => void;
  openOverlay: (options?: { openForm?: boolean }) => void;
  startPlay: () => void;
  awardLevelEvent: (input: LevelEventInput) => LevelEventResult;
  submitLevelOne: (input: { username: string; email: string; source?: string }) => void;
  addDreamBrief: (input: Omit<DreamBrief, "id" | "createdAt">) => void;
  exportLeadsCsv: () => void;
};

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

const emptyState: StoredProgression = {
  version: 2,
  currentLevel: 0,
  levelOneComplete: false,
  username: "",
  email: "",
  leads: [],
  briefs: [],
  awardedEventKeys: [],
  lastAwardedAtMs: 0,
};

export function safeParseProgression(raw: string | null): StoredProgression {
  if (!raw) return emptyState;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredProgression> & {
      currentLevel?: unknown;
      awardedEventKeys?: unknown;
      lastAwardedAtMs?: unknown;
      levelOneComplete?: unknown;
      version?: unknown;
    };
    const migratedLevel =
      typeof parsed.currentLevel === "number" && Number.isFinite(parsed.currentLevel)
        ? parsed.currentLevel
        : Boolean(parsed.levelOneComplete)
          ? 1
          : 0;
    const clampedLevel = Math.max(0, Math.min(MAX_LEVEL, Math.round(migratedLevel)));

    return {
      version: typeof parsed.version === "number" ? parsed.version : 2,
      currentLevel: clampedLevel,
      levelOneComplete: clampedLevel >= 1,
      username: parsed.username?.trim() ?? "",
      email: parsed.email?.trim() ?? "",
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      briefs: Array.isArray(parsed.briefs) ? parsed.briefs : [],
      awardedEventKeys: Array.isArray(parsed.awardedEventKeys)
        ? parsed.awardedEventKeys.filter(
            (value): value is string => typeof value === "string" && value.trim().length > 0,
          )
        : [],
      lastAwardedAtMs:
        typeof parsed.lastAwardedAtMs === "number" && Number.isFinite(parsed.lastAwardedAtMs)
          ? parsed.lastAwardedAtMs
          : 0,
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
  /** Start hidden so the level modal does not block the page until atmosphere (or another gate) opens it. */
  const [overlayCollapsed, setOverlayCollapsed] = useState(true);
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

  const awardLevelEvent = useCallback((input: LevelEventInput): LevelEventResult => {
    const type = input.type.trim().toLowerCase();
    const source = input.source?.trim().toLowerCase();
    const rawKey = input.key?.trim().toLowerCase();
    const eventKey = rawKey || [type, source].filter(Boolean).join(":");
    const now = Date.now();
    let result: LevelEventResult = { leveled: false, level: state.currentLevel };

    setState((prev) => {
      if (!type || !eventKey || prev.currentLevel >= MAX_LEVEL) {
        result = { leveled: false, level: prev.currentLevel };
        return prev;
      }
      if (prev.currentLevel === 0 && !LEVEL_ONE_EVENT_TYPES.has(type)) {
        result = { leveled: false, level: prev.currentLevel };
        return prev;
      }
      if (prev.awardedEventKeys.includes(eventKey)) {
        result = { leveled: false, level: prev.currentLevel };
        return prev;
      }
      if (now - prev.lastAwardedAtMs < 420) {
        result = { leveled: false, level: prev.currentLevel };
        return prev;
      }

      const nextLevel = Math.min(MAX_LEVEL, prev.currentLevel + 1);
      result = { leveled: true, level: nextLevel };
      return {
        ...prev,
        version: 2,
        currentLevel: nextLevel,
        levelOneComplete: nextLevel >= 1,
        awardedEventKeys: [...prev.awardedEventKeys, eventKey],
        lastAwardedAtMs: now,
      };
    });

    if (result.leveled) {
      setOverlayCollapsed(false);
    }
    return result;
  }, [state.currentLevel]);

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
        currentLevel: prev.currentLevel === 0 ? 1 : prev.currentLevel,
        levelOneComplete: true,
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        leads: [nextLead, ...prev.leads],
        awardedEventKeys:
          prev.currentLevel === 0
            ? [...prev.awardedEventKeys, "level-one:overlay-submit"]
            : prev.awardedEventKeys,
        lastAwardedAtMs: Date.now(),
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
      currentLevel: state.currentLevel,
      maxLevel: MAX_LEVEL,
      levelOneComplete: state.levelOneComplete,
      canAccessOracle: state.currentLevel >= MAX_LEVEL,
      username: state.username,
      leads: state.leads,
      briefs: state.briefs,
      collapseOverlay,
      openOverlay,
      startPlay,
      awardLevelEvent,
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
      awardLevelEvent,
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

