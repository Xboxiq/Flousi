# Phase A1 — the `anti-slop-ui` audit

Skill: `.claude/skills/anti-slop-ui/SKILL.md` (client-supplied, 30 banned patterns +
a 30-row verification matrix). Ran as an audit over the whole of `src/`, not as a
style preference.

## What the audit found

The 30 rules split cleanly in this codebase, and the split is not arbitrary — it
follows the surface:

* **The app surfaces** (dashboard, products, reports, periods, reps) were rebuilt
  through five visual-feedback batches into the v4 «المال الملموس» language. They
  already satisfy the skill's *intent* by a stricter law than the skill states, and
  they deliberately violate eight of its material rules. See the reconciliation in
  `design-system/VISUAL-LAW.md` §14.
* **The landing page** was never rebuilt. It is still the v1 generic-SaaS page, and
  the skill lands on it almost rule for rule. Every finding below is real.
* **Two of the skill's mandatory rules were simply missing** (#29 Terms, #30 Privacy).

## Gates

### G1 — no AI sparkle glyph anywhere (skill #19 / matrix 24)
CHECK: `grep -rniE "sparkle|magicwand" src/`
EXPECT: zero hits. The hero eyebrow carried `<Sparkle weight="fill">` — the literal
"AI magic" glyph the client has rejected by name three times in the ledger.
EVIDENCE: `grep -rniE "sparkle|magicwand" src/ | wc -l` → `0`

### G2 — no checkmark bullets in a feature list (skill #25 / matrix 16)
CHECK: read `landing-page.tsx` hero list.
EXPECT: the three proof points are typographic, carrying a real figure each, with no
`CheckCircle` icon. `Check` survives ONLY where it reports a committed state
(`Stepper`, `RitualButton`, `SlideToCommit`) — that is a state glyph, not a bullet.
EVIDENCE: `grep -rn "CheckCircle" src/ | wc -l` → `1`, and that one hit is the
comment naming what was removed and why. No import, no element.

### G3 — no radial orb soup, and one accent per screen (skill #11/#3, matrix 22/04)
CHECK: the hero background.
EXPECT: the three stacked `radial-gradient` blobs (blue 0.22 + cyan 0.18 + emerald
0.16) are gone. The hero stands on a flat sunken field with a hairline horizon; the
depth comes from the objects standing on it, not from a glow behind them. This is
also the client's own §6a (one accent per rail) and §2 (overhead light only) — a
corner blob is a light source with no position.
EVIDENCE: `grep -c "radial-gradient" src/presentation/features/landing/landing-page.tsx`
→ `0`

### G4 — no other company's brand as social proof (skill #26 / matrix 12)
CHECK: the marquee.
EXPECT: gone. It scrolled `Shopify · Etsy · Amazon · Instagram · TikTok Shop` under
the hero. Flousi has no relationship with any of them, so the row was an implied
affiliation — the skill's "made-up logos" clause, and a real trust problem, not a
styling one.
EVIDENCE: `grep -c "Shopify" src/` → `0`

### G5 — no invented metric presented as a platform fact (skill #26/#27)
CHECK: every figure printed on the landing page traces to code.
EXPECT: `~0ms لإعادة حساب الربح` and `37.9% متوسط الهامش` are gone — both were
fabricated. What remains is checkable:
  * «٧ بنود تكلفة» → `CostBreakdown` has exactly 7 lines
    (`purchase, shipping, packaging, marketplaceFees, paymentFees, taxes, other`).
  * «٤ صيغ تصدير» → `ExportFormat = "pdf" | "csv" | "xlsx"` plus `printReport()`.
  * «لا يغادر المتصفّح» → the only persistence adapter is
    `src/infrastructure/persistence/local-storage/`. There is no server.
The one grep hit for `0ms|37.9` under `features/landing/` is the file comment
recording the removal.
EVIDENCE: `grep -c "ExportFormat" src/domain/ports/services.ts` → `2`;
`sed -n '/interface CostBreakdown/,/^}/p' src/domain/entities/cost-breakdown.ts`
→ 7 fields.

### G6 — the landing page shows the real instrument (skill #27 / matrix 18)
CHECK: which components the page renders.
EXPECT: the hand-drawn fake `Sparkline()` (a 9-point SVG polyline) and `MiniBars()`
(six gradient rectangles) are gone. The page renders the SAME objects the app
renders: `PriceColumn`, `DistributionBar`, `Odometer`, `TickMeter`. A visitor looking
at the hero is looking at the product's own price-to-profit column.
EVIDENCE: `grep -n "components/objects" src/presentation/features/landing/landing-page.tsx`

### G7 — no bento collage, no 3-cards-in-a-row (skill #13/#14, matrix 06/13)
CHECK: the features and the how-it-works sections.
EXPECT: the `md:grid-cols-3` bento (2 wide + 1 dark + 1 + 2 wide) and the three
equal step cards are both gone. Rows 1 and 3 are two-column with the object in a
moulded housing on alternating sides; row 2 is a full-width band, because a bar
that divides a whole reads at full width — and that is where its legend has room
for its labels. The steps are a numbered spine, not cards.
EVIDENCE: `grep -c "md:grid-cols-3" landing-page.tsx` → `0`. One `grid-cols-3`
survives and is named: the hero's three-figure ledger (7 cost lines / 3 commission
methods / 4 export formats), which is a table of figures with hairline dividers,
not the icon-title-paragraph card grid rule #6 describes.

### G8 — no hover lift or scale (skill #21 / matrix 28)
CHECK: hover state changes on the landing page.
EXPECT: `bento-hover` (translateY lift) and `hover:scale-[1.02]` on the CTA are
gone. Hover moves colour and border only.
EVIDENCE: `grep -nE "bento-hover|hover:scale" src/presentation/features/landing/landing-page.tsx`
→ no match

### G9 — Terms of Service exists and is reachable (skill #29 / matrix 26)
CHECK: `/legal/terms` builds as a route and is linked with no dead `#` href.
EXPECT: a real page. Linked from the landing footer and from the settings data card.
EVIDENCE: build route list contains `/legal/terms`;
`grep -c 'href="#"' src/` → `0`

### G10 — Privacy Policy exists and is truthful (skill #30 / matrix 27)
CHECK: `/legal/privacy` builds, and every claim in it is true of the code.
EXPECT: the page states there is no account, no server, no analytics, no third
party — because there is none. A privacy policy that describes collection this app
does not do would be the slop version of complying.
EVIDENCE: build route list contains `/legal/privacy`;
`grep -rn "fetch(\|axios\|analytics\|gtag" src/ | wc -l` → `0` (nothing leaves)

### G11 — no em dash in user-visible copy (skill #23 / matrix 09)
CHECK: em dashes in strings and JSX text, not in code comments — the rule names
"headlines, titles, marketing subheaders".
EXPECT: the metadata title template, the periods drop-to-cancel line and the six
styleguide bay captions no longer use `—`. `«—»` as a table's empty-cell placeholder
stays: it is a typographic dash standing in for a missing value, not prose.
EVIDENCE: see the command in the closing section.

### G12 — the reconciliation is written down, not assumed
CHECK: `design-system/VISUAL-LAW.md` §14.
EXPECT: the eight material rules the app deliberately keeps are named one by one,
each with the reason and the stricter clause that governs it instead. A conflict
this size may not live only in a chat message.
EVIDENCE: §14 present with 8 rows.

## Closing evidence

    npm run typecheck && npm run lint && npm test && npm run build
      → clean · clean · 125 passed (8 files) · 23 static routes

    node .claude/skills/kill-ai-slop/scripts/scan.mjs src
      → 8 groups, 108 hits (was 9 groups / 117 before this phase: removing the
        landing page's slop lowered the count rather than trading it)

## What looking at the renders caught, that no grep could

Twelve proofs in `design-system/proofs/anti-slop-ui/` (landing + both legal pages
× light/dark × 1440/360), plus per-row and per-band shots at 360/768/1440.

1. **The first fix reintroduced the banned pattern.** Putting each object on a
   `.stage` light pool looked right in the law and wrong on the screen: the pool is
   an ellipse sized to its CONTAINER, so beside a lying bar or a small folder it
   rendered as a detached blue blob in empty space — `anti-slop-ui` #11's radial
   orb, arrived at from the opposite direction. Objects now sit in a moulded
   housing sized to them. A pool needs a subject standing in it.
2. The hero's sunken field was a fixed 420px band and sliced a hard horizontal
   line through the middle of the headline. The whole section is the field now.
3. `DistributionBar`'s legend labels are `flex-1 truncate`: at a half-column width
   they truncated to nothing, leaving two amounts and four «50%» readings colliding.
   The bar became the full-width band, capped at 820px so the cells stay tight.
4. A 6%-of-price cost slab clamps to the 15px floor and its label collides with the
   plate above it. Two fat cost lines in the sample instead of four thin ones.
5. `leading-[0.95]` is Latin display leading. In Cairo the ك of «ربحك» came down
   into the dots of «الحقيقي» on the line below. Raised to 1.2.
6. The figure ledger printed «٧ ٣ ٤» in Arabic-Indic digits beside an Odometer
   reading `6,312,000` in Latin ones. `format.ts` forces `numberingSystem: "latn"`
   everywhere; the ledger and both legal dates now match it.
7. **The new legal copy I wrote contained four em dashes** — the very rule this
   phase enforces, broken in the same commit that enforces it. Also caught two in
   the seeded rep notes, which are user-visible strings, not comments.
8. `.marquee-track` and its `@keyframes` were left behind with no consumer after
   G4: an unused infinite animation, against the motion budget.

Measured: no element overflows its box and no horizontal scroll at 1440 / 1024 /
768 / 390 / 360.

9. `leading-[0.95…1.08]` on every display heading, not just the h1: same defect,
   five places. All raised to 1.16–1.22 for Cairo.
