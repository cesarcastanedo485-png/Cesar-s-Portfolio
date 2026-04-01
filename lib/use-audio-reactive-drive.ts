"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

const BASS_BIN_START = 0;
const BASS_BIN_END = 42;
/** Lower gains + slower attack = less “slam” on loud sections; slower release = less dead air in dense mixes. */
const RAW_GAIN = 1.45;
const ATTACK = 0.28;
const RELEASE = 0.11;
const RMS_GAIN = 3.1;
const SPIKE_ATTACK = 0.42;
const SPIKE_RELEASE = 0.32;

export type UseAudioReactiveDriveOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  containerRef: RefObject<HTMLElement | null>;
  /** When false, animation frame loop stops and pulse CSS var resets. */
  analyse: boolean;
  /** Multiply final pulse (0–1) for prefers-reduced-motion without disabling analyser. */
  pulseDampen?: number;
};

/**
 * Wires MediaElementSource → AnalyserNode → destination and drives `--arp-pulse`
 * on `containerRef` from smoothed bass energy (0..1).
 */
export function useAudioReactiveDrive({
  audioRef,
  containerRef,
  analyse,
  pulseDampen = 1,
}: UseAudioReactiveDriveOptions) {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);
  const wiredForAudioRef = useRef<HTMLAudioElement | null>(null);
  const smoothedRef = useRef(0);
  const spikeRef = useRef(0);
  const rafRef = useRef(0);

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || wiredForAudioRef.current === audio) {
      return ctxRef.current;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.62;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    const buf = new ArrayBuffer(analyser.frequencyBinCount);
    freqDataRef.current = new Uint8Array(buf);
    const tbuf = new ArrayBuffer(analyser.fftSize);
    timeDataRef.current = new Uint8Array(tbuf);
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
        el.style.setProperty("--arp-pulse-spike", "0");
      }
      spikeRef.current = 0;
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
          spikeRef.current *= 0.85;
        } else {
          analyser.getByteFrequencyData(
            data as Parameters<AnalyserNode["getByteFrequencyData"]>[0],
          );
          const hi = Math.min(BASS_BIN_END, data.length);
          const n = Math.max(1, hi - BASS_BIN_START);
          let sum = 0;
          for (let i = BASS_BIN_START; i < hi; i++) {
            sum += data[i] ?? 0;
          }
          const fftNorm = (sum / (n * 255)) * RAW_GAIN;

          let rmsNorm = 0;
          const time = timeDataRef.current;
          if (time && time.length === analyser.fftSize) {
            analyser.getByteTimeDomainData(
              time as Parameters<AnalyserNode["getByteTimeDomainData"]>[0],
            );
            let acc = 0;
            for (let i = 0; i < time.length; i++) {
              const v = (time[i]! - 128) / 128;
              acc += v * v;
            }
            rmsNorm = Math.min(1, Math.sqrt(acc / time.length) * RMS_GAIN);
          }

          const raw = Math.min(1, Math.max(fftNorm, rmsNorm * 0.92));
          const prev = smoothedRef.current;
          smoothedRef.current =
            raw > prev
              ? prev * (1 - ATTACK) + raw * ATTACK
              : prev * (1 - RELEASE) + raw * RELEASE;
          const sp = spikeRef.current;
          spikeRef.current =
            raw > sp
              ? sp * (1 - SPIKE_ATTACK) + raw * SPIKE_ATTACK
              : sp * (1 - SPIKE_RELEASE) + raw * SPIKE_RELEASE;
        }
        const out = Math.min(
          1,
          Math.max(0, smoothedRef.current * pulseDampen * 0.72),
        );
        const spikeOut = Math.min(
          1,
          Math.max(0, spikeRef.current * pulseDampen * 0.58),
        );
        target.style.setProperty("--arp-pulse", out.toFixed(4));
        target.style.setProperty("--arp-pulse-spike", spikeOut.toFixed(4));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      smoothedRef.current = 0;
      spikeRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.setProperty("--arp-pulse", "0");
        containerRef.current.style.setProperty("--arp-pulse-spike", "0");
      }
    };
  }, [analyse, audioRef, containerRef, pulseDampen]);

  return { ensureGraph, resumeContext };
}
