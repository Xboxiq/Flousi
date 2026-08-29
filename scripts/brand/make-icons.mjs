/**
 * Regenerates the installed-app icons from the RITM mark.
 *
 * The icons are the one place the brand ships as pixels, so they are GENERATED
 * from the same four numbers the React mark uses rather than drawn by hand:
 * change the bars in `logo.tsx`, change them here, re-run, and the home screen
 * agrees with the sidebar.
 *
 *   node scripts/brand/make-icons.mjs
 *
 * Renders in the Chromium that Playwright already provides (no image library is
 * installed in this project, and adding one to draw four rectangles would be a
 * dependency for nothing).
 */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";

const GROUND = "#0B0E11"; // the board's coal
const BARS_COLOR = "#B8A880"; // the board's sand

/** x, y, height in the mark's own 24×39 frame. Mirrors BARS in logo.tsx. */
const BARS = [
  [0, 7, 32],
  [6.6, 3.5, 29],
  [13.2, 0, 26],
  [19.8, 5.5, 14],
];

/**
 * `scale` is the mark's height as a fraction of the icon. Maskable icons are
 * cropped to a circle of 80% width by some launchers, so the mark stays well
 * inside that: at 0.52 of the height its diagonal never leaves the safe zone.
 */
function page(size, { scale, radius }) {
  const markH = size * scale;
  const markW = (markH * 24) / 39;
  const rects = BARS.map(
    ([x, y, h]) =>
      `<rect x="${x}" y="${y}" width="4.2" height="${h}" rx="2.1" fill="${BARS_COLOR}"/>`,
  ).join("");
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0}
    body{width:${size}px;height:${size}px;display:grid;place-items:center;
         background:${GROUND};border-radius:${radius}px;overflow:hidden}
  </style>
  <svg width="${markW}" height="${markH}" viewBox="0 0 24 39">${rects}</svg>`;
}

const TARGETS = [
  // The web manifest icons are also used maskable, so they keep square corners
  // and let the launcher mask them; only Apple's asks for the shape itself, and
  // iOS rounds it anyway, so that one stays square too.
  { file: "public/icon-192.png", size: 192, scale: 0.52, radius: 0 },
  { file: "public/icon-512.png", size: 512, scale: 0.52, radius: 0 },
  { file: "public/apple-touch-icon.png", size: 180, scale: 0.58, radius: 0 },
];

const browser = await chromium.launch();
try {
  for (const { file, size, scale, radius } of TARGETS) {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(page(size, { scale, radius }));
    const buf = await p.screenshot({ type: "png" });
    await mkdir("public", { recursive: true });
    await writeFile(file, buf);
    await p.close();
    console.log(`${file}  ${size}×${size}`);
  }
} finally {
  await browser.close();
}
