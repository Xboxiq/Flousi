# Phase 3.1 — Dashboard art direction (gates)

Verified 2026-08-17. Visual verification done by eye on rendered proofs (not scan-only).

- [x] G1: chart obeys the chart law — Arabic tooltip labels, mount-only reveal, reduced-motion aware
  CHECK: grep -c "الإيراد\|صافي الربح" src/presentation/components/charts/profit-area-chart.tsx; grep -c "isAnimationActive\|useReducedMotion" src/presentation/components/charts/profit-area-chart.tsx
  EXPECT: /[1-9][\s\S]*[3-9]/
  EVIDENCE: tooltip labels now الإيراد/صافي الربح (were English "Revenue/Net profit" — vocabulary bug); isAnimationActive flips off after one 350ms ease-out mount reveal (80ms series stagger), disabled under reduced motion; tabular-nums on tooltip. Bonus: YAxis orientation="right" for RTL (verified in proof — axis sits on the reading-start edge)

- [x] G2: dashboard figures render through Money (recent sales + top products)
  CHECK: grep -c "<Money" src/presentation/features/dashboard/dashboard-view.tsx
  EXPECT: /[4-9]/
  EVIDENCE: 5 Money usages (quantity, revenue, net-profit-with-polarity, top-product values with polarity)

- [x] G3: top-product bars are solid accent on a quiet track (no gradient fill, no legacy neu-inset)
  CHECK: grep -c "neu-inset\|linear-gradient(90deg" src/presentation/features/dashboard/dashboard-view.tsx || true
  EXPECT: 0
  EVIDENCE: 0 — bars are bg-accent on bg-sunken track

- [x] G4: health suite green (typecheck, lint, tests, build)
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build; echo SUITE_OK
  EXPECT: SUITE_OK
  EVIDENCE: TYPECHECK_OK · LINT_OK · "Tests 24 passed (24)" · BUILD_OK (static export)

- [x] G5: proof screenshots saved — light/dark × 1440/360, RTL
  CHECK: ls design-system/proofs/dashboard | wc -l
  EXPECT: /[4-9]/
  EVIDENCE: 4 proofs. Eye-verified findings FIXED during this pass: Eastern-Arabic date digits mixed with Latin money digits (new formatDate forces latn; applied dashboard + periods); English loading-state copy in periods ("Accounting periods"); hero KPI wrapped awkwardly at 360px (now text-display sm:text-kpi); product-name cells wrapped to 4 lines at 360px (whitespace-nowrap + existing scroll container); CountUp used browser locale (now settings locale + latn)

- [x] G6: slop scan not regressed (≤ 88 hits)
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src 2>&1 | tail -1
  EXPECT: hits ≤ 88
  EVIDENCE: "9 groups, 84 hits" — down 4 more (gradient bar fill removed, neu-inset track removed)
