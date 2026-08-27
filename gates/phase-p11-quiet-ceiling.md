# Phase P11 — سقف الهدوء

The client, on the app as it stood after P10: «التصميم تحسه صعب ومعقد جدا».

He is right, and the honest diagnosis is mine to state: every phase added depth that
was defensible on its own — a figure that must not be hidden, an instrument that reads
better than a number, a sentence that explains a rule. Nothing was gratuitous, and the
CUMULATIVE result is still exhausting. I optimised for completeness and for the
anti-slop rule ("nothing generic") and read that as *add more* rather than *be more
precise*. I never budgeted for the reader's attention.

Measured before any change (at rest, before a single tap):

    route            figures  words  marks  svg   height
    /orders/            124    380     61    14    1563
    /reps/              101    235     34     5     993
    /targets/            86    167     23     4     900
    /dashboard/          78    178     26    12     961
    /ledger/             60    245     55    14    1196
    /reps/schemes/       33    475     72    13    2529

124 figures on one screen is not a design, it is a spreadsheet with textures. 61
punctuation marks means roughly thirty sentences of prose on a screen a merchant opens
to answer one question.

The client's chosen remedy: **a binding ceiling per screen, no feature lost.**

## G1 — the ceiling is written, not intended
CHECK: VISUAL-LAW carries the budget, and a script enforces it.
EXPECT: §15, with numbers, and `npm run sweep:density` failing over budget. A ceiling
kept as good intentions is how the app got here.
EVIDENCE: the clause and a passing run.

## G2 — the budget, and why each number
At rest — before any disclosure is opened. The values below are the FINAL ones; four of
them were recalibrated during the phase, and each recalibration is written into
`scripts/sweeps/sweep-density.mjs` beside the number with its reason.

| Budget | Value | Why |
| --- | --- | --- |
| Figures in the SUMMARY region (everything not inside a declared row) | ≤ 8 | The summary answers one question. A list's own rows are counted separately. |
| Figures per list ROW | ≤ 4 | Recalibrated from 2. A ledger row legitimately carries an identifier, a date and one amount, and the counter reads «ط-1041», «5», «2026» and «174,000» as four. Two was a number I invented before measuring; contorting a money row to fit it would have been the wrong repair. What the ceiling targets is the SECOND amount and the counts beside it. |
| Clauses of prose in the summary region | ≤ 12 | Recalibrated from 6, after the counter was fixed twice (see G7). Measured: the two irreducible screens carry 9 and 11 — a ladder pays about one clause per rung to say what the rung holds, and the rule workshop's field helpers ARE the feature. The ceiling sits one clause above the worst honest screen, so the next paragraph added anywhere fails immediately. |
| Clauses in the LONGEST single prose block | ≤ 3 | The one that catches what the client complained about. /access opened with a nine-clause block; three clauses is a line a merchant reads without deciding to, and beyond that it is a paragraph. A paragraph belongs behind a latch. |
| Instrument objects (rails, gauges, charts) in the summary | ≤ 1 | Two instruments on one screen compete; the eye reads neither. Recalibrated to exclude a sparkline repeated once per row: that is one instrument used consistently, not six competing. |
| Badges per row | ≤ 2 | Three badges on a row is a row that cannot say what it is. |

Rows are declared by the app itself (`data-row`) rather than guessed. A heuristic picked
a six-chip legend over three tall cards on /reps and found no rows at all on /targets. A
screen with rows and no tag now reads as all-summary, which fails LOUD instead of
passing quietly — visible in the baseline column of G3, where /orders reads 57.

## G3 — nothing is lost, everything is one tap away
CHECK: every figure and sentence removed from a screen's resting state.
EXPECT: it moved behind a disclosure — not deleted. The client's condition was «لا تُفقد
ميزة», and a ceiling that deletes features is a ceiling that fails.

EVIDENCE — what moved, and where:

| Screen | Stood open at rest | Now behind |
| --- | --- | --- |
| `/orders` | the delivery panel beside the till: rail, charged, paid, margin, free-trip note, subsidised warning | rung «التوصيل: مقبوض مقابل مدفوع», whose closed latch prints the margin |
| `/reps` | «قسمة الأرباح» open beside the balance device | one rung, latch prints the share |
| `/settlements` | three figures per currency plus a rail, per currency, over a four-row list | rung «المستحق والمدفوع», latch prints what is still owed |
| `/periods` | the per-product profit table, six columns including margin | rung «الربح حسب المنتج», every column intact |
| `/access` | a nine-clause block explaining that roles are not authentication, plus the PIN-hash explanation | the claim itself is now the latch title; the reasoning sits behind it word for word, with the hash sentence joined to it |
| `/reps/schemes` | the per-unit price column, the leftover-unit cases, both loss policies, the last real operation, and the whole exceptions workbench | a five-rung ladder under the workbench |

And what was genuinely DELETED, with the reason each is not a lost feature:

| Deleted | Why it is not a feature |
| --- | --- |
| `/orders` header «توصيل بالخسارة: 2» | the delivery rung reports the same count with its «من أصل» whole; two places for one number |
| `/orders` footer «ظهر 7 من 7» while nothing is held back | it repeated the header's own count; it now appears only when there IS more |
| `/targets` per-row attainment badge | the rail draws it and the line beside it names the verdict in words; the badge was the third print |
| `/targets` «الوتيرة 45%» | `pace` is attainment ÷ elapsed: a third percentage derived from two already on screen. Its verdict stays in words |
| `/targets` per-row «ومضى ٨٧٪ من الشهر» in the rail's own label | a screen reader heard the month's elapsed share once per row; it is a fact about the month, stated once above |
| `/reps/schemes` rail badge printing the typed share | the field holds it, the helper names the default, the rail shows the distance. Four prints of one number |
| `/reps/schemes` «اشتريتَه بعشرة، باعه المندوب بعشرين...» | four labelled fields directly below already hold 20, 10 and 2 |
| `/reps/schemes` tiles description | the tiles print the share and the binding count themselves |
| `/targets` «والخط القائم في كل مسطرة هو ما مضى من الشهر» | taught once on the account band, where the caption sits beside the same mark |

## G4 — the anti-slop rule and the ceiling do not contradict
CHECK: the tension that produced the problem.
EXPECT: «nothing generic» was never «nothing quiet». Restraint is the harder version of
the same rule: the surviving figure has to earn its place. VISUAL-LAW §15 says this
explicitly so the next phase does not read the anti-slop clause as licence to pile on.
EVIDENCE: the clause.

## G5 — it must still be TRUE
CHECK: the figures the ceiling removes from view.
EXPECT: no reading becomes wrong by being moved. In particular the P5 law — «ربحت» is
not «بيدي» — and the P6 law — a discount reduces what was collected — survive intact,
because those are facts about the money, not decoration.
EVIDENCE: 428 tests still green; the domain is untouched by this phase.

## G6 — nothing regressed
EVIDENCE: typecheck · lint · tests · build · the four sweeps · eye-verified renders.

## G7 — the metric told the truth before the UI was changed to satisfy it
CHECK: every time the gate and the screen disagreed.
EXPECT: the counter is examined FIRST. Four times it was the counter that was wrong, and
each fix made the gate harder, not easier:

1. It read the Odometer's hidden drum digits — 70 glyphs for a 7-digit figure — and
   reported 85 figures in a summary showing five. Now `role="img"` with an `aria-label`
   counts as its label, which is what the attribute means.
2. It read `sm:hidden` duplicates through `textContent` on a detached clone, so the
   ledger row measured six figures for four. Non-rendered nodes are marked before
   cloning.
3. It counted «د.ع.» as two sentences, so a money-dense instrument read as prose. An
   abbreviation is now stripped — with a lookbehind, because without it «فقط.» matched
   as «ط.» and every real full stop vanished, which under-reported the gate a second
   time.
4. It joined text with `textContent`, which glues «...فقط.» to the next element's first
   word so the clause regex never saw whitespace. /reps/schemes read 13 clauses where
   the screen carried 26. Text nodes are now joined with a space.

EVIDENCE: the four comments in `sweep-density.mjs`, and the fact that the prose ceiling
had to be RAISED to a measured 12 once the counter stopped flattering the screens.
**A metric that flatters the screen is worse than no metric.**

## Closing evidence

**The ceiling, measured with the same (fixed) counter on both sides.** Left column is
the P10 build (`671e245`) served from its own worktree; right is this phase.

    route             P10 → P11   summary       total figs    longest prose block
    /dashboard/                    9 →  8        9 →  8            2 → 2
    /orders/                      57 →  8       57 → 36            5 → 3
    /products/                     1 →  1       25 → 25            1 → 1
    /reps/                        32 →  5       32 → 17            3 → 3
    /reps/schemes/                31 →  6       31 → 11            4 → 2
    /targets/                     23 →  8       23 → 16            4 → 3
    /ledger/                      60 →  5       60 → 60            0 → 0
    /settlements/                 12 →  4       28 → 20            3 → 2
    /access/                       7 →  1        7 →  7            9 → 2
    /periods/                      6 →  6       48 →  6            2 → 2
    /reports/                      1 →  1        1 →  1            1 → 1

    P10: 9 of 11 screens over the ceiling.   P11: 0 of 11.

Read honestly: part of the drop in the `summary` column is ATTRIBUTION — the P10 build
carries no `data-row` tags, so its rows counted as summary (that is the fail-loud
fallback, /orders at 57 and /ledger at 60). The `total figures` column is
attribution-independent and is the honest measure of what actually left the screen:
/ledger and /products and /access are unchanged there, because /ledger's rows were never
the problem and /access's cut was prose, not figures. /periods 48 → 6 and
/reps/schemes 31 → 11 are real removals from the resting state, into latches.

**G1** ✅ VISUAL-LAW §15 carries the seven clauses and the numbers; `npm run sweep:density`
exits non-zero over budget. Verified by watching it fail on /targets' 4-clause block and
pass after the trim.
**G2** ✅ the table above; four recalibrations, each with its reason in the script.
**G3** ✅ six screens' devices moved behind latches, nine deletions each named with the
duplicate it removed. Every latch was opened and photographed:
`design-system/proofs/p11/{orders-delivery,access-why,periods-breakdown,settlements-totals,schemes-column,schemes-loss,schemes-overrides,schemes-recent,reps-split}-open.png`
— the /access paragraph is there word for word, the /periods table with all six columns,
the exceptions workbench whole.
**G4** ✅ §15 clause 6 states it: «ماتريد شي تقليدي» was never «ماتريد شي هادئ».
**G5** ✅ 428 tests green, `src/domain` untouched by this phase. `sweep:writes` drove
12/12 write paths clean through the new latched surfaces, `sweep:corrupt` survived all
20 corruption cases, `sweep:keyboard` reached every clickable on 12 routes.
**G6** ✅ typecheck clean · lint clean · 428/428 tests · build ✓ · four sweeps green.
Renders: the eight changed routes shot at 1440 and 360 × light and dark (32 files),
plus the 9 opened latches. The 9 opened latches and the 10 at-rest renders actually read
are committed under `design-system/proofs/p11/`; the rest were shot, looked at where
listed below, and not kept, following the P9 convention of committing a curated set
rather than every render. Read in full, one by one:
`/reps/schemes` at 1440-light and 360-light, `/orders` at 1440-light and 360-dark,
`/access` at 1440-light (before and after the PIN row), `/periods` at 1440-light,
`/targets` at 1440-dark and 360-light, `/settlements` at 360-light, `/reps` at
1440-light, and the opened `/access`, `/periods` and `/reps/schemes` latches. Every
defect in the list below came out of that reading, and none of it out of a sweep.
**G7** ✅ four counter fixes, all of which made the gate stricter.

**What the eye found that no sweep did** (the P6/P9/P10 lesson holds):

* the settlements latch printed «ما زال مستحقًّا» in danger red while the line inside it
  was neutral ink: one figure, two meanings. §13 spends danger on profit that went the
  wrong way, not on money owed to your own team.
* a solo Ladder drew a rail holding one rung, and inside /reps' grid it stretched to the
  neighbour's height and read as a divider. `<Ladder solo>` now drops the rail.
* a Rung inside a Card was a card in a card (/periods). `<Rung flat>` drops the shell.
* the /access PIN card kept its full height after losing two sentences: shortening copy
  without shortening the box just moves the noise into empty space. It is now one row.
* the bench's crumb latch repeated the field label above it AND the value that field
  sets. Retitled for the case it shows, and both latch summaries dropped.
* the bench's workbench column lost half its height to the ladder, and two equal columns
  left a 350px void. The form takes the wide track now, the bench a 24rem sticky rail.
