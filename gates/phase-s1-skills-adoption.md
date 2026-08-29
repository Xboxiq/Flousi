# Phase S1 — adopting the client's skill set as the primary source

> «راح ارسل لك مجموعة سكلز اريدك تبدأ تعتمدها ك مصدر اساسي للتعليمات والأفكار والبناء
> وتستخدمها بشكل أساسي في تطوير وبناء المشروع ونشوف شنو منها يقترح لك في المشروع»

Nineteen `npx skills add` lines. Ten were already vendored in batch 1. Six new ones
installed. One does not exist.

## G1 — installed, pinned, and recorded
CHECK: every requested skill is present, or its absence is explained.
EXPECT: six new skills under `.claude/skills/` with commits pinned in
`skills-lock.json`. `antfu/skills --skill frontend-design` does NOT exist in that
repository — its design skills are `web-design-guidelines` and `antfu-design`, and
both were installed instead. Said out loud rather than silently substituted.
EVIDENCE: `ls .claude/skills` → 38 entries; `skills-lock.json` carries the commits;
`.claude/skills/README.md` has the batch-2 table with what each is FOR here.

## G2 — the instruction persists past this session
CHECK: will the next session know these are the primary source?
EXPECT: a chat message is not an instruction, it is a memory. `CLAUDE.md` now carries
the client's sentence, the skill roster grouped by job, and the rule for how a
skill's advice earns its way into this codebase.
EVIDENCE: `CLAUDE.md` present at the repo root.

## G3 — advice is MEASURED before it is applied
CHECK: did anything get changed on a skill's word alone?
EXPECT: no. Two rules from `vercel-react-best-practices` were tested against this
build, and they came out opposite:

| Rule | Impact claimed | Measured here | Kept? |
|---|---|---|---|
| `bundle-barrel-imports` | CRITICAL | `optimizePackageImports` for phosphor/recharts/motion → **3,245 KB before, 3,245 KB after. Zero.** Next 16 + Turbopack already handles those barrels | **Reverted.** A no-op carrying a comment that claims a win is worse than no change |
| `bundle-dynamic-imports` | CRITICAL | Recharts is 380 KB and the chart sits below the fold behind the hero, the KPI pair and the distribution bar → dashboard first load **1,308 KB → 957 KB, −351 KB (−27%)** | **Kept**, behind a skeleton the exact height of the chart so nothing shifts |

EVIDENCE: the measurement script counts the chunks each route's HTML actually
references, before and after, from two build outputs. The chart was then rendered and
eye-verified: `svg.recharts-surface` present, no console errors, no layout shift.

## G4 — the localStorage rule, adapted rather than obeyed
CHECK: `client-localstorage-schema` says version the keys.
EXPECT: the rule's PURPOSE (safe schema evolution) is taken; its letter is not.
Renaming `ritm:products` to `ritm:products:v3` would orphan every store already
in the field on the first release that got the rename wrong. Instead a
`ritm:schema-version` stamp drives an ordered migration list.

The real bug it exposed: `runMigrations` inspected the DATA on every boot to decide
whether a lift had already happened, so a store migrated months ago still re-read
settings, re-listed targets and re-tested them on every single launch, forever. Now a
migrated store does one integer read and stops.
EVIDENCE: 6 new tests — a pre-stamp store lifts and gets stamped; a stamped store does
nothing even with a legacy value sitting there; a fresh store is stamped without
lifting; a junk stamp is distrusted; a FUTURE stamp is left alone (a newer build
already migrated it); and the lifts stay individually idempotent, because a stamp can
be lost and the stamp saves work rather than licensing carelessness.

## G5 — `web-design-guidelines` run as a real audit, not quoted
CHECK: the skill fetches the Vercel Web Interface Guidelines and reviews code.
EXPECT: run against `src/`, every anti-pattern checked mechanically, and the findings
separated into real and false.

**Real, fixed:**
* `touch-action: manipulation` was missing everywhere. Every tap on a touch device was
  waiting ~300ms for a possible second tap. On a shop counter that is felt on every
  key. Added to buttons, links and `[role=button]` only — pinch zoom untouched, which
  the same guidelines require.
* `overscroll-behavior: contain` was missing on all four scrolling overlays (the
  dialog body, the command palette's list, the sidebar nav). Reaching the end of a
  sheet started scrolling the page behind it, which on a phone reads as the sheet
  slipping.

**Flagged but compliant — not "fixed":**
* `focus:outline-none` in `ui/input.tsx` and the palette input. The guideline forbids
  it *without a replacement*; the compound control's wrapper carries
  `focus-within:outline-2`, which is the replacement that same guideline prescribes.
* the `<div onClick>` in `mobile-nav.tsx` is a delegating wrapper that closes the
  drawer when a LINK inside it is activated — the links are the controls and keep their
  keyboard behaviour. Left as it is, with a comment saying so, because a reviewer
  cannot tell a delegating wrapper from a div-as-button by looking.

**Real, recorded, NOT done:** filter and tab state lives in `useState`, so the ledger
filtered to settlements cannot be bookmarked or shared and Back does not undo a
filter. Correct per the guidelines and worth doing; it needs `useSearchParams` plus a
Suspense boundary on four screens under `output: export`, which is its own phase
rather than a half-landing here.

## G6 — nothing regressed
EVIDENCE: 233 tests across 14 files, five consecutive green runs; typecheck, lint and
build clean; 26 static routes.

One run mid-way reported a single failure. It was not a flake in the suite: the run
raced a file I was writing at that moment. Five clean runs afterwards on an untouched
tree, and it is recorded here rather than waved away, because a money app cannot have
a test nobody trusts.

## Closing evidence

    npm run typecheck && npm run lint && npm test && npm run build
      → clean · clean · 233 passed (14 files) · 26 routes

    dashboard first-load JS: 1,308 KB → 957 KB
