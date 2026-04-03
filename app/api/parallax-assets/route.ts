import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const ext = path.extname(file.name || "").toLowerCase();
    const allowed = new Set([
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".gif",
      ".mp4",
      ".webm",
    ]);
    if (!allowed.has(ext)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const directory = path.join(process.cwd(), "public", "backgrounds");
    await mkdir(directory, { recursive: true });

    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeName(file.name)}`;
    const outputPath = path.join(directory, filename);
    await writeFile(outputPath, buffer);

    return NextResponse.json({ ok: true, path: `/backgrounds/${filename}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}

