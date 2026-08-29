/* Serve this directory and photograph every screen in it. A design system that
   has never been looked at is a document, not a system. */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const DIR = new URL(".", import.meta.url).pathname;
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
               ".mjs": "text/javascript", ".woff2": "font/woff2" };
const srv = createServer((req, res) => {
  const p = join(DIR, decodeURIComponent(req.url.split("?")[0]));
  let buf; try { buf = readFileSync(p); } catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[extname(p)] || "text/plain" }); res.end(buf);
}).listen(0);
/* a free port: a stale server from an interrupted run must never block this one */
const PORT = srv.address().port;

const only = process.argv[2];
const pages = readdirSync(DIR).filter(f => /^[dp]\d.*\.html$/.test(f) && (!only || f.includes(only))).sort();
mkdirSync(join(DIR, "renders"), { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const f of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${PORT}/${f}`, { waitUntil: "load", timeout: 30000 });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(900);
  const el = await page.$(".plane");
  await el.screenshot({ path: join(DIR, "renders", f.replace(".html", ".png")) });
  console.log(`${errs.length ? "✗" : "✓"} ${f}${errs.length ? "  " + errs[0] : ""}`);
  await ctx.close();
}
await browser.close(); srv.close();
