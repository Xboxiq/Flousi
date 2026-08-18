# Phase 2 — Signature system (gates)

Method: unlazy. A gate is UNMET if unchecked or if EVIDENCE reads `pending`.
Verified 2026-08-17 on branch `claude/professional-design-system-c0m4ei`.

- [x] G1: SIGNATURE.md documents all 5 devices with usage law + implementation file each
  CHECK: grep -c "^## " design-system/SIGNATURE.md
  EXPECT: /[5-9]/
  EVIDENCE: 6 sections (5 devices + amendment protocol), each with What/Law/Implementation

- [x] G2: LivingNumber exists — change-reactive (animates from live displayed value), reduced-motion snap, LTR bdi
  CHECK: grep -c "useReducedMotion\|requestAnimationFrame\|bdi" src/presentation/components/interactive/living-number.tsx
  EXPECT: /[3-9]/
  EVIDENCE: 6 matches — interruptible glide via liveRef (animates from current presentation value, per review-animations standards), 280ms ≤ 300ms cap, snap under reduced motion

- [x] G3: ProfitPanel — three worded polarity states (رابح/خسارة/تعادل), Living Number wired, zero backdrop-blur, zero ghost border+shadow combos
  CHECK: grep -c "تعادل\|LivingNumber" src/presentation/features/products/profit-panel.tsx; grep -c "backdrop-blur\|border-border-soft" src/presentation/features/products/profit-panel.tsx || true
  EXPECT: /[2-9][\s\S]*0/
  EVIDENCE: 4 then 0 — POLARITY map words all three states (state in words+icon first, color reinforces); hero number is LivingNumber inside aria-live=polite; metric tiles + cost breakdown migrated to shadow-card; badge blur removed (also removed from dashboard hero badge)

- [x] G4: one mesh moment per app screen (dashboard 1, profit-panel 1, reports-hub 1)
  CHECK: for f in features/dashboard/dashboard-view features/products/profit-panel features/reports/reports-hub; do grep -c "MeshSurface\|mesh-aurora\|mesh-night" "src/presentation/$f.tsx"; done
  EXPECT: one mesh surface each
  EVIDENCE: dashboard 3 lines = import+open+close of ONE MeshSurface; profit-panel 3 lines = import+open+close of ONE; reports-hub 1 line = featured card only (was 5 mesh headers — 4 demoted to quiet cards this phase). Landing still has 3 mesh surfaces — explicitly deferred to Phase 4 art direction (recorded in SIGNATURE.md §4 status)

- [x] G5: orbs mark selection/progression only on app surfaces (no decorative orbs in features outside landing/styleguide)
  CHECK: grep -rn "GlossyOrb" src/presentation/features --include="*.tsx" | grep -v landing | grep -v styleguide | wc -l
  EXPECT: 0
  EVIDENCE: 0 — orbs live only in stepper.tsx (progression) + landing (Phase 4 scope) + styleguide (documentation)

- [x] G6: typecheck green
  CHECK: npm run typecheck > /dev/null 2>&1 && echo TYPECHECK_OK
  EXPECT: TYPECHECK_OK
  EVIDENCE: TYPECHECK_OK

- [x] G7: all unit tests pass
  CHECK: npm run test 2>&1 | grep -E "Tests .*passed"
  EXPECT: passed
  EVIDENCE: "Tests  24 passed (24)"

- [x] G8: lint clean
  CHECK: npm run lint > /dev/null 2>&1 && echo LINT_OK
  EXPECT: LINT_OK
  EVIDENCE: LINT_OK

- [x] G9: production build succeeds
  CHECK: npm run build > /dev/null 2>&1 && echo BUILD_OK
  EXPECT: BUILD_OK
  EVIDENCE: BUILD_OK — all routes static/SSG

- [x] G10: slop scan not regressed (≤ 90 hits, new hits zero)
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src 2>&1 | tail -1
  EXPECT: hits ≤ 90
  EVIDENCE: "9 groups, 88 hits" — down 2 (dashboard 44px arbitrary size → text-kpi role; badge blur removals). Leftovers unchanged from the Phase 1 triage ledger
