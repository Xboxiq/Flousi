import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

/**
 * Every text run on every screen, measured against the colour actually painted
 * behind it — in BOTH themes.
 *
 * This exists because the identity's sand (#B8A880) is a plate, not a word: it
 * carries 2.08:1 as text on paper and 1.9:1 under white. A palette swap that
 * keeps a `text-white` sitting on a token that used to be a vivid blue and is
 * now a pale sand fails silently — nothing throws, the screenshot looks
 * plausible, and the merchant is the one who cannot read it. So the ratio is
 * measured against `getComputedStyle`, including the colour stops of a gradient
 * body, rather than asserted from the token table.
 *
 *   BASE=http://localhost:8123 node scripts/sweeps/sweep-contrast.mjs
 */
const BASE = process.env.BASE || "http://localhost:8123";
const ROUTES = (process.env.ROUTES || "/,/dashboard/,/orders/,/products/,/reps/,/settings/,/ledger/,/targets/,/reports/,/settlements/,/periods/,/access/,/calculator/").split(",");

const AUDIT = () => {
  /* Any CSS colour, resolved by the engine itself. `color-mix()` and `oklab()`
     survive into computed styles, so a regex over rgb() alone silently misses
     exactly the colours this project mixes its materials from. A 1×1 canvas
     answers with the real bytes. */
  const CV = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const parse = (c) => {
    if (!c || c === "transparent" || c === "none") return null;
    CV.clearRect(0, 0, 1, 1);
    CV.fillStyle = "#000";
    CV.fillStyle = c;
    const resolved = CV.fillStyle;
    if (typeof resolved === "string" && resolved.startsWith("#")) {
      const h = resolved.slice(1);
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
    }
    const m = String(resolved).match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\)/);
    return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const over = (fg, bg) => {
    const a = fg[3];
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };

  const paint = (node, stops) => {
    const cs = getComputedStyle(node);
    const img = cs.backgroundImage;
    let opaque = false;
    if (img && img !== "none") {
      for (const m of img.matchAll(/(?:rgba?|color-mix|oklab|oklch|color|hsla?|lab|lch)\((?:[^()]|\([^()]*\))*\)|#[0-9a-fA-F]{3,8}/g)) {
        const c = parse(m[0]);
        if (c && c[3] > 0.5) { stops.push(c.slice(0, 3)); if (c[3] > 0.99) opaque = true; }
      }
    }
    const bg = parse(cs.backgroundColor);
    if (bg && bg[3] === 1) { stops.push(bg.slice(0, 3)); return true; }
    return opaque;
  };

  /* The grounds a run can be painted on: everything the compositor puts BEHIND
     it, in paint order, until something opaque stops the light. That is a hit
     test, not an ancestor walk — the segmented control paints its accent pill as
     an absolutely-positioned SIBLING under the label, so an ancestor walk scores
     the label against the sunken track it never touches and calls a perfectly
     readable chip a 1.01 failure. A gradient is scored at its WORST stop: a
     label that only reads over the light end of a gradient does not read. */
  const grounds = (el) => {
    const stops = [];
    const r = el.getBoundingClientRect();
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const at = stack.indexOf(el);
    if (at !== -1) {
      for (const node of stack.slice(at)) if (paint(node, stops)) break;
      if (stops.length) return stops;
    }
    let node = el;
    while (node && node !== document.documentElement.parentNode) {
      const cs = getComputedStyle(node);
      const img = cs.backgroundImage;
      let opaque = false;
      if (img && img !== "none") {
        for (const m of img.matchAll(/(?:rgba?|color-mix|oklab|oklch|color|hsla?|lab|lch)\((?:[^()]|\([^()]*\))*\)|#[0-9a-fA-F]{3,8}/g)) {
          const c = parse(m[0]);
          if (c && c[3] > 0.5) { stops.push(c.slice(0, 3)); if (c[3] > 0.99) opaque = true; }
        }
      }
      const bg = parse(cs.backgroundColor);
      if (bg && bg[3] === 1) { stops.push(bg.slice(0, 3)); break; }
      /* An opaque gradient body HIDES everything behind it. Walking past one and
         scoring the page ground as a candidate is how a perfectly readable slab
         gets reported as a 1.13 failure. */
      if (opaque) break;
      node = node.parentElement;
    }
    if (!stops.length) stops.push([255, 255, 255]);
    return stops;
  };

  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join("")
      .trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const fg = parse(cs.color);
    if (!fg || fg[3] === 0) continue;
    const size = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 700;
    /* WCAG "large" is 18.66px bold or 24px. Everything else needs 4.5. */
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    let worst = Infinity, ground = null;
    for (const g of grounds(el)) {
      const v = ratio(over(fg, g), g);
      if (v < worst) { worst = v; ground = g; }
    }
    if (worst < need) {
      out.push({
        text: text.slice(0, 40),
        tag: el.tagName.toLowerCase(),
        cls: (el.className && String(el.className).slice(0, 70)) || "",
        fg: cs.color, ground: `rgb(${ground.join(",")})`,
        size: Math.round(size), need, ratio: +worst.toFixed(2),
      });
    }
  }
  return out;
};

/**
 * A gate that cannot fail is not a gate. Before measuring anything real, a run
 * that is KNOWN to fail is planted on the first route and must be reported:
 * the board's own sand as a word on the page ground, 2.08:1 in light. If the
 * control passes, the sweep is broken, not the app.
 */
async function control(ctx) {
  const page = await ctx.newPage();
  await page.goto(BASE + ROUTES[0], { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    const el = document.createElement("p");
    el.textContent = "CONTROL";
    el.style.cssText = "color:#B8A880;font-size:14px;position:fixed;top:4px;left:4px;z-index:9999";
    document.body.appendChild(el);
  });
  await page.waitForTimeout(200);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1440, height: Math.min(Math.max(h, 950), 8000) });
  const found = await page.evaluate(AUDIT);
  await page.close();
  const caught = found.some((f) => f.text === "CONTROL");
  console.log(caught ? "control: caught the planted failure" : "control: DID NOT CATCH — the sweep is broken");
  return caught;
}

const browser = await chromium.launch();
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const ok = await control(ctx);
  await ctx.close();
  if (!ok) { await browser.close(); process.exit(2); }
}
let failures = 0;
for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.waitForTimeout(400);
    /* elementsFromPoint only answers inside the viewport, so the viewport is
       grown to the whole document before the hit tests run. */
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: 1440, height: Math.min(Math.max(h, 950), 8000) });
    await page.waitForTimeout(300);
    const found = await page.evaluate(AUDIT);
    if (found.length) {
      failures += found.length;
      console.log(`\n${theme} ${route}`);
      const seen = new Set();
      for (const f of found) {
        const key = `${f.text}|${f.fg}|${f.ground}`;
        if (seen.has(key)) continue;
        seen.add(key);
        console.log(`  ${String(f.ratio).padStart(5)} (need ${f.need})  «${f.text}»  ${f.fg} on ${f.ground}  ${f.size}px  .${f.cls}`);
      }
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(failures ? `\nFAIL — ${failures} runs below AA` : "\nPASS — every text run meets AA");
process.exit(failures ? 1 : 0);
