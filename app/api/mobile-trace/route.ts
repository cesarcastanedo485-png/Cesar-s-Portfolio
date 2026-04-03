import { NextResponse } from "next/server";

type TracePayload = {
  trace?: string[];
  context?: {
    route?: string;
    userAgent?: string;
    timestamp?: number;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __mobileTraceStore:
    | { id: string; trace: string[]; context: TracePayload["context"]; receivedAt: number }
    | undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TracePayload;
    const trace = Array.isArray(body.trace)
      ? body.trace.filter((line): line is string => typeof line === "string").slice(-120)
      : [];
    if (!trace.length) {
      return NextResponse.json({ ok: false, error: "missing trace lines" }, { status: 400 });
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    globalThis.__mobileTraceStore = {
      id,
      trace,
      context: body.context ?? {},
      receivedAt: Date.now(),
    };
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }
}

export async function GET() {
  if (!globalThis.__mobileTraceStore) {
    return NextResponse.json({ ok: false, error: "no trace available" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...globalThis.__mobileTraceStore });
}

