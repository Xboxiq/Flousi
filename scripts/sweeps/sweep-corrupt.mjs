import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const BASE = process.env.BASE || "http://localhost:8123";
/* The four screens that read the most: the ladder's till + detail, the catalogue,
   the trips, and the team's derived balances. */
const ROUTES = ["/dashboard/", "/products/", "/orders/", "/reps/"];
const CASES = [
  ["a key holds invalid JSON", (k) => `localStorage.setItem("ritm:${k}", "{not json")`],
  ["a key holds an object, not a list", (k) => `localStorage.setItem("ritm:${k}", '{"a":1}')`],
  ["a key holds null", (k) => `localStorage.setItem("ritm:${k}", "null")`],
  ["a row is missing its fields", (k) => `localStorage.setItem("ritm:${k}", '[{"id":"x"}]')`],
  ["the key is gone entirely", (k) => `localStorage.removeItem("ritm:${k}")`],
];
/* The four load-bearing collections: everything else is read through these. */
const KEYS = ["products", "sales", "orders", "reps"];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let broken = 0,
  checked = 0;
for (const [label, mut] of CASES) {
  for (const key of KEYS) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e).split("\n")[0].slice(0, 110)));
    // boot once so the seed lands, then corrupt, then visit every screen
    await p.goto(`${BASE}/products/`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.evaluate(mut(key));
    const dead = [];
    for (const route of ROUTES) {
      await p.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      await p.waitForTimeout(600);
      // a blank screen is a crash even without a thrown error
      const text = await p.evaluate(
        () =>
          (document.querySelector("main")?.innerText || document.body.innerText || "").trim()
            .length,
      );
      if (text < 40) dead.push(route + " (blank)");
    }
    checked++;
    if (errs.length || dead.length) {
      broken++;
      console.log(`✗ ${label} · ${key}`);
      if (errs.length) console.log(`    ${errs[0]}`);
      if (dead.length) console.log(`    blank: ${dead.slice(0, 3).join(", ")}`);
    }
    await ctx.close();
  }
}
console.log("\n" + "═".repeat(60));
console.log(
  broken === 0
    ? `all ${checked} corruption cases survived — every screen still rendered`
    : `${broken}/${checked} corruption cases broke a screen`,
);
await b.close();
