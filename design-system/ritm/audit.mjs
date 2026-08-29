/* ═════════════════════════════════════════════════════════════════════════════
   RITM design system · the check that runs, so no claim here is only a promise.

   Every fault this project actually shipped was invisible in the source: a
   contrast ratio printed against the wrong ground, a light ink inheriting a
   dark page, a footer pushed 179px past the plane, Arabic set in a Latin face.
   Looking did not catch any of them. Measuring did. So the rules below are
   executable, and a screen that breaks one fails the run.

       node audit.mjs            all screens
       node audit.mjs p1         one
   ═══════════════════════════════════════════════════════════════════════════ */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { ratio } from "./contrast.js";

const DIR = new URL(".", import.meta.url).pathname;
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
               ".mjs": "text/javascript", ".woff2": "font/woff2" };
const srv = createServer((req, res) => {
  const p = join(DIR, decodeURIComponent(req.url.split("?")[0]));
  let buf; try { buf = readFileSync(p); } catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[extname(p)] || "text/plain" }); res.end(buf);
}).listen(8141);

/* ── 1 · the token file's own arithmetic ──────────────────────────────────
   Each pair the comments claim is recomputed. A comment that drifts from the
   value beside it is worse than no comment: it is a false certificate. */
const css = readFileSync(join(DIR, "tokens.css"), "utf8");
const hex = n => (css.match(new RegExp(`--${n}:(#[0-9A-Fa-f]{6})`)) || [])[1];
const P = Object.fromEntries(["ink","coal","slate","line-d","graphite","steel","grey","mist",
  "fog","line-l","bone","paper","white","sand","teal","profit","loss","amber",
  "sand-ink","teal-ink","profit-ink","loss-ink","amber-ink"].map(n => [n, hex(n)]));

const AA = 4.5, AA_LARGE = 3, NON_TEXT = 3;
const claims = [
  /* dark: every ink on every ground it is allowed to sit on */
  ["fg on bg",            P.paper, P.ink,   AA],
  ["fg on surface-2",     P.paper, P.slate, AA],
  ["fg-2 on bg",          P.fog,   P.ink,   AA],
  ["fg-2 on surface-2",   P.fog,   P.slate, AA],
  ["fg-3 on bg",          P.mist,  P.ink,   AA],
  ["fg-3 on surface",     P.mist,  P.coal,  AA],
  ["fg-3 on surface-2",   P.mist,  P.slate, AA],
  ["fg-3 on surface-3",   P.mist,  P["line-d"], AA],
  ["accent on bg",        P.sand,  P.ink,   AA],
  ["accent on surface",   P.sand,  P.coal,  AA],
  ["on-accent over sand", P.ink,   P.sand,  AA],
  ["profit on bg",        P.profit, P.ink,  AA],
  ["profit on surface",   P.profit, P.coal, AA],
  ["loss on bg",          P.loss,  P.ink,   AA],
  ["loss on surface",     P.loss,  P.coal,  AA],
  ["warning on bg",       P.amber, P.ink,   AA],
  ["info on bg",          P.teal,  P.ink,   AA],
  ["disabled on bg",      P.grey,  P.ink,   AA_LARGE],
  ["line-control on bg",  "#57606A", P.ink, NON_TEXT],
  /* the series bands: each fill carries an ink that must survive on it */
  ["on-series-2 over steel",    P.paper, P.steel,    AA],
  ["on-series-3 over mist",     P.ink,   P.mist,     AA],
  ["on-series-4 over graphite", P.paper, P.graphite, AA],
  /* light: measured against BONE, the darkest light surface, so it holds on all */
  ["fg on bg (light)",       P.ink,        P.paper, AA],
  ["fg on surface-2 (light)",P.ink,        P.bone,  AA],
  ["fg-2 on bg (light)",     P.steel,      P.paper, AA],
  ["fg-3 on bg (light)",     P.grey,       P.paper, AA],
  ["fg-3 on surface-2 (light)", P.grey,    P.bone,  AA],
  ["accent-ink on bone",     P["sand-ink"],   P.bone, AA],
  ["profit-ink on bone",     P["profit-ink"], P.bone, AA],
  ["loss-ink on bone",       P["loss-ink"],   P.bone, AA],
  ["warning-ink on bone",    P["amber-ink"],  P.bone, AA],
  ["info-ink on bone",       P["teal-ink"],   P.bone, AA],
  ["disabled on bg (light)", "#8A8578",       P.paper, AA_LARGE],
  ["line-control on white",  "#9C947F",       P.white, NON_TEXT],
  ["on-series-4 over C3BFB4","#0B0E11",       "#C3BFB4", AA],
];
/* the two the brand manual proved are NOT allowed, kept as failing controls:
   if either ever passes, someone lightened a ground and broke the light rules */
const forbidden = [
  ["sand as text on paper", P.sand, P.paper, AA],
  ["teal as text on paper", P.teal, P.paper, AA],
];

let bad = 0;
console.log("── tokens ──────────────────────────────────────────────");
for (const [name, a, b, min] of claims) {
  const r = ratio(a, b), ok = r >= min;
  if (!ok) bad++;
  console.log(`${ok ? "  ✓" : "  ✗"} ${name.padEnd(28)} ${a} on ${b}  ${r.toFixed(2)} (needs ${min})`);
}
for (const [name, a, b, min] of forbidden) {
  const r = ratio(a, b), ok = r < min;
  if (!ok) bad++;
  console.log(`${ok ? "  ✓" : "  ✗"} ${name.padEnd(28)} ${a} on ${b}  ${r.toFixed(2)} (must stay under ${min})`);
}

/* ── 2 · every rendered screen ─────────────────────────────────────────── */
const only = process.argv[2];
const pages = readdirSync(DIR).filter(f => /^[dp]\d.*\.html$/.test(f) && (!only || f.includes(only))).sort();
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
const page = await ctx.newPage();

console.log("\n── screens ─────────────────────────────────────────────");
for (const f of pages) {
  const errs = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", e => errs.push(String(e).slice(0, 80)));
  await page.goto(`http://127.0.0.1:8141/${f}`, { waitUntil: "load", timeout: 30000 });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const out = { clip: [], small: [], ghost: [], mono: [], lattice: [], scale: [], bidi: [] };
    const plane = document.querySelector(".plane");
    const pb = plane.getBoundingClientRect();
    const SCALE = [10, 11, 12, 13, 14, 16, 22, 28, 38, 44, 56];  /* 44 is the device mock's own step */
    const LATTICE = new Set([0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 72]);
    const seen = new Set();
    const push = (a, s) => { if (!seen.has(s)) { seen.add(s); a.push(s); } };

    for (const el of plane.querySelectorAll("*")) {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const txt = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const label = (el.textContent || "").trim().slice(0, 22);

      /* nothing may fall off the plane: overflow:hidden hides the defect, it
         does not fix it, and the footer of one brand board was lost this way */
      if (b.width && b.height &&
          (b.bottom > pb.bottom + 1 || b.top < pb.top - 1 || b.right > pb.right + 1 || b.left < pb.left - 1))
        push(out.clip, `${el.tagName.toLowerCase()} «${label}»`);

      if (txt) {
        const fs = parseFloat(cs.fontSize);
        /* the 10px floor, and the scale: no size that is not a step */
        if (fs < 9.5) push(out.small, `${fs}px «${label}»`);
        else if (!SCALE.includes(Math.round(fs * 10) / 10) && !el.closest("[data-spec]"))
          push(out.scale, `${fs}px «${label}»`);

        /* Arabic must never be laid out in a Latin-only face */
        if (/[؀-ۿ]/.test(el.textContent) &&
            /archivo/i.test(cs.fontFamily) && !/tajawal/i.test(cs.fontFamily))
          push(out.mono, `«${label}»`);

        /* a Latin or numeric run inside Arabic needs an isolate, not just a
           direction: `direction:ltr` alone printed «#C6A97D» backwards */
        if (cs.direction === "ltr" && cs.unicodeBidi === "normal" &&
            el.parentElement && getComputedStyle(el.parentElement).direction === "rtl")
          push(out.bidi, `«${label}»`);
      }

      /* the ghost card: a hairline border AND a shadow on one element */
      if (cs.boxShadow !== "none" && !/inset/.test(cs.boxShadow) &&
          parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle === "solid")
        push(out.ghost, `${el.className || el.tagName} «${label}»`);

      /* every gap and padding is a lattice step */
      for (const p of ["gap", "columnGap", "rowGap", "paddingTop", "paddingInlineStart"]) {
        const v = parseFloat(cs[p]);
        if (Number.isFinite(v) && v > 0 && !LATTICE.has(Math.round(v)) && !el.closest("[data-spec]"))
          push(out.lattice, `${p}:${cs[p]} on ${el.className || el.tagName}`);
      }
    }
    for (const k of Object.keys(out)) out[k] = out[k].slice(0, 4);
    return out;
  });

  const findings = Object.entries(r).filter(([, v]) => v.length);
  const ok = !findings.length && !errs.length;
  if (!ok) bad++;
  console.log(`  ${ok ? "✓" : "✗"} ${f}`);
  if (errs.length) console.log(`      JS     ${errs[0]}`);
  for (const [k, v] of findings) console.log(`      ${k.padEnd(7)}${v.join("  ·  ")}`);
}

await browser.close(); srv.close();
console.log(bad ? `\n${bad} finding group(s). Nothing here ships until this reads clean.`
                : "\nAll tokens measured, all screens on the plane, on the scale, on the lattice.");
process.exit(bad ? 1 : 0);
