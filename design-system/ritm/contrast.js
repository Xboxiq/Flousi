/* One implementation of WCAG 2.x relative luminance, used by the spec pages to
   PRINT a ratio and by audit.mjs to FAIL on one. A number a page prints and a
   number a build checks must come from the same function, or the page will
   eventually claim something the build does not. */
export const rgb = h => { h = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const lin = c => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export const luminance = h => { const [r, g, b] = rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const ratio = (a, b) => { const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
