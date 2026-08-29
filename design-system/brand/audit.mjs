/* Renders each .dc.html standalone and measures what looking cannot catch:
   clipping past the 1440x900 plane, overlapping siblings, and text under 10px. */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const DIR = new URL(".", import.meta.url).pathname;
const boards = readdirSync(DIR).filter(f => f.endsWith(".dc.html")).sort();
mkdirSync(join(DIR, "_prev"), { recursive: true });

for (const b of boards) {
  const src = readFileSync(join(DIR, b), "utf8");
  const helmet = src.slice(src.indexOf("<helmet>") + 8, src.indexOf("</helmet>"));
  const body = src.slice(src.indexOf("</helmet>") + 9, src.lastIndexOf("</x-dc>"));
  writeFileSync(join(DIR, "_prev", b.replace(".dc.html", ".html")),
    `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${helmet}</head><body>${body}</body></html>`);
}

const MIME = { ".html": "text/html", ".woff2": "font/woff2", ".css": "text/css" };
const srv = createServer((req, res) => {
  const p = join(DIR, decodeURIComponent(req.url.split("?")[0]));
  let buf;
  try { buf = readFileSync(p); } catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[extname(p)] || "text/plain" });
  res.end(buf);
}).listen(8130);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
mkdirSync(join(DIR, "renders"), { recursive: true });

let bad = 0;
for (const b of boards) {
  const name = b.replace(".dc.html", "");
  await page.goto(`http://127.0.0.1:8130/_prev/${name}.html`, { waitUntil: "load", timeout: 45000 });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const plane = document.querySelector(".bd") || document.body;
    const pb = plane.getBoundingClientRect();
    const out = { clip: [], small: [], planeH: Math.round(pb.height) };
    for (const el of plane.querySelectorAll("*")) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (b.bottom > pb.bottom + 1 || b.top < pb.top - 1 ||
          b.right > pb.right + 1 || b.left < pb.left - 1) {
        const s = (el.textContent || "").trim().slice(0, 28);
        out.clip.push(`${el.tagName.toLowerCase()} ${Math.round(b.top)},${Math.round(b.bottom)} «${s}»`);
      }
      const txt = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      // [data-spec] is artwork drawn at a stated size (a mark at its minimum, a
      // mock object at reduced scale). The 10px floor governs interface text.
      if (txt && !el.closest("[data-spec]") && parseFloat(getComputedStyle(el).fontSize) < 9.5)
        out.small.push(`${getComputedStyle(el).fontSize} «${(el.textContent || "").trim().slice(0, 24)}»`);
    }
    out.clip = [...new Set(out.clip)].slice(0, 8);
    out.small = [...new Set(out.small)].slice(0, 6);
    return out;
  });
  await page.screenshot({ path: join(DIR, "renders", `${name}.png`) });
  const ok = !r.clip.length && !r.small.length;
  if (!ok) bad++;
  console.log(`${ok ? "✓" : "✗"} ${name.padEnd(14)} h=${r.planeH}` +
    (r.clip.length ? `\n    CLIP  ${r.clip.join("\n    CLIP  ")}` : "") +
    (r.small.length ? `\n    <10px ${r.small.join("\n    <10px ")}` : ""));
}
await browser.close(); srv.close();
console.log(bad ? `\n${bad} board(s) with findings` : "\nAll boards fit the plane, no text under 10px.");
