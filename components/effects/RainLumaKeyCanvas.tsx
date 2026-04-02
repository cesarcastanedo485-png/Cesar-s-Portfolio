"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, RefObject } from "react";

const MAX_PROCESS_PIXELS = 1_150_000;

type RainLumaKeyCanvasProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  lumaThreshold: number;
  soften: number;
  lumaCeiling: number;
  lumaCeilingSoften: number;
  style?: CSSProperties;
};

function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  tw: number,
  th: number,
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    return;
  }
  const scale = Math.max(tw / vw, th / vh);
  const sw = tw / scale;
  const sh = th / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, tw, th);
}

export function RainLumaKeyCanvas({
  videoRef,
  enabled,
  lumaThreshold,
  soften,
  lumaCeiling,
  lumaCeilingSoften,
  style,
}: RainLumaKeyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    let raf = 0;
    const t0 = Math.max(0, Math.min(1, lumaThreshold)) * 255;
    const soft = Math.max(0, Math.min(1, soften)) * 255;
    const invSoft = soft > 0 ? 255 / soft : 0;
    const hi1 = Math.max(0, Math.min(1, lumaCeiling)) * 255;
    const hiSoft = Math.max(0, Math.min(1, lumaCeilingSoften)) * 255;
    const invHiSoft = hiSoft > 0 ? 255 / hiSoft : 0;
    const useHi = lumaCeiling < 0.999;

    const tick = () => {
      const video = videoRef.current;
      const c = canvasRef.current;
      if (!video || !c || !ctx || video.readyState < 2) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const rect = c.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      let tw = Math.max(1, Math.floor(cssW * dpr));
      let th = Math.max(1, Math.floor(cssH * dpr));
      const pixels = tw * th;
      if (pixels > MAX_PROCESS_PIXELS) {
        const s = Math.sqrt(MAX_PROCESS_PIXELS / pixels);
        tw = Math.max(1, Math.floor(tw * s));
        th = Math.max(1, Math.floor(th * s));
      }

      if (c.width !== tw || c.height !== th) {
        c.width = tw;
        c.height = th;
      }

      drawVideoCover(ctx, video, tw, th);
      const data = ctx.getImageData(0, 0, tw, th);
      const d = data.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i]!;
        const g = d[i + 1]!;
        const b = d[i + 2]!;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        let a = 255;
        if (soft <= 0) {
          if (luma < t0) {
            a = 0;
          }
        } else if (luma < t0) {
          a = 0;
        } else if (luma < t0 + soft) {
          a = Math.min(255, Math.round((luma - t0) * invSoft));
        }

        if (useHi && a > 0) {
          if (hiSoft <= 0) {
            if (luma >= hi1) {
              a = 0;
            }
          } else if (luma >= hi1 + hiSoft) {
            a = 0;
          } else if (luma > hi1) {
            const hiA = Math.min(
              255,
              Math.round((hi1 + hiSoft - luma) * invHiSoft),
            );
            a = Math.min(a, hiA);
          }
        }

        d[i + 3] = a;
      }
      ctx.putImageData(data, 0, 0);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [
    enabled,
    lumaThreshold,
    soften,
    lumaCeiling,
    lumaCeilingSoften,
    videoRef,
  ]);

  if (!enabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="portfolio-rain-canvas pointer-events-none"
      style={style}
      aria-hidden
    />
  );
}
