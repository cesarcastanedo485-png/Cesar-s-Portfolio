"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { submitLeadToBackend } from "@/lib/submit-lead-remote";

export const STORAGE_KEY = "cesar-portfolio-progression-v1";
export const MAX_LEVEL = 5;
/** Oracle chamber link stays locked below this level (independent of future MAX_LEVEL tweaks). */
export const ORACLE_UNLOCK_LEVEL = 5;

/** `null` = visitor has not chosen red vs blue pill yet (first visit). */
export type ExperienceMode = "wonderland" | "matrix" | null;

/** Level 0 can advance via atmosphere *or* vaults / card details (no audio asset required). */
const LEVEL_ONE_EVENT_TYPES = new Set([
  "atmosphere-play",
  "atmosphere-minimize",
  "vault-open",
  "details-expand",
]);

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

export type DiscountClaim = {
  email: string;
  percent: number;
  claimedAt: string;
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
  /** One-time claim for first-site discount (percent locked at submit time). */
  discountClaim: DiscountClaim | null;
  /** Red pill vs blue pill — matrix mode: calm UI, no coupon. */
  experienceMode: ExperienceMode;
};

export type LevelEventInput = {
  type: string;
  key?: string;
  source?: string;
};

export type LevelEventResult = {
  leveled: boolean;
  level: number;
  reason?: string;
};

type ProgressionContextValue = {
  hydrated: boolean;
  overlayCollapsed: boolean;
  playMode: boolean;
  experienceMode: ExperienceMode;
  isMatrixMode: boolean;
  needsExperienceChoice: boolean;
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
  chooseExperience: (mode: Exclude<ExperienceMode, null>) => void;
  /**
   * Saves experience + writes localStorage immediately, then navigates.
   * Use for quick-start links so the next page never sees `experienceMode === null`.
   */
  chooseExperienceAndGo: (mode: Exclude<ExperienceMode, null>, path: string) => void;
  /** Sets experience to `null` so the red/blue pill modal appears again (opt-out / re-choose). */
  reopenExperienceChoice: () => void;
  awardLevelEvent: (input: LevelEventInput) => LevelEventResult;
  submitLevelOne: (input: { username: string; email: string; source?: string }) => void;
  submitDiscountClaim: (input: { email: string; username?: string }) => boolean;
  addDreamBrief: (input: Omit<DreamBrief, "id" | "createdAt">) => void;
  exportLeadsCsv: () => void;
  discountClaim: DiscountClaim | null;
  eligibleDiscountPercent: number;
};

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

export function getEligibleDiscountPercent(level: number): number {
  const n = Math.max(0, Math.min(MAX_LEVEL, Math.round(level)));
  return Math.min(25, n * 5);
}

const emptyState: StoredProgression = {
  version: 4,
  currentLevel: 0,
  levelOneComplete: false,
  username: "",
  email: "",
  leads: [],
  briefs: [],
  awardedEventKeys: [],
  lastAwardedAtMs: 0,
  discountClaim: null,
  experienceMode: null,
};

/** Immediate durable write for pill choice / navigation; avoids mobile races before the debounced effect runs. */
function persistProgressionToStorage(next: StoredProgression): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Private mode / quota / storage disabled (common on mobile Safari) */
  }
}

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

    const rawClaim = (parsed as { discountClaim?: unknown }).discountClaim;
    let discountClaim: DiscountClaim | null = null;
    if (
      rawClaim &&
      typeof rawClaim === "object" &&
      rawClaim !== null &&
      typeof (rawClaim as DiscountClaim).email === "string" &&
      typeof (rawClaim as DiscountClaim).percent === "number" &&
      typeof (rawClaim as DiscountClaim).claimedAt === "string"
    ) {
      discountClaim = {
        email: (rawClaim as DiscountClaim).email.trim().toLowerCase(),
        percent: Math.min(25, Math.max(0, Math.round((rawClaim as DiscountClaim).percent))),
        claimedAt: (rawClaim as DiscountClaim).claimedAt,
      };
    }

    const extended = parsed as { experienceMode?: unknown };
    const hasExperienceKey = Object.prototype.hasOwnProperty.call(extended, "experienceMode");
    const legacyProgress =
      clampedLevel > 0 ||
      Boolean(parsed.levelOneComplete) ||
      (Array.isArray(parsed.awardedEventKeys) && parsed.awardedEventKeys.length > 0) ||
      (Array.isArray(parsed.leads) && parsed.leads.length > 0) ||
      discountClaim !== null;

    let experienceMode: ExperienceMode = null;
    if (hasExperienceKey) {
      const raw = extended.experienceMode;
      if (raw === null) {
        experienceMode = null;
      } else if (typeof raw === "string") {
        const n = raw.trim().toLowerCase();
        if (n === "matrix") experienceMode = "matrix";
        else if (n === "wonderland") experienceMode = "wonderland";
        else experienceMode = legacyProgress ? "wonderland" : null;
      } else {
        experienceMode = legacyProgress ? "wonderland" : null;
      }
    } else {
      /* Saved before experienceMode existed */
      experienceMode = legacyProgress ? "wonderland" : null;
    }

    return {
      version: typeof parsed.version === "number" ? parsed.version : 4,
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
      discountClaim,
      experienceMode,
    };
  } catch {
    return emptyState;
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  /** Start hidden so the level modal does not block the page until atmosphere (or another gate) opens it. */
  const [overlayCollapsed, setOverlayCollapsed] = useState(true);
  const [playMode, setPlayMode] = useState(false);
  const [state, setState] = useState<StoredProgression>(emptyState);
  const stateRef = useRef<StoredProgression>(emptyState);

  useEffect(() => {
    let next = emptyState;
    try {
      const nav = window.performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const navType = nav?.type ?? "unknown";
      const isLocalhost =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const shouldResetForReload = isLocalhost && navType === "reload";
      if (shouldResetForReload) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      next = safeParseProgression(raw);
    } catch {
      /* Storage denied (ITP / embedded / enterprise) — still unlock the client UI */
    }
    setState(next);
    stateRef.current = next;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistProgressionToStorage(state);
    stateRef.current = state;
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

  const chooseExperience = useCallback((mode: Exclude<ExperienceMode, null>) => {
    setState((prev) => {
      let next: StoredProgression;
      if (mode === "matrix") {
        const nextLevel = Math.max(1, prev.currentLevel);
        next = {
          ...prev,
          version: 4,
          experienceMode: "matrix",
          currentLevel: nextLevel,
          levelOneComplete: true,
        };
      } else {
        next = {
          ...prev,
          version: 4,
          experienceMode: "wonderland",
        };
      }
      persistProgressionToStorage(next);
      return next;
    });
  }, []);

  const chooseExperienceAndGo = useCallback(
    (mode: Exclude<ExperienceMode, null>, path: string) => {
      setState((prev) => {
        const next: StoredProgression =
          mode === "matrix"
            ? {
                ...prev,
                version: 4,
                experienceMode: "matrix",
                currentLevel: Math.max(1, prev.currentLevel),
                levelOneComplete: true,
              }
            : {
                ...prev,
                version: 4,
                experienceMode: "wonderland",
              };
        persistProgressionToStorage(next);
        return next;
      });
      router.push(path);
    },
    [router],
  );

  const reopenExperienceChoice = useCallback(() => {
    setState((prev) => {
      const next: StoredProgression = {
        ...prev,
        version: 4,
        experienceMode: null,
      };
      persistProgressionToStorage(next);
      return next;
    });
  }, []);

  const awardLevelEvent = useCallback((input: LevelEventInput): LevelEventResult => {
    const type = input.type.trim().toLowerCase();
    const source = input.source?.trim().toLowerCase();
    const rawKey = input.key?.trim().toLowerCase();
    const eventKey = rawKey || [type, source].filter(Boolean).join(":");
    const now = Date.now();
    const prev = stateRef.current;
    let result: LevelEventResult = { leveled: false, level: prev.currentLevel, reason: "start" };
    let shouldOpenOverlay = false;
    let nextState = prev;

    if (!type || !eventKey || prev.currentLevel >= MAX_LEVEL) {
      result = { leveled: false, level: prev.currentLevel, reason: "invalid-input-or-at-max" };
    } else if (prev.currentLevel === 0 && !LEVEL_ONE_EVENT_TYPES.has(type)) {
      result = { leveled: false, level: prev.currentLevel, reason: "blocked-level-zero-event-type" };
    } else if (prev.awardedEventKeys.includes(eventKey)) {
      result = { leveled: false, level: prev.currentLevel, reason: "duplicate-event-key" };
    } else if (now - prev.lastAwardedAtMs < 140) {
      /** Short cooldown only to debounce duplicate pointer events; keep low so distinct interactions still level you up. */
      result = { leveled: false, level: prev.currentLevel, reason: "cooldown-window" };
    } else {
      const nextLevel = Math.min(MAX_LEVEL, prev.currentLevel + 1);
      result = { leveled: true, level: nextLevel, reason: "leveled" };
      shouldOpenOverlay = prev.experienceMode !== "matrix";
      nextState = {
        ...prev,
        version: 4,
        currentLevel: nextLevel,
        levelOneComplete: nextLevel >= 1,
        awardedEventKeys: [...prev.awardedEventKeys, eventKey],
        lastAwardedAtMs: now,
      };
      setState(nextState);
      stateRef.current = nextState;
    }

    if (result.leveled && shouldOpenOverlay) {
      setOverlayCollapsed(false);
    }
    return result;
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
        version: 4,
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
      submitLeadToBackend(nextLead);
    },
    [],
  );

  const submitDiscountClaim = useCallback((input: { email: string; username?: string }) => {
    const email = input.email.trim().toLowerCase();
    const simple =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!simple) return false;

    let ok = false;
    let capturedLead: LeadRecord | null = null;
    setState((prev) => {
      if (prev.experienceMode === "matrix") return prev;
      if (prev.discountClaim) return prev;
      const percent = getEligibleDiscountPercent(prev.currentLevel);
      if (percent <= 0) return prev;
      const createdAt = new Date().toISOString();
      const username = input.username?.trim() || prev.username || "—";
      const nextLead: LeadRecord = {
        id: makeId("lead"),
        username,
        email,
        source: `first-site-discount-${percent}pct`,
        createdAt,
      };
      ok = true;
      capturedLead = nextLead;
      return {
        ...prev,
        version: 4,
        email: prev.email || email,
        username: prev.username || username,
        discountClaim: { email, percent, claimedAt: createdAt },
        leads: [nextLead, ...prev.leads],
      };
    });
    if (ok) {
      setOverlayCollapsed(true);
      if (capturedLead) submitLeadToBackend(capturedLead);
    }
    return ok;
  }, []);

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
      experienceMode: state.experienceMode,
      isMatrixMode: state.experienceMode === "matrix",
      needsExperienceChoice: hydrated && state.experienceMode === null,
      currentLevel: state.currentLevel,
      maxLevel: MAX_LEVEL,
      levelOneComplete: state.levelOneComplete,
      canAccessOracle: state.currentLevel >= ORACLE_UNLOCK_LEVEL,
      username: state.username,
      leads: state.leads,
      briefs: state.briefs,
      collapseOverlay,
      openOverlay,
      startPlay,
      chooseExperience,
      chooseExperienceAndGo,
      reopenExperienceChoice,
      awardLevelEvent,
      submitLevelOne,
      submitDiscountClaim,
      addDreamBrief,
      exportLeadsCsv,
      discountClaim: state.discountClaim,
      eligibleDiscountPercent:
        state.experienceMode === "matrix" ? 0 : getEligibleDiscountPercent(state.currentLevel),
    }),
    [
      hydrated,
      overlayCollapsed,
      playMode,
      state,
      collapseOverlay,
      openOverlay,
      startPlay,
      chooseExperience,
      chooseExperienceAndGo,
      reopenExperienceChoice,
      awardLevelEvent,
      submitLevelOne,
      submitDiscountClaim,
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

