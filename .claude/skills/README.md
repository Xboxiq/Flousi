# Flousi — vendored agent skills

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
| `anti-slop-ui` | **Client-supplied** (uploaded 2026-08-18) | 30 banned UI/UX patterns + a 30-row matrix. Audit run in `gates/phase-a1-anti-slop-ui.md`; the eight material rules Flousi deliberately breaks are reconciled clause by clause in `design-system/VISUAL-LAW.md` §14 |
| `flousi-anti-slop-gate` | **Flousi-owned** | Consolidated mandatory pre-delivery gate |

Consulted but not vendored: `Leonxlnx/taste-skill` (landing-page scoped; its AI-tells
and pre-flight folded into `flousi-anti-slop-gate`), `VoltAgent/awesome-design-md`
(reference URLs recorded in the plan), `ckissi/kinetics` and `Subhan-code/Amicro`
(component galleries — mined for spring/easing values, recorded in MASTER §5),
`DietrichGebert/ponytail` agents surface, `pols.dev/slop.md` (folded into the gate).
