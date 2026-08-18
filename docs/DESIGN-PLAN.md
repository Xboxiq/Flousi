# Flousi — خطة التطوير والديزاين v4 «المال الملموس»

> **الملخص التنفيذي (عربي):**
> العميل غير راضٍ عن الشكل الحالي: محافظ، مسطّح، لا يفاجئ أحداً. القرار: تحول
> إبداعي كامل — تصميم مُجسّم سينمائي غني بالتفاصيل: أجسام ثلاثية الأبعاد (عملة،
> خزنة، إيصال، كرات زجاجية)، خامات حقيقية (زجاج، ميش محبب، معدن، صلصال ناعم)،
> إضاءة موحدة المصدر، موشن فيزيائي مُخرَج مشهدياً، وصور/أصول بصرية مُصنّعة
> خصيصاً — **بقانون واحد فقط: ممنوع الـ AI slop** (البوابة في
> `.claude/skills/flousi-anti-slop-gate/`)، ومعه أرضيات الجودة غير الجمالية
> (الوصولية، RTL، الأداء). كل قيود «الرصانة» السابقة أُلغيت رسمياً
> (`design-system/MASTER.md` §9). الخطة تبدأ **ببروفة اتجاه** على شاشة واحدة
> تُعتمد قبل التعميم، ثم مسبك أصول، ثم إعادة إخراج كل شاشة كمشهد.

**Contract:** `design-system/MASTER.md` v4 + the anti-slop gate. **Branch:** `claude/professional-design-system-c0m4ei`.
**Method unchanged:** unlazy gates per phase + eye-verified screenshot proofs
(build → serve `out/` → playwright shots light/dark × 1440/360 RTL → look at them).

---

## Phase D0 — بروفة الاتجاه (Direction Proof) — FIRST, before everything

Rebuild **one surface** end-to-end at full v4 fidelity as the taster the client
approves or corrects — cheap to redo, decisive for everything after.

**Chosen surface: الحاسبة `/calculator`** (the purest stage: one hero, the Living
Number, inputs, no data-table baggage) **+ لمحة داشبورد hero** (the coin's debut).

D0 scope:
1. **The Coin v1** — CSS/SVG glossy dinar coin (metal material, specular, cast
   shadow, idle float ≤ subtle, pointer tilt ≤ 6°).
2. **Calculator as a scene:** dark `night` mesh field OR light clay stage (build
   both, pick by proof), glass result panel, digit-roll Living Number, clay
   inputs with press depth, one orchestrated entrance (≤ 700ms), polarity morph
   with mesh crossfade, ritual micro-moment on "احفظ كمنتج".
3. Proof screenshots + a short screen-recording-style GIF if feasible.
4. Client reviews → direction locked or adjusted → THEN D1+ rolls out.

Gates: proofs exist and eye-verified · anti-slop matrix clean · a11y floors hold
on the busy scene (contrast measured over materials) · suite green.

## Phase D1 — مسبك الأصول (Asset Foundry)

Build the object cast + document it:
- **Primary source: the client's own `Xboxiq/nova`** — 15 ported recipes in
  `design-system/RECIPES.md` (mesh money field, two-lip glass, conic rim,
  pointer foil for the Coin, RTL-safe 3D face rig for the Vault, three-role
  shadows, state leaks, metal switch, drum picker, ritual button…). Techniques
  ported, hexes rebound to Flousi tokens (nova's violet is not).
- Coin (hero + small), Orb family v2 (active/idle/done/danger), Vault, Receipt,
  Chart blocks, 4–6 spot illustrations (onboarding, empty-products, backup,
  error) — CSS/SVG first, layered-SVG second, generated renders last resort.
- Every object passes the image-grade standard (MASTER §3b) and VISUAL-LAW
  clause by clause.
- `design-system/ASSETS.md`: source/prompt/license/usage for every asset.
- `public/assets/3d/` pipeline: WebP/AVIF, budgets (hero ≤ 200KB, spot ≤ 80KB),
  lazy below the fold.
- Storybook page in `/styleguide`: the full cast rendered in both themes.

## Phase D2 — خامات وحركة (Material & Motion tokens)

Extend `globals.css` + `lib/motion.ts` with the v4 vocabulary:
- Materials: `.glass` (+ reduced-transparency fallback), `.clay` /
  `.clay-pressed`, `.metal`, mesh family v2 (`aurora/dawn/night/ember`), scene
  field utilities, scrim-for-text-on-material utility.
- Light tokens: `--light-x/y` constants; specular/cast-shadow recipes per side.
- Motion: `scene()` orchestrator preset (staggered children), `tiltHover`,
  `objectSpring` (260–360/18–28), `digitRoll`, `ritual()` sequence helper;
  chart draw-on-mount preset.
- Depth: z-layer scale (field / mid / focal / chrome / overlay).

## Phase D3 — كل شاشة مشهد (Scene-by-scene rebuild)

Order by impact; each screen = gates file → build → 4 passes → anti-slop matrix
→ proofs. Per-screen art direction (one line each):

| # | Screen | Scene |
|---|---|---|
| D3.1 | **Dashboard** | The counting-house: coin hero on mesh field, KPI bento with mixed materials (glass/mesh/ink), chart draws once, tables calm ink islands. |
| D3.2 | **Products** | The shelf: product rows with profit polarity, object empty-state, filter pills as clay segments. |
| D3.3 | **Product form + ProfitPanel** | The workbench: cost lines as connected clay stepper, glass Living-Number panel floating sticky, save ritual. |
| D3.4 | **Periods** | The vault: open month breathing on the field, close = lock ritual (dialog sequence: summary folds → vault shuts → new month slides in), history as locked-safe cards. |
| D3.5 | **Reports** | The archive: report covers with chart-block objects, one featured mesh cover, export bar with real affordances, print stays ink-pure. |
| D3.6 | **Settings** | The back office: grouped clay panels, orb radio for theme, danger zone with ember material + worded confirm. |
| D3.7 | **App shell** | The stage: glass top chrome, sidebar with depth-lit active state, page transitions direction-aware. |
| D3.8 | **الفريق Reps** (`docs/PRODUCT-PLAN.md`) | The partners' table: rep cards with orb status, Living-Money balances, metal target arcs; top seller holds the Coin. |
| D3.9 | **التسويات Settlements** | The receipt ritual: paying a rep pours the balance into a stamped receipt; history as sealed receipts. |
| D3.10 | **الأهداف + دفتر الحركة** | Target arcs (no default progress bars) + the calm ink ledger: every dinar's story — what happened, who, where it went. |

## Phase D4 — صفحة الهبوط (The showpiece)

Full cinematic marketing surface: floating 3D objects hero with parallax
(coin + receipt + glass panel over mesh field), scroll-choreographed sections
(each a different layout family), the real live calculator embedded, honest
demo numbers, one signature moment worth screenshotting. This is where the
direction earns shares.

## Phase D5 — التقسية (Hardening)

- Contrast audit ON the materials (text-over-mesh gets scrims; measure painted
  pixels, both themes), keyboard walks, reduced-motion/transparency parity
  proofs (scenes must degrade gracefully, not break).
- Performance: asset budget ledger, LCP/INP/CLS measured on Pages build and
  pasted as evidence; font subsetting; no layout-thrashing motion
  (fixing-motion-performance skill pass).
- RTL sweep on every new scene (light source top-start, flipped icons, digits).
- Export/print surfaces re-branded to v4 (covers, headers) while staying ink.

## Enforcement (unchanged, permanent — expanded with nova's process)

- Anti-slop gate matrix per surface — the ONE law.
- Gates files with evidence; eye-verified proofs in `design-system/proofs/`.
- **Design-law gates (from nova):** visual laws become runnable checks — gates
  that parse the code and FAIL the build when physics lies (e.g. side-wall
  brightness values must be equal per VISUAL-LAW §2; all three shadow roles
  present via `data-part="contact|cast|occlusion"` attributes; state-bound
  details asserted as conditions, not ornaments). Elements get `data-*` part
  names purely so gates can read them.
- **Proofs matrix widened:** every visual change proven in RTL AND LTR, light
  AND dark (nova's qa convention).
- **Rejection log** maintained in VISUAL-LAW.md — refused references recorded
  with reasons; a reference appearing twice is not an argument.
- **Dial declaration:** every scene brief opens with three dials out of 10
  (variance / motion / density) so no agent silently picks its own intensity.
  Flousi v4 defaults: variance 8 · motion 6 · density 6 (nova's calibration).
- Suite green per push (typecheck/lint/test/build) + scan.mjs trend recorded,
  suppressions only via `/* deslop-ignore */` with the justification comment.
- SESSION-LOG row per session.

## Skill routing (v4 emphasis)

| Skill | Drives |
|---|---|
| `impeccable` (bolder / delight / overdrive / animate refs) | pushing surfaces past safe; critique passes |
| `frontend-design` | direction decisions, signature moments, matching complexity to vision |
| `animate`, `emil-design-eng`, `apple-design`, `animation-systems` | choreography, springs, gestures, materials |
| `fixing-motion-performance` | keeping the cinema at 60fps |
| `beautiful-shadows`, `better-colors/-typography/-layout/-accessibility` | craft floors on materials |
| `kill-ai-slop` + `flousi-anti-slop-gate` | the law |
| `unlazy`, `ponytail` | process discipline (gates; lazy code never lazy craft) |
| `ui-ux-pro-max` data | finance patterns / chart selection cross-checks |

## Standing risks / decisions

- **Direction proof gate:** nothing rolls out before D0 is approved by the client.
- **Text over rich materials** is the #1 a11y risk — scrim utility is mandatory
  wherever body text sits on mesh/glass.
- **Static export + heavy assets:** budgets enforced per asset; WebGL (three.js)
  is allowed for ONE landing hero only if CSS/SVG proves insufficient, behind
  lazy load + reduced-motion fallback.
- Client reference design-system files (Apple etc.), when attached, feed the
  material/light language through the same intake protocol
  (`references/design-systems/` + delta memos) — they refine v4, not resurrect v3.
- **Product track:** the roles/reps/profit-sharing system is specified in
  `docs/PRODUCT-PLAN.md` (P1 engine+team → P2 targets/ledger/settlements →
  P3 cloud access). P1 builds directly in v4 language; the split-preview at
  sale time is that flow's designed ritual. Sequencing: D0 → P1 ∥ D1–D2 →
  P2 + D3 → D4 → D5 → P3.
