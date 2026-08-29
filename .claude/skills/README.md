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
