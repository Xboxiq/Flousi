# Flousi — working instructions

Arabic-first (RTL) local-first finance app: it computes the real net profit of what a
merchant sells, and splits it with reps who are paid a share of profit instead of a
salary. Next.js static export, no server, no accounts, `localStorage` only.

## The client's standing rule

> «الشركة ماتريد شي تقليدي من اي عمل مكرر او فكره مستهلكه او ذكاء اصطناعي سلوب»

Nothing generic ships. Every surface goes through `flousi-anti-slop-gate` and
`design-system/VISUAL-LAW.md` before it is called done.

## Skills: the primary source (client instruction, 2026-08-21)

> «راح ارسل لك مجموعة سكلز اريدك تبدأ تعتمدها ك مصدر اساسي للتعليمات والأفكار والبناء»

These are the FIRST place to look when building or reviewing, not a reference
consulted afterwards. All are vendored under `.claude/skills/` — see its README for
sources and what each one is for.

**Design and interface**
`ui-ux-pro-max` · `emil-design-eng` · `apple-design` · `better-ui` · `better-colors` ·
`better-accessibility` · `better-typography` · `better-layout` · `better-writing` ·
`frontend-ui-engineering` · `web-design-guidelines` · `antfu-design` · `frontend-design` ·
`impeccable` · `pick-ui-library` · `prototype`

**Motion**
`animate` · `animation-systems` · `animation-vocabulary` · `improve-animations` ·
`review-animations` · `find-animation-opportunities` · `fixing-motion-performance`

**Engineering**
`vercel-react-best-practices` (72 rules, impact-tagged) · `ponytail` (+ `-review`,
`-debt`) · `unlazy` (the gates method) · `layers-conceptual-model` / `layers-surface`

**Anti-slop (mandatory)**
`flousi-anti-slop-gate` · `anti-slop-ui` · `kill-ai-slop` · `baseline-ui`

### How a skill is used here

A skill's advice is applied only when it is **measured or seen** to help this app:

* `vercel-react-best-practices` said barrel imports are CRITICAL. Measured on this
  build: **0 KB difference** — Next 16 / Turbopack already handles it. The change was
  reverted. A no-op with a comment claiming a win is worse than no change.
* The same skill's `bundle-dynamic-imports` was measured too: **−351 KB (−27%)** on
  the dashboard's first load. That one stayed.
* Where a skill contradicts the client's own approved design language, the conflict is
  written into `design-system/VISUAL-LAW.md` §14 clause by clause — never resolved
  silently in either direction.

## Non-negotiables

1. **Money is integer minor units** in the domain (`Money`), major units in
   `application/` and up. Never mix. The scale is documented at every field that
   holds an amount.
2. **The domain is framework-free.** All arithmetic lives in `src/domain`; screens
   decide what to draw, never what is true.
3. **RTL by logical properties only** — `ms-/me-/ps-/pe-/text-start/text-end/
   inset-inline-*`. Figures sit in `<bdi dir="ltr">`. `Intl` with
   `numberingSystem: "latn"` everywhere, so one screen never mixes numeral systems.
4. **Arabic copy has no em dashes** and no number-agreement traps (`3 هدفًا` is wrong
   Arabic — use the colon form: «أهداف محدّدة: 3»).
5. **The gates method** (`unlazy`): every phase writes `gates/phase-*.md` with
   CHECK / EXPECT / EVIDENCE. A checked gate whose evidence says `pending` is worse
   than an unchecked one.
6. **Eye-verify every surface.** Build → serve `out/` → screenshot at light/dark ×
   1440/360 → *look at it*. Every defect worth fixing in this project so far was
   invisible to the typechecker, the linter and the tests.

## Commands

    npm run typecheck && npm run lint && npm test && npm run build
    node .claude/skills/kill-ai-slop/scripts/scan.mjs src
