"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

const BASS_BIN_COUNT = 12;
const RAW_GAIN = 1.85;
const ATTACK = 0.35;
const RELEASE = 0.12;

export type UseAudioReactiveDriveOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  containerRef: RefObject<HTMLElement | null>;
  /** When false, animation frame loop stops and pulse CSS var resets. */
  analyse: boolean;
};

/**
 * Wires MediaElementSource → AnalyserNode → destination and drives `--arp-pulse`
 * on `containerRef` from smoothed bass energy (0..1).
 */
export function useAudioReactiveDrive({
  audioRef,
  containerRef,
  analyse,
}: UseAudioReactiveDriveOptions) {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const wiredForAudioRef = useRef<HTMLAudioElement | null>(null);
  const smoothedRef = useRef(0);
  const rafRef = useRef(0);

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || wiredForAudioRef.current === audio) {
      return ctxRef.current;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.55;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    const buf = new ArrayBuffer(analyser.frequencyBinCount);
    freqDataRef.current = new Uint8Array(buf);
    wiredForAudioRef.current = audio;
    return ctx;
  }, [audioRef]);

  const resumeContext = useCallback(async () => {
    const ctx = ctxRef.current;
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!analyse) {
      cancelAnimationFrame(rafRef.current);
      smoothedRef.current = 0;
      if (el) {
        el.style.setProperty("--arp-pulse", "0");
      }
      return;
    }

    const tick = () => {
      const analyser = analyserRef.current;
      const data = freqDataRef.current;
      const target = containerRef.current;
      const audio = audioRef.current;

      if (analyser && data && target) {
        if (audio?.paused) {
          const prev = smoothedRef.current;
          smoothedRef.current = prev * 0.9;
        } else {
          analyser.getByteFrequencyData(
            data as Parameters<AnalyserNode["getByteFrequencyData"]>[0],
          );
          let sum = 0;
          const n = Math.min(BASS_BIN_COUNT, data.length);
          for (let i = 0; i < n; i++) {
            sum += data[i] ?? 0;
          }
          const raw = Math.min(
            1,
            (sum / (n * 255)) * RAW_GAIN,
          );
          const prev = smoothedRef.current;
          smoothedRef.current =
            raw > prev
              ? prev * (1 - ATTACK) + raw * ATTACK
              : prev * (1 - RELEASE) + raw * RELEASE;
        }
        target.style.setProperty(
          "--arp-pulse",
          smoothedRef.current.toFixed(4),
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      smoothedRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.setProperty("--arp-pulse", "0");
      }
    };
  }, [analyse, audioRef, containerRef]);

  return { ensureGraph, resumeContext };
}
