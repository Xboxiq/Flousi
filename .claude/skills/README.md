# RITM — vendored agent skills

Installed 2026-08-17 as part of Design Plan v3 (`docs/DESIGN-PLAN.md`, routing table
inside). These load automatically in Claude Code sessions for this repo.

| Skill(s) | Source | Note |
|---|---|---|
| `impeccable` | github.com/pbakaus/impeccable | Full skill + 59-rule detector CLI |
| `frontend-design` | github.com/anthropics/skills | Anti-generic aesthetics (LICENSE.txt included) |
| `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design`, `emil-design-eng` | github.com/emilkowalski/skills | Motion standards for motion/react |
| `animation-systems`, `beautiful-shadows` | github.com/MengTo/Skills | Duration/stagger tables; layered shadows (demos stripped) |
| `better-*`, `interface-review` | github.com/jakubkrehel/skills | Numeric floors: type, spacing, color, a11y, RTL |
| `baseline-ui`, `fixing-motion-performance`, `create-design-md` | github.com/ibelick/ui-skills | Tailwind + motion/react guardrails |
| `ui-ux-pro-max` | github.com/nextlevelbuilder/ui-ux-pro-max-skill | Selective vendor: finance/chart/typography CSVs + search scripts (google-fonts.csv dropped; Arabic rows extracted) |
| `kill-ai-slop` | github.com/yetone/kill-ai-slop | Slop taxonomy + scan.mjs |
| `unlazy` | github.com/Leonxlnx/unlazy | Gates method + gate-check.mjs |
| `ponytail`, `ponytail-review`, `ponytail-debt` | github.com/DietrichGebert/ponytail | Code-quality ladder (scoped to logic/deps, never design polish) |
| `layers-conceptual-model`, `layers-surface` | github.com/jamiemill/layers-skills | Object model + vocabulary method |
| `anti-slop-ui` | **Client-supplied** (uploaded 2026-08-18) | 30 banned UI/UX patterns + a 30-row matrix. Audit run in `gates/phase-a1-anti-slop-ui.md`; the eight material rules RITM deliberately breaks are reconciled clause by clause in `design-system/VISUAL-LAW.md` §14 |
| `ritm-anti-slop-gate` | **RITM-owned** | Consolidated mandatory pre-delivery gate |

## Batch 2 — installed 2026-08-21 on the client's instruction

> «راح ارسل لك مجموعة سكلز اريدك تبدأ تعتمدها ك مصدر اساسي للتعليمات والأفكار والبناء»

Installed with the `skills` CLI (`npx skills add`), which vendors into `.agents/skills/`
and symlinks from `.claude/skills/`. `skills-lock.json` records the exact commits.

| Skill | Source | What it is actually for here |
|---|---|---|
| `vercel-react-best-practices` | github.com/vercel-labs/agent-skills | 72 impact-tagged rules. The highest-value one so far: `bundle-dynamic-imports` cut 351 KB off the dashboard. `client-localstorage-schema` drove the schema-version stamp |
| `frontend-ui-engineering` | github.com/addyosmani/agent-skills | Production-quality UI checklist: a11y, state, responsive |
| `web-design-guidelines` | github.com/antfu/skills | A REVIEW skill: fetches the Vercel Web Interface Guidelines and audits code against them. Found the missing `touch-action` and `overscroll-behavior` |
| `antfu-design` | github.com/antfu/skills | UnoCSS-first token conventions. RITM is Tailwind v4, so its *token* discipline applies and its UnoCSS mechanics do not |
| `pick-ui-library` | github.com/emilkowalski/skills | Choosing a component library. RITM owns its primitives on purpose; kept for the day a headless dep is considered |
| `prototype` | github.com/emilkowalski/skills | Fast throwaway prototypes before committing to a build |

**Requested but does not exist:** `antfu/skills --skill frontend-design`. That repo has
no such skill; its design skills are `web-design-guidelines` and `antfu-design`, both
installed above. (`frontend-design` from `anthropics/skills` was already vendored in
batch 1 and is unrelated.) The rest of the client's list was already installed:
`find-animation-opportunities`, `emil-design-eng`, `animation-vocabulary`,
`ui-ux-pro-max`, `improve-animations`, `apple-design`, `review-animations`,
`better-ui`, `better-accessibility`, `better-colors`.

Consulted but not vendored: `Leonxlnx/taste-skill` (landing-page scoped; its AI-tells
and pre-flight folded into `ritm-anti-slop-gate`), `VoltAgent/awesome-design-md`
(reference URLs recorded in the plan), `ckissi/kinetics` and `Subhan-code/Amicro`
(component galleries — mined for spring/easing values, recorded in MASTER §5),
`DietrichGebert/ponytail` agents surface, `pols.dev/slop.md` (folded into the gate).

## Batch 3 (client instruction, 2026-08-26): beautifului.dev · rare-ui · transitions.dev

| skill / source | from | what it is here for |
| --- | --- | --- |
| `transitions-dev` | github.com/Jakubantalik/transitions.dev | 32 portable CSS transitions, each namespaced `t-*` with semantic custom properties and a reduced-motion guard. The house source for micro-transitions from now on. First adoptions: the grid-rows accordion (the ladder and order panels), the sliding segmented pill, the wrong-PIN shake, the theme icon swap |
| `transitions-polish` | github.com/Jakubantalik/transitions.dev | The tuning half: the motion-token scale and the rules for open/close asymmetry, hover in/out, stagger offsets. Used to REVIEW motion, not to add it |

**Studied, adapted inline rather than vendored:**

* `swamimalode07/rare-ui` — a shadcn registry of 16 Motion components, not a skill.
  Most are showpieces the anti-slop gate would reject on a finance app (fluid WebGL
  orb, gravity letters, emoji reactions). What maps to real RITM objects is
  adapted in place with an attribution comment: the OTP-style rolling input
  (the owner-PIN sheet). The folder fan-out was already built independently in v4
  (`report-folder.tsx`) — convergent, not copied.
* `https://www.beautifului.dev/` — AI-interface primitives (thinking states,
  streaming text, approval cards, diff tables). RITM has no AI surface, so almost
  nothing applies today. Recorded so the next reader does not re-derive that
  conclusion. If an AI feature ever lands, start there.

## Batch 3 — installed 2026-09-01 on the client's instruction

The client asked for two plugin bundles:

    /plugin marketplace add anthropics/skills
    claude plugins install mattpocock-skills

Neither command runs in this remote session: `/plugin` is not available here, and
plugin installation is a local-CLI operation. Both repositories ARE reachable, so
they were vendored the way this repo has always vendored skills — copied under
`.claude/skills/`, sourced in this table.

### github.com/mattpocock/skills

| Skill | What it is actually for here |
|---|---|
| `grill-me`, `grilling`, `grill-with-docs` | The interrogation method: turn an underspecified ask into a decided one by asking one question at a time. This is what the client reached for first, and it is the right tool for a request like «تناسب أكثر من غرض» |
| `to-spec`, `to-tickets`, `to-questionnaire` | Vague ask → written spec → tickets. The missing front half of this project's gates method |
| `domain-modeling` | The highest-value one for RITM: the product's whole worth is a framework-free domain where money is integer minor units. Widening it to more than one kind of business is a domain-modelling problem before it is a screen problem |
| `codebase-design`, `improve-codebase-architecture` | Structure review above the file level |
| `wayfinder`, `research`, `triage`, `wait-what` | Orientation in an unfamiliar area, and context mapping |
| `diagnosing-bugs`, `tdd`, `implement`, `wizard` | Execution discipline. `tdd` sits beside `unlazy`'s gates rather than replacing them |
| `handoff`, `teach`, `writing-for-agents` | Writing for the next session, which this project does constantly |

**Deliberately skipped:** `ask-matt` and `setup-matt-pocock-skills` (installer/authorial,
not applicable), `migrate-to-shoehorn`, `scaffold-exercises`, `git-guardrails-claude-code`,
`setup-pre-commit` (tooling this repo does not use), everything under `deprecated/` and
`in-progress/`, and `prototype` + `code-review` (already vendored from other sources —
vendoring a second copy under the same name would shadow one of them).

### github.com/anthropics/skills

| Skill | What it is actually for here |
|---|---|
| `webapp-testing` | Browser-driven verification. This project already does exactly this by hand in `scripts/sweeps/`; the skill is the method written down |
| `brand-guidelines` | Brand-system discipline, next to `design-system/VISUAL-LAW.md` |
| `theme-factory` | Theming method. RITM is two hand-tuned token blocks, so this is a reference, not a generator |

**Deliberately skipped:** `docx`, `pdf`, `pptx`, `xlsx`, `skill-creator`, `claude-api`
and `frontend-design` are already available in these sessions (and `frontend-design` was
vendored in batch 1) — a second copy is dead weight and a name collision. `canvas-design`
is 5.6 MB of assets for a job this repo does not have. `academy-guide`,
`slack-gif-creator`, `internal-comms`, `doc-coauthoring`, `discernment-nudge`,
`mcp-builder`, `algorithmic-art`, `web-artifacts-builder` are out of scope for a
local-first Arabic finance app.

**The rule stays the rule** (see the top of this file and `CLAUDE.md`): a vendored
skill's advice is applied only when it is MEASURED or SEEN to help this app. Installing
one is not adopting it.

## Batch 4 — installed 2026-09-02 on the client's instruction

    npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"

| Skill | Source | What it is actually for here |
|---|---|---|
| `design-taste-frontend` | github.com/Leonxlnx/taste-skill | The FULL anti-slop frontend method, of which `ritm-anti-slop-gate` already carries a consolidated extract. Installed via the `skills` CLI, so `skills-lock.json` records the exact commit and `.claude/skills/` symlinks into `.agents/skills/` |

**Read the scope line before applying it.** The skill says so itself, in its own
opening: *"Landing pages, portfolios, and redesigns. Not dashboards, not data
tables, not multi-step product UI."* RITM is a dashboard, data tables and
multi-step product UI. So its **brief-inference** section (§0) and its
**anti-templated** discipline apply here; its landing-page aesthetics do not
transfer to `/orders` or `/ledger` without the same clause-by-clause
reconciliation the other design skills got.

`taste-skill` was already one of the sources consolidated into
`ritm-anti-slop-gate` (see that skill's own header). What is new is the complete
original beside the extract — useful as a reference, and a live conflict risk with
`design-system/VISUAL-LAW.md` §14, §23 and §25, all three of which were settled by
MEASUREMENT on this app. The standing rule holds: where a skill contradicts a law
this project arrived at by measuring, the conflict is written into VISUAL-LAW
clause by clause, never resolved silently in either direction.
