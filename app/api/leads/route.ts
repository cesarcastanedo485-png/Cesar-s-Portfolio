import { NextResponse } from "next/server";

const SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL;
const SCRIPT_SECRET = process.env.LEADS_SCRIPT_SECRET ?? "";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Accepts portfolio lead rows from the browser and forwards them to a Google Apps Script
 * web app that appends to a Sheet. Set env vars in Vercel / .env.local — see
 * `scripts/google-apps-script-leads.gs` for the script to paste into Google.
 */
export async function POST(req: Request) {
  const url = SCRIPT_URL?.trim();
  if (!url) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const payload = {
    secret: SCRIPT_SECRET,
    id: typeof o.id === "string" ? o.id : String(o.id ?? ""),
    username: typeof o.username === "string" ? o.username : "",
    email,
    source: typeof o.source === "string" ? o.source : "",
    createdAt:
      typeof o.createdAt === "string" && o.createdAt.length > 0
        ? o.createdAt
        : new Date().toISOString(),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("Leads Apps Script HTTP", res.status, text.slice(0, 200));
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Leads Apps Script fetch failed", e);
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }
}
