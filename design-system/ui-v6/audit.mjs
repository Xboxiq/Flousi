import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync, readdirSync } from "node:fs";

/* ── v6 audit ─────────────────────────────────────────────────────────────────
   The craft claims in tile.css are checked here, not asserted. Static checks run
   on the files; live checks run on the rendered DOM in Chromium, because every
   fault this language actually shipped — a 2.49:1 ink, a stamp printed through
   its own figure, a clipped band — was invisible in the source.

     node design-system/ui-v6/audit.mjs
   ──────────────────────────────────────────────────────────────────────────── */

const BASE = process.env.BASE || "http://localhost:8390";
const DIR = "design-system/ui-v6";
const SCREENS = readdirSync(DIR).filter(f => /^f\d.*\.html$/.test(f)).sort();
const fails = [];
const fail = (where, msg) => fails.push(`${where}: ${msg}`);

/* ── A · static ───────────────────────────────────────────────────────────── */
const GEO = /(padding|padding-\w+|padding-inline(?:-\w+)?|margin|margin-\w+|margin-inline|gap|row-gap|column-gap|top|bottom|left|right|width|height|min-height|min-width|flex-basis|inset|inset-block|inset-inline(?:-\w+)?)\s*:\s*([^;{}]*?)(?=[;}])/g;

for (const f of SCREENS) {
  const src = readFileSync(`${DIR}/${f}`, "utf8");
  const styles = [...src.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");   /* a comment is not a selector */

  // A1 · the type scale is a scale: no literal font-size anywhere
  for (const m of src.matchAll(/font-size:\s*([\d.]+)px/g))
    fail(f, `literal font-size ${m[1]}px — use a --t-* or --m-* token`);

  // A2 · every geometric literal on the 4px half-step (or a sub-6px rule/caret)
  for (const m of styles.matchAll(GEO))
    for (const n of m[2].matchAll(/(?<![\w.-])([\d.]+)px/g)) {
      const v = parseFloat(n[1]);
      if (v >= 6 && v % 4 !== 0) fail(f, `off-lattice ${m[1]}:${v}px`);
    }

  // A3 · the RTL trap: never `direction` on an element that also carries an inset
  for (const m of styles.matchAll(/([^{}]+)\{([^}]*)\}/g))
    if (/(?:^|[^-])direction\s*:/.test(m[2]) && /inset-inline(-\w+)?\s*:/.test(m[2]))
      fail(f, `\`${m[1].trim().slice(0, 40)}\` sets direction AND inset-inline — the inline axis flips`);
}

/* ── B · live, in the browser ─────────────────────────────────────────────── */
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const f of SCREENS) {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const res = await p.goto(`${BASE}/${f}`, { waitUntil: "networkidle" });
  if (!res?.ok()) { fail(f, `did not load (${res?.status()})`); await ctx.close(); continue; }
  await p.evaluate(() => document.fonts.ready);

  const found = await p.evaluate(() => {
    const out = { contrast: [], footless: [], clipped: [], overlap: [] };
    const lum = (c) => {
      const [r, g, bl] = c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const bgOf = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.length === 3 || (c[3] ?? 1) > 0.95) return c.slice(0, 3);
      }
      return [255, 255, 255];
    };
    const ownText = (el) => [...el.childNodes]
      .filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(" ").trim();

    const texts = [];
    for (const el of document.querySelectorAll("body *")) {
      const t = ownText(el);
      if (!t) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      texts.push({ el, t, r, cs });

      // B1 · contrast, at the real rendered size and weight
      const size = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight) || 400;
      const need = (size >= 24 || (size >= 18.66 && w >= 700)) ? 3.0 : 4.5;
      const got = ratio(parse(cs.color).slice(0, 3), bgOf(el));
      if (got < need) out.contrast.push({ t: t.slice(0, 26), got: +got.toFixed(2), need, size, w });

      // B3 · nothing clipped: a text box may not exceed its clipping ancestor
      for (let n = el.parentElement; n; n = n.parentElement) {
        if (getComputedStyle(n).overflow === "hidden") {
          const pr = n.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.bottom > pr.bottom + 1 ||
              r.left < pr.left - 1 || r.top < pr.top - 1)
            out.clipped.push({ t: t.slice(0, 26) });
          break;
        }
      }
    }

    // B3b · a painted box may not be cut by its clipping ancestor either. A
    // negative-margin bleed to the field's own edge is intended; past it is not.
    for (const el of document.querySelectorAll(".f > *, .pnl > *, .geo2 > *, .gl > *")) {
      const cs = getComputedStyle(el);
      if (cs.backgroundColor === "rgba(0, 0, 0, 0)" && !cs.clipPath.startsWith("polygon")) continue;
      const r = el.getBoundingClientRect();
      for (let n = el.parentElement; n; n = n.parentElement) {
        if (getComputedStyle(n).overflow === "hidden") {
          const pr = n.getBoundingClientRect();
          if (r.bottom > pr.bottom + 1 || r.top < pr.top - 1)
            out.clipped.push({ t: "box " + el.className.slice(0, 22) });
          break;
        }
      }
    }

    // B2 · clause 8: a field over 240px tall is anchored at both ends
    /* Clause 8 binds a FIELD, not a container and not a block of prose. A field
       that holds other fields is anchored by them; a field whose own text already
       reaches its foot needs no second anchor. Everything else must carry one of
       these, which are the shapes a foot actually takes in v6. */
    const FOOT = ".ft,.bft,.bot,.foot2,.whole,.prov,.nest,.vnest,.snest,.nrow,.ncap,.vcap," +
                 ".sums,.hrow,.pcx,.pc,.p2,.pp,.np,.step,.z,.v2,.legend";
    for (const el of document.querySelectorAll(".f")) {
      const r = el.getBoundingClientRect();
      if (r.height <= 240) continue;
      if (!el.textContent.trim()) continue;
      if (el.querySelector(".f")) continue;                 /* a container */
      if (el.querySelector(FOOT)) continue;                 /* has a foot */
      /* how far down the field does its own content actually reach? */
      let low = r.top;
      for (const k of el.querySelectorAll("*")) {
        const kr = k.getBoundingClientRect();
        if (kr.height > 0 && k.textContent.trim()) low = Math.max(low, kr.bottom);
      }
      if ((low - r.top) / r.height >= 0.65) continue;        /* prose fills it */
      out.footless.push({ cls: el.className, h: Math.round(r.height),
                          filled: Math.round((low - r.top) / r.height * 100) + "%" });
    }

    // B4 · two text boxes may not overlap by more than a hairline
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i], c = texts[j];
        if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
        const ox = Math.min(a.r.right, c.r.right) - Math.max(a.r.left, c.r.left);
        const oy = Math.min(a.r.bottom, c.r.bottom) - Math.max(a.r.top, c.r.top);
        if (ox > 3 && oy > 3)
          out.overlap.push({ a: a.t.slice(0, 20), b: c.t.slice(0, 20), ox: Math.round(ox), oy: Math.round(oy) });
      }
    return out;
  });

  for (const c of found.contrast) fail(f, `contrast ${c.got}:1 < ${c.need} at ${c.size}px/${c.w} — «${c.t}»`);
  for (const c of found.footless) fail(f, `clause 8: ${c.h}px field «${c.cls}» filled to ${c.filled}, no foot`);
  for (const c of found.clipped)  fail(f, `clipped: «${c.t}»`);
  for (const c of found.overlap)  fail(f, `overlap ${c.ox}×${c.oy}px: «${c.a}» / «${c.b}»`);
  await ctx.close();
}
await b.close();

if (fails.length) { console.log(fails.map(s => "  ✗ " + s).join("\n")); console.log(`\n${fails.length} failures`); process.exit(1); }
console.log(`✓ ${SCREENS.length} screens: type scale, 4px lattice, RTL insets, contrast, clause 8, clipping, overlap`);
