import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readdirSync } from "node:fs";
/* v7 audit — the reference's own priority order (ux-guidelines):
   1 Accessibility · 2 Touch & Interaction · 6 Typography & Color · 8 Forms.
   Run:  node design-system/ui-v7/audit.mjs        (server on 8391) */
const BASE = process.env.BASE || "http://localhost:8391";
const DIR = "design-system/ui-v7";
const SCREENS = readdirSync(DIR).filter(f => /^s\d.*\.html$/.test(f)).sort();
const fails = []; const fail = (w, m) => fails.push(`${w}: ${m}`);

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const f of SCREENS) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 2100 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const r = await p.goto(`${BASE}/${f}`, { waitUntil: "networkidle" });
  if (!r?.ok()) { fail(f, `did not load (${r?.status()})`); await ctx.close(); continue; }
  await p.evaluate(() => document.fonts.ready);

  const out = await p.evaluate(() => {
    const o = { contrast: [], overlap: [], clipped: [], unnamed: [], unlabelled: [], size: [], small: [] };
    const SCALE = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 36, 40];
    const parse = s => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
    const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
      return .2126 * r + .7152 * g + .0722 * b; };
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + .05) / (lo + .05); };
    const bgOf = el => { for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.length === 3 || (c[3] ?? 1) > .95) return c.slice(0, 3); } return [255, 255, 255]; };
    const own = el => [...el.childNodes].filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim()).join(" ").trim();

    const texts = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      const t = own(el);
      if (t && rect.width > 0 && rect.height > 0) {
        texts.push({ el, t, rect });
        const size = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight) || 400;
        if (!SCALE.includes(Math.round(size * 10) / 10) && !SCALE.includes(Math.round(size)))
          o.size.push({ t: t.slice(0, 20), size });
        if (size < 10) o.small.push({ t: t.slice(0, 20), size });
        const need = (size >= 24 || (size >= 18.66 && w >= 700)) ? 3 : 4.5;
        const got = ratio(parse(cs.color).slice(0, 3), bgOf(el));
        if (got < need) o.contrast.push({ t: t.slice(0, 26), got: +got.toFixed(2), need, size, w });
        for (let n = el.parentElement; n; n = n.parentElement) {
          const pcs = getComputedStyle(n);
          if (pcs.overflow === "hidden" || pcs.overflowX === "hidden") {
            const pr = n.getBoundingClientRect();
            if (rect.right > pr.right + 1 || rect.left < pr.left - 1 ||
                rect.bottom > pr.bottom + 1 || rect.top < pr.top - 1) o.clipped.push({ t: t.slice(0, 24) });
            break;
          }
        }
      }
    }
    /* every control carries an accessible name and a usable target */
    for (const el of document.querySelectorAll("button,a,[role=button]")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none") continue;
      const name = (el.textContent || "").trim() || el.getAttribute("aria-label") || el.title;
      if (!name) o.unnamed.push({ tag: el.tagName, cls: el.className.slice(0, 28) });
      const h = el.getBoundingClientRect().height;
      if (h && h < 26) o.small.push({ t: "target " + (name || el.className).slice(0, 18), size: Math.round(h) });
    }
    /* ux-guidelines #8: a placeholder is not a label */
    for (const el of document.querySelectorAll("input,select,textarea")) {
      const id = el.id;
      const hasLabel = (id && document.querySelector(`label[for="${id}"]`)) ||
        el.closest("label") || el.getAttribute("aria-label") ||
        (el.closest(".field") && el.closest(".field").querySelector("label"));
      if (!hasLabel) o.unlabelled.push({ ph: el.placeholder || el.value || el.className });
    }
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i], c = texts[j];
        if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
        const ox = Math.min(a.rect.right, c.rect.right) - Math.max(a.rect.left, c.rect.left);
        const oy = Math.min(a.rect.bottom, c.rect.bottom) - Math.max(a.rect.top, c.rect.top);
        if (ox > 3 && oy > 3) o.overlap.push({ a: a.t.slice(0, 18), b: c.t.slice(0, 18) });
      }
    return o;
  });

  for (const c of out.contrast)   fail(f, `contrast ${c.got}:1 < ${c.need} at ${c.size}px/${c.w} — «${c.t}»`);
  for (const c of out.overlap)    fail(f, `overlap «${c.a}» / «${c.b}»`);
  for (const c of out.clipped)    fail(f, `clipped «${c.t}»`);
  for (const c of out.unnamed)    fail(f, `control with no accessible name: ${c.tag}.${c.cls}`);
  for (const c of out.unlabelled) fail(f, `field with no label: «${c.ph}»`);
  for (const c of out.size)       fail(f, `font-size ${c.size}px is off the scale — «${c.t}»`);
  for (const c of out.small)      fail(f, `too small (${c.size}) — «${c.t}»`);
  await ctx.close();
}
await b.close();
if (fails.length) { console.log(fails.map(s => "  ✗ " + s).join("\n")); console.log(`\n${fails.length} failures`); process.exit(1); }
console.log(`✓ ${SCREENS.length} screens: contrast, overlap, clipping, accessible names, field labels, type scale, target size`);
