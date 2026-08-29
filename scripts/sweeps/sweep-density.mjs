import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

/**
 * The quiet ceiling (VISUAL-LAW §15), enforced.
 *
 * The client's verdict on the app after P10 was «التصميم تحسه صعب ومعقد جدا», and the
 * measurement agreed: 124 figures and ~30 sentences on one screen. Every addition had
 * been defensible alone. So the budget is checked by a script instead of being kept as
 * an intention, because an intention is exactly what let it drift this far.
 *
 * Counted AT REST — before any disclosure is opened. What sits behind a rung, a row's
 * panel or a dialog is deliberately out of scope: that is where the depth belongs.
 */
const BASE = process.env.BASE || "http://localhost:8123";

const BUDGET = {
  /**
   * Figures in ONE PANEL's own non-row region.
   *
   * Fifth recalibration, and the largest: the number was 8 and it was counted over
   * the whole screen, because the screen it was written for was one figure over a
   * ladder of collapsed rungs. The artboards the client then approved are not that
   * shape — they are a BRIEF ROW of three titled panels over a work panel — and
   * under the old counting rule every one of those panels' figures landed in one
   * bucket. The dashboard measured 43 against a ceiling of 8 while reading as four
   * calm cards.
   *
   * So the region was wrong, not the screens. Measured on the client's OWN boards,
   * which are the approved density:
   *
   *   board            total   worst panel
   *   p1 dashboard      48        13
   *   p6 monitor        48         9
   *   p8 ledger         47         3
   *   p9 product        68         9
   *   p4 settlement     55        25   (a detail card, not a layout panel)
   *   p3 rep            29         4
   *   p7 archive        43        12
   *
   * A panel carries its own title and its own hairline, so the eye reads one at a
   * time — which is exactly why three panels of four figures do not feel like
   * twelve. The ceiling is therefore PER PANEL, at one above the worst honest
   * layout panel on the boards, the same rule `sentences` already uses.
   *
   * This is a conflict between VISUAL-LAW §15 (written from «التصميم تحسه صعب
   * ومعقد جدا») and the boards the client later approved, and it is resolved in
   * VISUAL-LAW §23 clause by clause rather than silently in either direction.
   */
  panelFigures: 14,
  /**
   * Figures on the whole screen at rest, as a second guard: a screen made of six
   * compliant panels is still a wall. Set from the boards' worst, p9 at 68.
   */
  screenFigures: 72,
  /**
   * Figures on one list row.
   *
   * Recalibrated from 2 after the first run, with a reason: a ledger row legitimately
   * carries an IDENTIFIER, a DATE and ONE amount, and this regex counts «ط-1041», «5»,
   * «2026» and «174,000» as four figures. Two was a number I invented before measuring
   * anything; contorting a money row to fit it would have been the wrong repair. What
   * the ceiling actually targets is the SECOND amount and the counts beside it.
   */
  rowFigures: 4,
  /**
   * Clauses in the LONGEST single block of prose at rest.
   *
   * This is the one that catches what the client actually complained about. /access
   * opened with a five-clause paragraph explaining that roles are not authentication;
   * the claim had to be on the screen, but the reasoning behind it did not have to be
   * read before anything else could be. Three clauses is a line a merchant reads
   * without deciding to; beyond that it is a paragraph, and a paragraph belongs behind
   * a latch.
   */
  proseBlock: 3,
  /**
   * Clauses of prose in the SUMMARY region.
   *
   * Third recalibration, and the same kind as the other two: it was measured on the
   * whole screen, so a list of rows that each carry one honest line of description
   * blew the budget while reading perfectly. /access is the case that forced it —
   * three role rows, each saying what that role may see, are the most useful prose on
   * the screen. Rows answer to `rowFigures` and `rowBadges`; this counts what stands
   * ABOVE them, which is where a wall of text actually costs a reader.
   *
   * A terminator here includes the Arabic comma «،» on purpose: Arabic chains clauses
   * where English would stop, and the load a reader feels is per clause, not per full
   * stop. So this number is clauses, not sentences, and it is named accordingly.
   *
   * Fourth recalibration, from 6, and the honest reason: 6 was set while the counter
   * was broken in two directions at once (element boundaries swallowed full stops,
   * «د.ع.» invented them), so it was never measured against a real screen. Once the
   * counter told the truth, the two irreducible screens measured 9 and 11 — a ladder
   * pays about one clause per rung to say what the rung holds, and the rule workshop's
   * field helpers ARE the feature: «حصّته من بعد الخصم» is not decoration, it is the
   * definition of the option beside it. The ceiling is one clause above the worst
   * honest screen, so the next paragraph added anywhere fails immediately, and
   * `proseBlock` holds the line on shape rather than volume.
   */
  sentences: 12,
  /**
   * Instrument objects in the SUMMARY region: rails, gauges, charts.
   *
   * Also recalibrated: the rule is «two instruments on one screen compete, so the eye
   * reads neither», and one sparkline repeated once per row is not two competing
   * instruments — it is one instrument used consistently. Counting them globally
   * flagged /products for having six rows.
   */
  instruments: 1,
  /** Badges on one list row. */
  rowBadges: 2,
};

const ROUTES = [
  "/dashboard/", "/orders/", "/products/", "/reps/", "/reps/schemes/",
  "/targets/", "/ledger/", "/settlements/", "/access/", "/periods/", "/reports/",
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const over = [];

for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1700);
  const m = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const FIG = /[\d٠-٩][\d٠-٩,.٫]*/g;
    const shown = (el) => el.getClientRects().length > 0;

    /* An object that declares `role="img"` with an `aria-label` reads as ONE thing:
       that is what the attribute means. The Odometer is the case that forced this —
       it renders all ten digits per drum for the rolling effect, so a 7-digit figure
       put 70 glyphs into `innerText` and the first run of this gate reported 85
       "figures" in a summary that shows five. Counting the label instead measures
       what a reader actually reads. */
    const readable = (el) => {
      if (!el) return "";
      /* Mark what is NOT rendered before cloning: a clone is detached and has no
         geometry, and `textContent` happily reads a `sm:hidden` span. That is how the
         ledger row measured six figures — its date is printed twice, once for the
         phone layout and once for the desktop one, and only ever one is visible. */
      const marked = [];
      for (const node of el.querySelectorAll("*")) {
        if (!node.getClientRects().length) { node.setAttribute("data-dq-hidden", ""); marked.push(node); }
      }
      const clone = el.cloneNode(true);
      for (const node of marked) node.removeAttribute("data-dq-hidden");
      for (const gone of clone.querySelectorAll("[data-dq-hidden]")) gone.remove();
      for (const one of clone.querySelectorAll('[role="img"][aria-label]')) {
        one.replaceWith(document.createTextNode(" " + one.getAttribute("aria-label") + " "));
      }
      /* Text a sighted reader cannot see is not load either. */
      for (const hidden of clone.querySelectorAll(".sr-only,[hidden]")) hidden.remove();
      /* Joined with a SPACE at every text-node boundary, not concatenated.
         `textContent` glues «...الجديدة فقط.» to the next element's «تعديلها» with no
         separator, and this gate's clause regex needs whitespace after a terminator —
         so the run before this fix under-reported /reps/schemes at 13 clauses where
         the screen actually carries 26. A metric that flatters the screen is worse
         than no metric. */
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      const parts = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) parts.push(n.textContent);
      return parts.join(" ").replace(/\s+/g, " ");
    };
    const count = (el) => ((readable(el) || "").match(FIG) || []).length;

    /* The rows, declared by the app itself.
       Guessing them was the wrong design: a heuristic picked a six-chip legend over
       three tall cards on /reps, so the cards' own sparklines were counted as summary
       instruments, and it found no rows at all on /targets, which lumped a whole list
       into the summary figure. A list component knows it is a list, so it says so with
       `data-row`. The heuristics stay only as a fallback for a screen that has not been
       tagged yet — and a screen with rows and no tag will read as all-summary, which
       fails LOUD rather than passing quietly. */
    let rows = [...main.querySelectorAll("[data-row]")].filter(shown);
    if (!rows.length) rows = [...main.querySelectorAll("tbody tr")].filter(shown);

    const rowSet = new Set(rows);
    const inRow = (el) => { for (let n = el; n; n = n.parentElement) if (rowSet.has(n)) return true; return false; };

    /* The summary, PER PANEL: a panel's own figures minus the figures inside the
       rows it contains. A screen with no panels at all (an empty state, a form) is
       measured as one panel, so it can never pass by having no structure. */
    const all = count(main);
    const panels = [...main.querySelectorAll(".r-card")].filter(shown);
    const measure = (el) => {
      const own = [...el.querySelectorAll("[data-row], tbody tr, .r-datarow, .r-hbar")].filter(
        (r) => shown(r) && r.closest(".r-card") === el,
      );
      return Math.max(0, count(el) - own.reduce((a, r) => a + count(r), 0));
    };
    const rowFigs = rows.map(count);
    const panelFigures = panels.length
      ? Math.max(...panels.map(measure))
      : Math.max(0, all - rowFigs.reduce((a, c) => a + c, 0));
    const worstPanel =
      panels.length
        ? (panels
            .map((el) => ({ el, n: measure(el) }))
            .sort((a, b) => b.n - a.n)[0].el.querySelector("h2,h3")?.textContent || "بلا عنوان").trim()
        : "الشاشة";
    const summaryFigures = Math.max(0, all - rowFigs.reduce((a, c) => a + c, 0));

    /* Clauses: a terminator that ENDS a clause. A decimal point or a thousands
       separator inside a figure is not prose, so digits on both sides do not count.
       Counted on the summary region only, by the same subtraction as the figures. */
    const clauses = (s) =>
      /* «د.ع.» is a currency abbreviation, not two sentences. Every Iraqi amount on
         the screen carries two of these dots, so counting them made a money-dense
         instrument read as prose — three phantom clauses in the bench's split panel
         alone. An abbreviation is a run of single-letter-plus-dot pairs, and the
         lookbehind is load-bearing: without it «فقط.» matched as «ط.» and every real
         sentence lost its full stop, which under-reported this gate a second time. */
      ((s || "")
        .replace(/(?<![\u0621-\u064A])(?:[\u0621-\u064A]\.)+/g, " ")
        .match(/[.؟!،](?=\s|$)/g) || []).length;
    const sentences = Math.max(
      0,
      clauses(readable(main)) - rows.reduce((a, r) => a + clauses(readable(r)), 0),
    );

    /* The longest single block: one element's OWN text, not its descendants' — a
       card that contains three one-line hints is not a paragraph. */
    let proseBlock = 0;
    for (const el of main.querySelectorAll("p,span,div,dt,dd,li,td,th,h1,h2,h3")) {
      if (inRow(el) || !shown(el) || el.closest(".sr-only")) continue;
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join(" ");
      proseBlock = Math.max(proseBlock, clauses(own));
    }

    const instruments = [...main.querySelectorAll("svg")].filter((s) => {
      if (!shown(s)) return false;
      if (inRow(s)) return false;             // one per row is one instrument, used well
      const r = s.getBoundingClientRect();
      return r.width > 40 && r.height > 20;   // an icon is not an instrument
    }).length;

    const rowBadges = rows.map(
      (r) => [...r.querySelectorAll('[class*="badge"], [data-badge]')].filter(shown).length,
    );

    return {
      summaryFigures, panelFigures, worstPanel, screenFigures: all, sentences, proseBlock, instruments,
      rowCount: rows.length,
      maxRowFigures: rowFigs.length ? Math.max(...rowFigs) : 0,
      maxRowBadges: rowBadges.length ? Math.max(...rowBadges) : 0,
      totalFigures: all,
      height: document.documentElement.scrollHeight,
    };
  });

  const bad = [];
  if (m.panelFigures > BUDGET.panelFigures)
    bad.push(`panel «${m.worstPanel}» ${m.panelFigures}>${BUDGET.panelFigures}`);
  if (m.screenFigures > BUDGET.screenFigures)
    bad.push(`screen ${m.screenFigures}>${BUDGET.screenFigures}`);
  if (m.maxRowFigures > BUDGET.rowFigures) bad.push(`row ${m.maxRowFigures}>${BUDGET.rowFigures}`);
  if (m.sentences > BUDGET.sentences) bad.push(`prose ${m.sentences}>${BUDGET.sentences}`);
  if (m.proseBlock > BUDGET.proseBlock) bad.push(`block ${m.proseBlock}>${BUDGET.proseBlock}`);
  if (m.instruments > BUDGET.instruments) bad.push(`instruments ${m.instruments}>${BUDGET.instruments}`);
  if (m.maxRowBadges > BUDGET.rowBadges) bad.push(`badges ${m.maxRowBadges}>${BUDGET.rowBadges}`);

  const pad = (n, w) => String(n).padStart(w);
  console.log(
    `${bad.length ? "✗" : "✓"} ${route.padEnd(17)}` +
      `panel${pad(m.panelFigures, 3)}  screen${pad(m.screenFigures, 4)}  row${pad(m.maxRowFigures, 3)}  prose${pad(m.sentences, 4)}` +
      `  block${pad(m.proseBlock, 3)}` +
      `  instr${pad(m.instruments, 3)}  badge${pad(m.maxRowBadges, 3)}  (all ${m.totalFigures}, ${m.rowCount} rows)` +
      (bad.length ? `\n      over: ${bad.join(" · ")}` : ""),
  );
  if (bad.length) over.push({ route, bad });
}

console.log("\n" + "═".repeat(72));
console.log(
  over.length === 0
    ? "every screen is under the quiet ceiling (VISUAL-LAW §15)"
    : `${over.length} screen(s) over the ceiling`,
);
await browser.close();
process.exitCode = over.length ? 1 : 0;
