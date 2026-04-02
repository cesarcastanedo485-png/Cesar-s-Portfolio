/**
 * Ensures every local asset path referenced in content/portfolio.json exists under public/.
 * Run automatically before `next build` so missing PNG/MP3 exports do not silently break production.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pub = path.join(root, "public");
const portfolioPath = path.join(root, "content", "portfolio.json");

function addPath(out, p) {
  if (p == null || typeof p !== "string") return;
  const t = p.trim();
  if (!t || t.startsWith("http://") || t.startsWith("https://")) return;
  if (!t.startsWith("/")) return;
  out.push(t);
}

function main() {
  if (!fs.existsSync(portfolioPath)) {
    console.error("verify-public-assets: missing", portfolioPath);
    process.exit(1);
  }

  const portfolio = JSON.parse(fs.readFileSync(portfolioPath, "utf8"));
  const urls = [];
  const site = portfolio.site ?? {};

  addPath(urls, site.backgroundVideo?.src);
  addPath(urls, site.backgroundVideo?.poster);
  addPath(urls, site.audioReactiveBackground?.imageSrc);
  addPath(urls, site.audioReactiveBackground?.mushroomImageSrc);
  addPath(urls, site.audioReactiveBackground?.rainVideoSrc);
  addPath(urls, site.audioReactiveBackground?.audioSrc);
  addPath(urls, site.watermark?.imageSrc);
  addPath(urls, site.ogImage);

  for (const item of portfolio.websites?.items ?? []) {
    addPath(urls, item.imageSrc);
    if (item.demoEnabled && item.demoSlug?.trim()) {
      urls.push(`/demos/${item.demoSlug.trim()}/index.html`);
    }
  }
  for (const item of portfolio.games?.items ?? []) {
    addPath(urls, item.iconSrc);
    if (item.demoEnabled && item.demoSlug?.trim()) {
      urls.push(`/demos/${item.demoSlug.trim()}/index.html`);
    }
  }

  const unique = [...new Set(urls)];
  const missing = [];
  for (const urlPath of unique) {
    const rel = urlPath.replace(/^\//, "").replace(/\//g, path.sep);
    const disk = path.join(pub, rel);
    if (!fs.existsSync(disk)) {
      missing.push(urlPath);
    }
  }

  if (missing.length) {
    console.error(
      "verify-public-assets: missing files under public/ for paths used in content/portfolio.json:\n",
      missing.map((m) => `  - ${m}`).join("\n"),
      '\n\nCommit the assets or clear those fields until the files exist. See DEPLOY.md under "Assets".',
    );
    process.exit(1);
  }

  console.log("verify-public-assets: OK (%d paths checked)", unique.length);
}

main();
