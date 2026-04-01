/**
 * Stops the Next.js dev server that holds `.next/dev/lock` (or removes a stale lock).
 * Closing a terminal often does NOT kill the Node process — use this before `npm run dev`.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const lockPath = path.join(process.cwd(), ".next", "dev", "lock");

if (!fs.existsSync(lockPath)) {
  process.stdout.write("No `.next/dev/lock` — no recorded dev server for this project.\n");
  process.exit(0);
}

let info;
try {
  info = JSON.parse(fs.readFileSync(lockPath, "utf8"));
} catch {
  try {
    fs.unlinkSync(lockPath);
  } catch {
    /* ignore */
  }
  process.stdout.write("Removed unknown/corrupt `.next/dev/lock`.\n");
  process.exit(0);
}

const pid = typeof info.pid === "number" ? info.pid : parseInt(String(info.pid), 10);
if (!Number.isFinite(pid) || pid <= 0) {
  try {
    fs.unlinkSync(lockPath);
  } catch {
    /* ignore */
  }
  process.stdout.write("Removed invalid `.next/dev/lock`.\n");
  process.exit(0);
}

process.stdout.write(
  `Stopping Next dev (PID ${pid}, ${info.appUrl || "?"} from lockfile)…\n`,
);

if (process.platform === "win32") {
  try {
    execFileSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "inherit" });
  } catch {
    process.stdout.write("(taskkill failed — process may already be gone.)\n");
  }
} else {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    process.stdout.write("(kill failed — process may already be gone.)\n");
  }
}

try {
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    process.stdout.write("Removed `.next/dev/lock` (stale or leftover).\n");
  }
} catch (e) {
  process.stderr.write(`Could not remove lock: ${e.message}\n`);
  process.exit(1);
}

process.stdout.write("Done. Run `npm run dev` again.\n");
