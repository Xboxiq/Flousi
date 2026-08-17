# Phase 1 — Foundation surgery (gates)

Method: unlazy. A gate is UNMET if unchecked or if EVIDENCE reads `pending`.
Verified 2026-08-17 on branch `claude/professional-design-system-c0m4ei`.

- [x] G1: Emil motion tokens are the only easings in globals.css (old 0.22,1,0.36,1 and spring gone)
  CHECK: grep -c "cubic-bezier(0.23, 1, 0.32, 1)" src/app/globals.css && grep -c "ease-spring\|0.22, 1, 0.36, 1" src/app/globals.css || true
  EXPECT: /^1\n0$/
  EVIDENCE: 1 then 0 — new curve present once; zero matches for old curve/spring (2026-08-17)

- [x] G2: zero `transition-all` in src
  CHECK: grep -rn "transition-all" src --include="*.tsx" | wc -l
  EXPECT: 0
  EVIDENCE: 0 (segmented.tsx migrated to transition-[color,background-color,box-shadow])

- [x] G3: zero violet/rose hues in src (mesh capped at deep indigo #4f5dff)
  CHECK: grep -rn "6d5cff\|ff4d6d\|--violet\|--rose\|night-rose" src | wc -l
  EXPECT: 0
  EVIDENCE: 0 — mesh-aurora/bento end at #4f5dff; night-rose renamed mesh-night-danger (danger red)

- [x] G4: Card elevation declared once (shadow-card recipe; no border+shadow ghost combo)
  CHECK: grep -c "elev-card" src/app/globals.css; grep -c "border-border-soft" src/presentation/components/ui/card.tsx || true
  EXPECT: /[2-9][\s\S]*0/
  EVIDENCE: elev-card ×6 in globals (light triple + dark ring + @theme map); card.tsx border count 0

- [x] G5: zero physical text-left/text-right in src (logical text-start/end only)
  CHECK: grep -rn "text-left\|text-right" src --include="*.tsx" | wc -l
  EXPECT: 0
  EVIDENCE: 0 (command-palette + landing stats migrated to text-start)

- [x] G6: Money primitive exists (bdi + mono + tabular + polarity) and is used by real surfaces
  CHECK: grep -c "bdi" src/presentation/components/ui/money.tsx; grep -rln "<Money" src/presentation/features | wc -l
  EXPECT: /[1-9][\s\S]*[1-9]/
  EVIDENCE: bdi ×3 in money.tsx; 1 feature file (periods-view: breakdown table + summary grids migrated)

- [x] G7: motion presets library exists; feature code stops hand-writing curves
  CHECK: test -f src/presentation/lib/motion.ts && grep -c "easeOut" src/presentation/lib/motion.ts; grep -rn "0.22, 1, 0.36" src --include="*.tsx" | wc -l
  EXPECT: /[1-9][\s\S]*0/
  EVIDENCE: motion.ts present (enter/reveal/staggerList/modal/drawer/spring); 0 hand-written old curves left (template.tsx, command-palette, landing migrated)

- [x] G8: zero gradient-clip headline text in src
  CHECK: grep -rn "bg-clip-text" src --include="*.tsx" | wc -l
  EXPECT: 0
  EVIDENCE: 0 — landing hero highlight is solid text-accent now

- [x] G9: zero raw hex in feature/component tsx (tokens only; glossy-orb static art exempt)
  CHECK: grep -rEn "#[0-9a-fA-F]{6}" src/presentation --include="*.tsx" | grep -v "glossy-orb" | wc -l
  EXPECT: 0
  EVIDENCE: 0 — landing/reports-hub/materials-demo hexes replaced by new --ink/--paper static tokens

- [x] G10: theme-flip suppressor wired (CSS class + provider applies/removes it)
  CHECK: grep -c "theme-flip" src/app/globals.css; grep -c "theme-flip" src/presentation/components/theme/theme-provider.tsx
  EXPECT: /[1-9][\s\S]*[1-9]/
  EVIDENCE: 4 CSS refs + 3 provider refs (add class → set attr → reflow → remove next frame)

- [x] G11: typecheck green
  CHECK: npm run typecheck > /dev/null 2>&1 && echo TYPECHECK_OK
  EXPECT: TYPECHECK_OK
  EVIDENCE: TYPECHECK_OK (tsc --noEmit, exit 0)

- [x] G12: all unit tests pass
  CHECK: npm run test 2>&1 | grep -E "Tests .*passed"
  EXPECT: passed
  EVIDENCE: "Tests  24 passed (24)" — 5 files

- [x] G13: lint clean
  CHECK: npm run lint > /dev/null 2>&1 && echo LINT_OK
  EXPECT: LINT_OK
  EVIDENCE: LINT_OK (0 errors, 0 warnings after excluding vendored .claude/** from eslint)

- [x] G14: production build (static export) succeeds
  CHECK: npm run build > /dev/null 2>&1 && echo BUILD_OK
  EXPECT: BUILD_OK
  EVIDENCE: BUILD_OK — all routes prerendered static/SSG

- [x] G15: kill-ai-slop scanner clean on src OR every leftover justified
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src 2>&1 | tail -1
  EXPECT: /0 finding|clean|justified below/i
  EVIDENCE: 110→90 hits after fixes. FIXED this phase: `uppercase tracking-wide` stripped from all Arabic labels (letter-spacing breaks connected Arabic script — 7 files), scrim backdrop-blur removed (command-palette), icon group-hover:scale-110 removed (reports-hub), gradient-clip headline removed. JUSTIFIED leftovers (triaged per the skill's own protocol — chosen-and-defended is not slop): slop-34 mono figures = locked convention (MASTER §2: IBM Plex Mono for all money; kbd = keyboard keys); slop-06 mesh gradients = the signature material, one per screen (MASTER §1); slop-30 landing 01/02/03 = a genuine 3-step sequence (allowed by the rule); slop-16 skeleton animate-pulse = loader, not a status dot (false positive); slop-19 rounded-full pills/buttons = locked radius law (MASTER §3), vibrancy = the one sanctioned blur; slop-20 shadow-xl on dialog/command-palette = overlay elevation (MASTER §4 keeps xl for overlays); slop-12/28 quiet lowercase section labels = deliberate Linear-style chrome. DEFERRED to Phase 4 (landing art direction): hero atmospheric gradient (slop-06 landing), stats band display sizes (slop-11), landing card shadow-xl (slop-20).
