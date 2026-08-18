# P1 — محرك القسمة والفريق (the commission engine + the team)

The client's own words define this phase: «عندي مندوبين يشتغلون عندي ومثلا مايعطي
للمندوب راتب إنما يعطي نصف ربح المنتج — مثلا منتج ب عشره يبيعه المندوب ب عشرين
يربح عشره تكون نصف له ونصف لصاحب البيج». Plus: «تكون هناك مرونة في التخصيص وان
يكون هناك تنظيم وتضبيط متكامل».

Locked decisions (PRODUCT-PLAN §7): profit basis per scheme and editable · 50%
default · loss sharing an option · settlement currency present and editable.

- [ ] G1: the client's example is a verbatim green test
  CHECK: npm run test -- --reporter=verbose | grep -i "10\|5/5"
  EXPECT: cost 10 → sold 20 → 5 rep / 5 owner, asserted literally, FIRST in the file
  EVIDENCE: pending

- [ ] G2: no floating-point money anywhere in the split
  CHECK: read commission-calculator.ts — every amount through Money minor units
  EXPECT: repShare + ownerShare === basis EXACTLY for adversarial inputs, proven by
  an executed script (not by reasoning)
  EVIDENCE: pending

- [ ] G3: the snapshot freezes history
  CHECK: a test that edits a scheme after a sale and asserts the old split unchanged
  EXPECT: green
  EVIDENCE: pending

- [ ] G4: the flexibility the client asked for is real and visible
  CHECK: profitBasis + lossPolicy + repRatio + roundingBeneficiary editable, with a
  LIVE numeric example on the settings surface
  EXPECT: the choice is explained by showing numbers, never by prose alone
  EVIDENCE: pending

- [ ] G5: resolution is most-specific-wins
  CHECK: a test covering product×rep → product → rep → account default
  EXPECT: green, each level asserted
  EVIDENCE: pending

- [ ] G6: balance is always derived, never stored
  CHECK: a test interleaving sale → partial settlement → sale → settlement
  EXPECT: green
  EVIDENCE: pending

- [ ] G7: the split preview is the ritual of recording a sale
  CHECK: the record-sale dialog shows «لك / له» live before saving, absent when no
  rep is chosen
  EXPECT: driven in a browser — the preview text changes when the price changes
  EVIDENCE: pending

- [ ] G8: the team screens carry real readings, in the v4 language
  CHECK: /reps and /reps/view render seeded data through existing objects
  EXPECT: no invented stat, no decorative medal, law-clean
  EVIDENCE: pending

- [ ] G9: health suite green
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build
  EVIDENCE: pending

- [ ] G10: proofs shot, compared, refined
  CHECK: design-system/proofs/reps/*.png (light/dark × 1440/360 + the dialog)
  EXPECT: defects found by looking are fixed, not listed
  EVIDENCE: pending

- [ ] G11: slop scan accounted for
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src
  EVIDENCE: pending
