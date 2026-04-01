"use client";

import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookMarked,
  ChevronDown,
  Clock,
  Key,
  Lock,
  Rabbit,
} from "lucide-react";
import { BrandWatermark } from "@/components/brand/BrandWatermark";
import { site, type WonderlandVaultCopy } from "@/lib/content";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";
import {
  GamesVaultPortalRings,
  WorkVaultKeyholePlate,
  WorkVaultMechanismFrame,
} from "@/components/wonderland/vault-mechanisms";

type WonderlandVaultProps = {
  variant: "work" | "games";
  panelId: string;
  copy: WonderlandVaultCopy;
  overview?: string;
  /** Strip decorative chrome in the sealed state: folio = key + keyhole + copy; games = title + spiral only */
  minimalClosedLayout?: boolean;
  children: React.ReactNode;
};

/**
 * Always starts sealed: open only after explicit interaction (every page load).
 * Work = brass folio + keyhole; Games = portal rings + pocket-watch cue.
 */
export function WonderlandVault({
  variant,
  panelId,
  copy,
  overview,
  minimalClosedLayout = false,
  children,
}: WonderlandVaultProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [turnProgress, setTurnProgress] = useState(0);
  const [turning, setTurning] = useState(false);
  const [turnHint, setTurnHint] = useState(
    "Start at the bottom of the dial, then rotate counterclockwise.",
  );
  const [rabbitProgress, setRabbitProgress] = useState(0);
  const [rabbitTurning, setRabbitTurning] = useState(false);
  const [rabbitHint, setRabbitHint] = useState(
    "Trace the spiral with the rabbit token to open.",
  );
  const dialRef = useRef<HTMLButtonElement>(null);
  const rabbitDialRef = useRef<HTMLButtonElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const rabbitPointerRef = useRef<number | null>(null);
  const lastAngleRef = useRef(0);
  const rabbitLastAngleRef = useRef(0);
  const progressRef = useRef(0);
  const rabbitProgressRef = useRef(0);
  const milestoneRef = useRef(0);
  const rabbitMilestoneRef = useRef(0);
  const sealedSurfaceRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [inViewport, setInViewport] = useState(false);

  const isWork = variant === "work";
  const minimal = minimalClosedLayout;
  const hideWorkChrome = minimal && isWork;
  const hideGamesChrome = minimal && !isWork;
  const { awardLevelEvent } = useProgression();
  const wm = site.watermark;
  const hint =
    copy.accessHint?.trim() ||
    (isWork
      ? "Work samples are hidden until you open this control."
      : "Games are hidden until you open this control.");
  const keyTurnThresholdDeg = 220;

  useEffect(() => {
    const el = sealedSurfaceRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInViewport(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0];
        if (!hit) return;
        const ratio = hit.intersectionRatio;
        const rect = hit.boundingClientRect;
        const vh =
          typeof window !== "undefined" ? window.innerHeight : rect.height;
        const centerBias =
          rect.top < vh * 0.88 && rect.bottom > vh * 0.12;
        setInViewport(ratio >= 0.14 && centerBias);
      },
      { threshold: [0, 0.08, 0.14, 0.25, 0.45], rootMargin: "12% 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const clearTurnSession = useCallback(() => {
    activePointerRef.current = null;
    setTurning(false);
  }, []);

  const applyTurnProgress = useCallback(
    (deltaDeg: number) => {
      if (!isWork || open) return;
      const nextDeg = Math.min(
        keyTurnThresholdDeg,
        progressRef.current + Math.max(0, deltaDeg),
      );
      progressRef.current = nextDeg;
      const ratio = nextDeg / keyTurnThresholdDeg;
      setTurnProgress(ratio);

      const milestone = Math.floor(ratio * 4);
      if (milestone > milestoneRef.current && milestone < 4) {
        milestoneRef.current = milestone;
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(8);
        }
      }

      if (nextDeg >= keyTurnThresholdDeg) {
        setTurnHint("Unlocked. The folio is open.");
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([12, 20, 16]);
        }
        awardLevelEvent({
          type: "vault-open",
          key: "vault-open:work",
          source: "work",
        });
        setOpen(true);
        clearTurnSession();
      }
    },
    [awardLevelEvent, clearTurnSession, isWork, open],
  );

  const angleFromPointer = useCallback(
    (e: React.PointerEvent) => {
      const el = dialRef.current;
      if (!el) {
        return 0;
      }
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    },
    [],
  );

  const onDialPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!isWork || open) return;
      const el = dialRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distance = Math.hypot(dx, dy);
      const minRing = rect.width * 0.21;
      const maxRing = rect.width * 0.49;
      const startsNearBottom = dy > -rect.height * 0.04;

      if (!startsNearBottom || distance < minRing || distance > maxRing) {
        setTurnHint("Start at the bottom of the ring, then sweep counterclockwise.");
        return;
      }

      e.preventDefault();
      activePointerRef.current = e.pointerId;
      lastAngleRef.current = angleFromPointer(e);
      setTurning(true);
      setTurnHint("Good — keep rotating counterclockwise.");
      el.setPointerCapture(e.pointerId);
    },
    [angleFromPointer, isWork, open],
  );

  const onDialPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!isWork || open || activePointerRef.current !== e.pointerId) return;
      const current = angleFromPointer(e);
      let delta = current - lastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastAngleRef.current = current;

      // On screen coordinates, counterclockwise movement reduces atan2 angle.
      const ccwDelta = Math.max(0, -delta);
      applyTurnProgress(Math.min(ccwDelta, 26));
    },
    [angleFromPointer, applyTurnProgress, isWork, open],
  );

  const onDialPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (activePointerRef.current !== e.pointerId) return;
      clearTurnSession();
      if (!open && progressRef.current < keyTurnThresholdDeg * 0.45) {
        setTurnHint("Almost there — begin at the bottom and sweep left.");
      }
    },
    [clearTurnSession, open],
  );

  const onSealVault = useCallback(() => {
    setOpen(false);
    setTurnProgress(0);
    progressRef.current = 0;
    milestoneRef.current = 0;
    setTurnHint("Start at the bottom of the dial, then rotate counterclockwise.");
    setRabbitProgress(0);
    rabbitProgressRef.current = 0;
    rabbitMilestoneRef.current = 0;
    setRabbitHint("Trace the spiral with the rabbit token to open.");
  }, []);

  const onDialKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isWork || open) return;
      if (e.key === "ArrowLeft" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        applyTurnProgress(42);
        setTurnHint("Keyboard: keep pressing to finish the turn.");
      }
    },
    [applyTurnProgress, isWork, open],
  );

  const clearRabbitTurnSession = useCallback(() => {
    rabbitPointerRef.current = null;
    setRabbitTurning(false);
  }, []);

  const rabbitThresholdDeg = 240;
  const rabbitApplyProgress = useCallback(
    (deltaDeg: number) => {
      if (isWork || open) return;
      const nextDeg = Math.min(
        rabbitThresholdDeg,
        rabbitProgressRef.current + Math.max(0, deltaDeg),
      );
      rabbitProgressRef.current = nextDeg;
      const ratio = nextDeg / rabbitThresholdDeg;
      setRabbitProgress(ratio);

      const milestone = Math.floor(ratio * 4);
      if (milestone > rabbitMilestoneRef.current && milestone < 4) {
        rabbitMilestoneRef.current = milestone;
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(7);
        }
      }

      if (nextDeg >= rabbitThresholdDeg) {
        setRabbitHint("Open — you dropped through the rabbit hole.");
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([10, 18, 12]);
        }
        awardLevelEvent({
          type: "vault-open",
          key: "vault-open:games",
          source: "games",
        });
        setOpen(true);
        clearRabbitTurnSession();
      }
    },
    [awardLevelEvent, clearRabbitTurnSession, isWork, open],
  );

  const rabbitAngleFromPointer = useCallback((e: React.PointerEvent) => {
    const el = rabbitDialRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  }, []);

  const onRabbitPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (isWork || open) return;
      const el = rabbitDialRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distance = Math.hypot(dx, dy);
      const minRing = rect.width * 0.16;
      const maxRing = rect.width * 0.5;
      if (distance < minRing || distance > maxRing) {
        setRabbitHint("Touch on the spiral ring, then trace inward.");
        return;
      }
      e.preventDefault();
      rabbitPointerRef.current = e.pointerId;
      rabbitLastAngleRef.current = rabbitAngleFromPointer(e);
      setRabbitTurning(true);
      setRabbitHint("Good — keep spiraling inward.");
      rabbitDialRef.current?.setPointerCapture(e.pointerId);
    },
    [isWork, open, rabbitAngleFromPointer],
  );

  const onRabbitPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (isWork || open || rabbitPointerRef.current !== e.pointerId) return;
      e.preventDefault();
      const current = rabbitAngleFromPointer(e);
      let delta = current - rabbitLastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      rabbitLastAngleRef.current = current;
      rabbitApplyProgress(Math.min(28, Math.max(0, -delta)));
    },
    [isWork, open, rabbitAngleFromPointer, rabbitApplyProgress],
  );

  const onRabbitPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (rabbitPointerRef.current !== e.pointerId) return;
      clearRabbitTurnSession();
      if (!open && rabbitProgressRef.current < rabbitThresholdDeg * 0.35) {
        setRabbitHint("Keep tracing the spiral to drop deeper.");
      }
    },
    [clearRabbitTurnSession, open],
  );

  const rabbitTokenStyle = useMemo(() => {
    const turns = 1.3 - rabbitProgress * 0.9;
    const angle = -90 + rabbitProgress * 315;
    const rad = (angle * Math.PI) / 180;
    const radius = 31 * turns;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    return {
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
    };
  }, [rabbitProgress]);

  const gestureActive = turning || rabbitTurning;
  const progressNorm = Math.max(turnProgress, rabbitProgress);
  const interacting = gestureActive || progressNorm > 0.02;

  const sealedBackdropOpacity = useMemo(() => {
    const idleHidden = 0.04;
    const idleRevealed = 0.2;
    const base = inViewport ? idleRevealed : idleHidden;
    if (!interacting) return base;
    const depth = Math.min(
      1,
      Math.max(progressNorm, gestureActive ? 0.28 : 0),
    );
    const target = 0.06 + depth * 0.9;
    return Math.min(0.96, Math.max(base, target));
  }, [gestureActive, inViewport, interacting, progressNorm]);

  const orbSoftness = useMemo(() => {
    if (!inViewport) return 0.2;
    if (interacting) return 1;
    return 0.35;
  }, [inViewport, interacting]);

  return (
    <div className="space-y-5">
      <span id={hintId} className="sr-only">
        {hint}
      </span>
      {!open ? (
        <motion.div
          ref={sealedSurfaceRef}
          layout={false}
          whileHover={reduceMotion ? undefined : { scale: 1.006 }}
          whileTap={reduceMotion ? undefined : { scale: 0.995 }}
          transition={{ type: "spring", stiffness: 520, damping: 28 }}
          className={cn(
            "vault-sealed-surface group relative w-full overflow-hidden rounded-2xl border text-left",
            isWork ? "border-cyan-500/35" : "border-amber-400/35",
            gestureActive && "touch-none",
          )}
          style={gestureActive ? ({ touchAction: "none" } as CSSProperties) : undefined}
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-0 bg-gradient-to-br transition-opacity duration-500 ease-out motion-reduce:transition-none",
              isWork
                ? "from-[#0c1224] via-[#080d18] to-[#050810]"
                : "from-[#1a1208] via-[#100a06] to-[#050810]",
            )}
            style={{
              opacity: reduceMotion ? Math.max(sealedBackdropOpacity, 0.35) : sealedBackdropOpacity,
            }}
            aria-hidden
          />
          <WorkVaultMechanismFrame />
          {isWork ? (
            <WorkVaultKeyholePlate />
          ) : hideGamesChrome ? null : (
            <GamesVaultPortalRings />
          )}

          {!hideWorkChrome ? (
            <span
              className="pointer-events-none absolute right-3 top-2.5 font-serif text-lg leading-none text-white/[0.11] sm:right-4 sm:top-3 sm:text-xl"
              aria-hidden
            >
              ♠
            </span>
          ) : null}
          {isWork && !hideWorkChrome ? (
            <div
              className="pointer-events-none absolute right-[5.25rem] top-1/2 hidden -translate-y-1/2 md:flex md:items-center md:justify-center lg:right-[6.25rem]"
              aria-hidden
            >
              <div className="relative flex size-11 items-center justify-center rounded-full border-2 border-rose-900/75 bg-gradient-to-br from-rose-950 via-red-950 to-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_16px_rgba(0,0,0,0.55)] ring-1 ring-rose-600/35">
                <div className="absolute inset-[5px] rounded-full border border-rose-950/60 bg-black/25" />
                <span className="relative text-[11px] text-rose-100/75">✦</span>
              </div>
            </div>
          ) : null}
          <div
            className={cn(
              "pointer-events-none absolute -right-16 -top-20 z-[1] size-[min(55vw,280px)] rounded-full blur-3xl transition-opacity duration-500 ease-out motion-reduce:transition-none",
              isWork ? "bg-cyan-500/25" : "bg-amber-500/20"
            )}
            style={{ opacity: 0.4 * orbSoftness }}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute -bottom-24 -left-12 z-[1] size-[min(48vw,220px)] rounded-full blur-3xl transition-opacity duration-500 ease-out motion-reduce:transition-none",
              isWork ? "bg-fuchsia-600/20" : "bg-emerald-600/18"
            )}
            style={{ opacity: 0.35 * orbSoftness }}
            aria-hidden
          />

          <div className="relative z-[2] flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
            {!minimal ? (
              <div className="relative shrink-0">
                {!isWork ? (
                  <div
                    className="pointer-events-none absolute -top-8 left-1/2 flex -translate-x-1/2 gap-1.5"
                    aria-hidden
                  >
                    <div className="vault-tea-steam-wisp h-7 w-px rounded-full bg-gradient-to-t from-amber-200/55 via-amber-100/25 to-transparent" />
                    <div className="vault-tea-steam-wisp h-9 w-px rounded-full bg-gradient-to-t from-amber-200/50 via-amber-100/20 to-transparent" />
                    <div className="vault-tea-steam-wisp h-6 w-px rounded-full bg-gradient-to-t from-amber-200/45 via-amber-50/15 to-transparent" />
                  </div>
                ) : null}
                <div
                  className={cn(
                    "relative flex size-16 items-center justify-center rounded-2xl border shadow-inner sm:size-[4.5rem]",
                    isWork
                      ? "border-cyan-400/30 bg-black/50 text-cyan-200/90"
                      : "border-amber-400/30 bg-black/50 text-amber-200/90"
                  )}
                  aria-hidden
                >
                  {!isWork ? (
                    <Clock
                      className="absolute -right-1 -top-1 size-5 text-amber-200/55 sm:size-5"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  ) : null}
                  {isWork ? (
                    <BookMarked className="size-8 sm:size-9" strokeWidth={1.25} />
                  ) : (
                    <Rabbit className="size-8 sm:size-9" strokeWidth={1.25} />
                  )}
                </div>
              </div>
            ) : null}

            <div className="min-w-0 flex-1 space-y-2">
              <p
                className={cn(
                  hideGamesChrome
                    ? "vault-neon-instruction text-lg font-normal tracking-wide sm:text-xl"
                    : cn(
                        "font-serif text-xl font-medium tracking-tight sm:text-2xl",
                        isWork ? "text-cyan-100/95" : "text-amber-50/95"
                      ),
                )}
              >
                {copy.teaserTitle}
              </p>
              {copy.teaserBody?.trim() ? (
                <p className="vault-neon-instruction text-sm leading-relaxed sm:text-base">
                  {copy.teaserBody}
                </p>
              ) : null}
              {copy.footnote?.trim() ? (
                <p className="vault-neon-instruction text-xs sm:text-sm">
                  {copy.footnote}
                </p>
              ) : null}
              {overview ? (
                <p className="text-xs leading-relaxed text-white/58">{overview}</p>
              ) : null}
            </div>

            {isWork ? (
              <div className="flex shrink-0 flex-col items-center gap-2 self-start sm:self-center">
                <button
                  ref={dialRef}
                  type="button"
                  onPointerDown={onDialPointerDown}
                  onPointerMove={onDialPointerMove}
                  onPointerUp={onDialPointerUp}
                  onPointerCancel={onDialPointerUp}
                  onLostPointerCapture={clearTurnSession}
                  onKeyDown={onDialKeyDown}
                  aria-label={copy.ctaClosed}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(turnProgress * 100)}
                  aria-describedby={hintId}
                  className="relative z-[3] size-24 touch-none rounded-full border border-cyan-300/35 bg-black/45 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_22px_rgba(34,211,238,0.2)] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70 active:scale-[0.98]"
                  style={{
                    backgroundImage: `conic-gradient(from -90deg, rgba(34,211,238,0.85) ${
                      turnProgress * 360
                    }deg, rgba(8,16,32,0.25) 0deg)`,
                  }}
                >
                  <span className="absolute inset-[5px] rounded-full border border-cyan-100/18 bg-[#020711]/85" />
                  <span className="absolute left-1/2 top-[10%] h-2 w-px -translate-x-1/2 bg-cyan-200/60" />
                  <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/45 bg-cyan-950/40">
                    <Key
                      className={cn(
                        "size-4 transition-transform",
                        turning ? "-rotate-12" : "rotate-0",
                      )}
                      aria-hidden
                    />
                  </span>
                  <span className="absolute bottom-[6%] left-1/2 h-3 w-6 -translate-x-1/2 rounded-full border border-cyan-200/35 bg-cyan-100/10" />
                </button>
                <p className="vault-neon-instruction max-w-36 text-center text-[11px] leading-snug">
                  {Math.round(turnProgress * 100)}% turned
                </p>
              </div>
            ) : (
              <div className="flex shrink-0 flex-col items-center gap-2 self-start sm:self-center">
                <button
                  ref={rabbitDialRef}
                  type="button"
                  onPointerDown={onRabbitPointerDown}
                  onPointerMove={onRabbitPointerMove}
                  onPointerUp={onRabbitPointerUp}
                  onPointerCancel={onRabbitPointerUp}
                  onLostPointerCapture={clearRabbitTurnSession}
                  aria-expanded={false}
                  aria-controls={panelId}
                  aria-describedby={hintId}
                  aria-label={`${copy.ctaClosed}: ${copy.teaserTitle}`}
                  className="relative z-[3] size-24 touch-none rounded-full border border-amber-300/35 bg-black/45 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_24px_rgba(251,191,36,0.16)] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/70 active:scale-[0.98]"
                >
                  <span className="absolute inset-[5px] rounded-full border border-amber-100/16 bg-[#0a0704]/90" />
                  <span
                    className={cn(
                      "absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-amber-300/32",
                      rabbitTurning && "opacity-95",
                    )}
                  />
                  <span
                    className="absolute left-1/2 top-1/2 h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-amber-300/24"
                    aria-hidden
                  />
                  <span
                    className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/22"
                    aria-hidden
                  />
                  <span
                    className="absolute left-1/2 top-1/2 flex size-6 items-center justify-center rounded-full border border-amber-200/45 bg-amber-950/65 text-amber-100 shadow-sm"
                    style={rabbitTokenStyle}
                    aria-hidden
                  >
                    <Rabbit className="size-3.5" />
                  </span>
                </button>
                <p className="vault-neon-instruction max-w-36 text-center text-[11px] leading-snug">
                  {Math.round(rabbitProgress * 100)}% descended
                </p>
              </div>
            )}
          </div>
          {isWork ? (
            <div className="relative z-[2] px-6 pb-6 sm:px-8">
              <p className="vault-neon-instruction text-xs sm:text-sm">{turnHint}</p>
            </div>
          ) : (
            <div className="relative z-[2] px-6 pb-6 sm:px-8">
              <p className="vault-neon-instruction text-xs sm:text-sm">{rabbitHint}</p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={cn(
                "text-xs font-medium uppercase tracking-[0.18em]",
                isWork ? "text-cyan-200/55" : "text-amber-200/55"
              )}
            >
              {isWork ? "Latch released" : "Passage open"}
            </p>
            <button
              type="button"
              onClick={onSealVault}
              aria-controls={panelId}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                isWork
                  ? "border-white/15 bg-white/5 text-cyan-100/85 hover:border-cyan-500/35 hover:bg-cyan-950/25 focus-visible:outline-cyan-400/60"
                  : "border-white/15 bg-white/5 text-amber-100/85 hover:border-amber-500/35 hover:bg-amber-950/25 focus-visible:outline-amber-400/60"
              )}
            >
              <Lock className="size-3.5" aria-hidden />
              {copy.ctaOpen}
            </button>
          </div>

          <motion.div
            id={panelId}
            role="region"
            aria-label={copy.teaserTitle}
            className="relative isolate"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {wm?.imageSrc?.trim() ? (
              <div
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                aria-hidden
              >
                <BrandWatermark
                  src={wm.imageSrc}
                  alt={wm.alt}
                  decorative={wm.decorative !== false}
                  className="absolute bottom-1 right-1 w-[min(46vw,260px)] max-w-[88%]"
                  opacityClassName={isWork ? "opacity-[0.09]" : "opacity-[0.1]"}
                />
              </div>
            ) : null}
            <div className="relative z-[1]">{children}</div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
