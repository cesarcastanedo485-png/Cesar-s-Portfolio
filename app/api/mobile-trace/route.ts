import { NextResponse } from "next/server";
import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { Redis } from "@upstash/redis";

const MAX_TUNE_JSON_CHARS = 120_000;
/** Seconds — trace payloads expire from KV to limit retention. */
const KV_TTL_SECONDS = 86_400;

type TracePayload = {
  trace?: string[];
  /** Parsed ARP tune from localStorage (`arp-mobile-tune-v1`), optional. */
  tune?: unknown;
  context?: {
    route?: string;
    userAgent?: string;
    timestamp?: number;
  };
};

export type MobileTraceStore = {
  id: string;
  trace: string[];
  tune?: unknown;
  context: TracePayload["context"];
  receivedAt: number;
};

function getTraceRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return null;
  }
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

function sanitizeTuneForStore(raw: unknown): unknown | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  let serialized: string;
  try {
    serialized = typeof raw === "string" ? raw : JSON.stringify(raw);
  } catch {
    return undefined;
  }
  if (serialized.length > MAX_TUNE_JSON_CHARS) {
    return {
      _error: "tune_payload_too_large",
      maxChars: MAX_TUNE_JSON_CHARS,
      truncatedPreview: serialized.slice(0, 2000),
    };
  }
  if (typeof raw === "object") {
    return raw;
  }
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

declare global {
  // eslint-disable-next-line no-var
  var __mobileTraceStore: MobileTraceStore | undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TracePayload;
    const trace = Array.isArray(body.trace)
      ? body.trace.filter((line): line is string => typeof line === "string").slice(-120)
      : [];
    const tune = sanitizeTuneForStore(body.tune);
    if (!trace.length && tune === undefined) {
      return NextResponse.json(
        { ok: false, error: "missing trace lines and tune" },
        { status: 400 },
      );
    }
    if (!trace.length) {
      trace.push("(no trace lines; tune snapshot only)");
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const store: MobileTraceStore = {
      id,
      trace,
      ...(tune !== undefined ? { tune } : {}),
      context: body.context ?? {},
      receivedAt: Date.now(),
    };
    globalThis.__mobileTraceStore = store;

    let persistedToKv = false;
    const redis = getTraceRedis();
    if (redis) {
      try {
        await redis.set(`mtrace:${id}`, store, { ex: KV_TTL_SECONDS });
        persistedToKv = true;
      } catch {
        persistedToKv = false;
      }
    }

    // #region agent log
    try {
      await appendFile(
        join(process.cwd(), "debug-d3e82a.log"),
        `${JSON.stringify({
          sessionId: "d3e82a",
          runId: "pre-fix",
          hypothesisId: "H-TRACE-FALLBACK",
          location: "app/api/mobile-trace/route.ts:POST",
          message: "mobile trace payload captured via API fallback",
          data: {
            id,
            traceCount: trace.length,
            hasTune: tune !== undefined,
            persistedToKv,
            traceTail: trace.slice(-6),
            route: body.context?.route ?? null,
            userAgent: body.context?.userAgent
              ? String(body.context.userAgent).slice(0, 120)
              : null,
            contextTimestamp: body.context?.timestamp ?? null,
          },
          timestamp: Date.now(),
        })}\n`,
        "utf8",
      );
    } catch {
      // Ignore debug file write failures (e.g. read-only serverless FS).
    }
    // #endregion

    return NextResponse.json({
      ok: true,
      ...store,
      persistedToKv,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  const redis = getTraceRedis();

  if (id) {
    if (redis) {
      try {
        const fromKv = await redis.get<MobileTraceStore>(`mtrace:${id}`);
        if (fromKv && typeof fromKv === "object" && Array.isArray(fromKv.trace)) {
          return NextResponse.json({ ok: true, ...fromKv, source: "kv" as const });
        }
      } catch {
        /* fall through */
      }
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }
    const mem = globalThis.__mobileTraceStore;
    if (mem?.id === id) {
      return NextResponse.json({ ok: true, ...mem, source: "memory" as const });
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          "not found — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for durable id lookup on Vercel",
      },
      { status: 404 },
    );
  }

  if (!globalThis.__mobileTraceStore) {
    return NextResponse.json({ ok: false, error: "no trace available" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    ...globalThis.__mobileTraceStore,
    source: "memory" as const,
  });
}
