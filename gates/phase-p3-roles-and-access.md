# Phase P3 — «تخصيص متكامل واكسسز»

The client's feature request had two halves. P1 built the first (commissions, reps,
settlements) and P2 finished the reading side (targets, payments, the movement log).
This is the half still unbuilt, in his words:

> «ان يكون هناك تخصيص متكامل واكسسز عندي أكدر احدد شنو طريقة الاستخدام المعينه لكل
> مستخدم … وان تكون هناك مرونة في التخصيص وان يكون هناك تنظيم وتضبيط متكامل»

## G0 — say what this IS, before building it

CHECK: does the feature claim to be something it cannot be?
EXPECT: RITM is a **local-first app with no server and no accounts**. Everything
lives in one browser's `localStorage`, which anyone holding the device can read with
the developer tools. Therefore:

* This is **«وضع عرض» — a view mode**, not authentication. It decides what the app
  SHOWS and ALLOWS on this device. It is genuinely useful — handing a rep a tablet
  that opens on their own page and nothing else, keeping purchase prices off a
  shared screen, stopping a wrong tap on «إغلاق الشهر» — and it is exactly the
  «تنظيم وتضبيط» he asked for.
* It is **not** a security boundary. A PIN over `localStorage` is a speed bump, and
  calling it protection would be a lie shipped in a product about honest numbers.
* The UI must SAY this in Arabic, on the screen itself, not only in a doc. A
  merchant who believes his costs are cryptographically hidden from a rep holding
  the device has been misled by us.

EVIDENCE: the paragraph is the first thing on `/access`, above the roles, in the
merchant's own language: «هذه أوضاع عرض على هذا الجهاز، وليست حسابات دخول … لكنه لا
يحمي البيانات من شخص يملك الجهاز ويعرف ما يفعل». The PIN card says the hash «يمنع
قراءته بنظرة على المخزَّن، لا أكثر», and the PIN sheet says forgetting it locks
nothing, because clearing site data returns the device to the owner.
`grep -rn "حماية\|تشفير" src/presentation/features/access/` → the only hit is the
sentence saying it does NOT protect.

## Gates

### G1 — capabilities name real surfaces, not abstractions
CHECK: every capability maps to something a user can actually see or press.
EXPECT: no `canRead`/`canWrite` matrix invented for symmetry. Each capability is a
sentence about this product: «يرى تكاليف الشراء», «يسجّل بيعة», «يغلق الشهر». A
capability nothing consumes is dead flexibility and gets deleted.
EVIDENCE: a test asserts every member of `CAPABILITIES` is either a route gate or is
named in the list of screen-level consumers, so adding a capability with nothing
reading it FAILS rather than shipping unused. Sixteen capabilities, each a sentence
about this product («يرى تكاليف الشراء والهامش», «يغلق الشهر»), never a
`canRead`/`canWrite` grid.

`viewProducts` was added DURING the build, not designed in: the first version gated
`/products` on `manageProducts`, which left a rep who may record a sale with nowhere
to record it from. Seeing the catalogue and editing it are two permissions.

### G2 — the owner cannot lock himself out
CHECK: the owner role and the way back.
EXPECT: `owner` is built in, holds every capability, and is not editable or
deletable. Switching INTO a limited role is always reversible on the same device:
the way back is the PIN when one is set, and unconditional when none is. A state
where no role can reach `/access` must be unreachable by construction.
EVIDENCE: 20 tests on `AccessPolicy`. The owner holds every capability even when the
STORED owner row has been emptied by hand, because the built-in role's capability list
is not data we trust from storage. `resolve` falls back to the owner on no session, an
unknown role id, and an archived role. `LocalRoleRepository` throws on any attempt to
edit or delete the owner, and `update` refuses to patch `id` or `builtIn`, so a custom
role cannot promote itself into the un-editable one.

### G3 — a rep view is scoped to ONE rep, and the scope is data, not decoration
CHECK: what a bound rep session actually reads.
EXPECT: binding a session to a rep filters the READ MODELS — sales, targets, the
ledger, balances — to that rep. Hiding rows in the presentation while the read model
still computes the store's totals would leak the real figures into any total on
screen. The scope travels with the query.
EVIDENCE: 11 tests across `ledger.test.ts` and `targets.test.ts`. The scope is a
parameter of the READ MODEL, and it has three states rather than two — `undefined`
(every sale), `{repId}` (one rep's), and `"none"` (a role that may not see the store's
sales and is bound to nobody). Collapsing that third state into "everything" would
leak the store; collapsing it into a rep id that happens not to exist would work only
by accident.

Proved in the render, not only in tests: `/ledger` under the seeded rep reads
«مبيعات: 66 · تسويات: 2 · إغلاقات: 0» against the store's 216 / 4 / 0, every row is
that rep's own, and a period close never appears at all because a month's close is the
store's event and not theirs.

### G4 — costs are the merchant's own secret
CHECK: a rep session anywhere a purchase price appears.
EXPECT: without `viewCosts`, no screen prints purchase price, cost lines, margin or
the profit split's owner side. What a rep sees is their own share and what it was
calculated from at the level they agreed to — never «اشتريته بعشرة».
EVIDENCE: a scripted sweep visits all 12 app routes under the seeded rep session and
fails on any of «الشراء · الهامش · صافي الربح · تكلفة · التعادل · العائد» appearing
outside a refusal screen. Final result: **NO COST FIGURES LEAKED**.

It took three rounds, and every round found something a test would not have:

1. **The ledger printed net profit on every row.** Revenue minus profit IS the
   purchase price, so «190,000 و ربح 77,490» told the rep the product cost ~112,510.
   The read model now attaches the rep's OWN frozen share instead, labelled «حصّتك» —
   theirs to know, and it reveals nothing on its own. Four tests.
2. **The product page handed over the whole editable cost form** — purchase price,
   every cost line, margin, break-even, all of it writable. A session without
   `manageProducts` now gets `ProductBrief`: what it is and what it sells for.
   Deliberately its own small object rather than the form with fields removed, which
   would still read as "there is more here you cannot have".
3. **`/targets` defaulted to the net-profit metric.** `useState` captures its initial
   value on the FIRST render, and on that render the store has not loaded, so `access`
   still resolved to the owner and «netProfit» stuck even after the session turned out
   to be a rep. The effective metric is now DERIVED every render, so load order cannot
   decide what a session is shown. This is the same class of bug as seeding state from
   async data, and here it was security-relevant.

The narrower rule, stated: an aggregate month's profit does not reveal any single
product's cost the way a per-row profit does. It is still the merchant's margin, so a
role built to hide costs is not offered the metric at all.

### G5 — a forbidden route says so, and offers the way back
CHECK: navigating to `/settings` under a rep session.
EXPECT: not a blank page, not a redirect that looks like a bug, and not a crash. A
stated refusal naming the role, plus a link to what this role CAN open.
EVIDENCE: `rep-denied-settings-*.png` and `rep-denied-dashboard-*.png`. The screen
names the role and the capability by their Arabic labels («تحتاج صلاحية يغيّر
الإعدادات والنسخ الاحتياطية»), offers `firstAllowedHref`, and for a role that cannot
reach `/access` it says where the way back is instead of showing a button that would
refuse too. Enforcement lives in ONE place, `RouteGuard` in the app layout, rather
than as a check each screen has to remember.

### G6 — the nav shows only what the role can open
CHECK: the sidebar and the mobile dock under each role.
EXPECT: filtered by capability, and a group with nothing left in it disappears
rather than rendering an empty heading.
EVIDENCE: 10 tests, plus the renders. A rep's sidebar holds المنتجات · الأهداف ·
التسويات · السجل and nothing else; «النظام» disappears entirely rather than rendering
an empty heading. One test asserts that every nav entry naming a capability has a
MATCHING route rule, so a visible entry can never lead to a refusal. The dock, the
command palette (its actions as well as its nav entries), the topbar's «إضافة منتج»,
the period switcher and the products page's own «إضافة منتج» are all filtered the same
way — the last two were found in the render, still offering a door that refuses.

### G7 — the role is visible while it is active
CHECK: a limited session's chrome.
EXPECT: the app says which role it is in, at all times, with the way back. A
merchant who forgot he is in rep view and concludes his sales collapsed is a bug
we shipped.
EVIDENCE: `RoleMarker` in the topbar, present in all 8 rep proofs at both widths,
reading «مندوب · ليث العبيدي · رجوع للمالك». It is silent on the owner's session: a
permanent badge saying «المالك» would be noise on the only session that is not
restricted, and this appears exactly when something IS restricted.

### G8 — the PIN is stored as a hash, and never as the PIN
CHECK: `localStorage` after setting a PIN.
EXPECT: a SHA-256 hash with a per-install salt, never the digits. This does not make
it secure (see G0) — it makes it not *careless*, so a shoulder-glance at storage
does not read the merchant's PIN, which he has probably reused elsewhere.
EVIDENCE: 6 tests. The serialised record contains neither the PIN nor any 3-character
run of it; the salt is per install, so the same PIN hashed twice gives different
records that each verify; a missing or half-written record means the way back is
unconditional rather than a locked door; and a non-ASCII PIN («٤٨٢٩») round-trips
without being mangled. SHA-256 via WebCrypto — no dependency and no hand-rolled hash.

### G9 — a custom role is a first-class thing
CHECK: creating «محاسب» with reports and costs but no editing.
EXPECT: roles are created, renamed, edited and deleted by the merchant. Two are
seeded as starting points (مندوب, محاسب) and both are editable, because a seeded
role a merchant cannot change is a decision taken away from him.
EVIDENCE: `access-owner-*.png`. Two roles are seeded — مندوب (4 of 16) and محاسب
(8 of 16) — and BOTH are ordinary editable rows, not built-ins, because a seeded role
a merchant cannot change is a decision taken away from him. Each row prints its
capabilities as chips, so what a role can do is readable without opening it. The
switch sheet also lists what WILL be hidden, so the merchant sees the consequence
before he hands over the device.

### G10 — deleting a role in use cannot orphan a session
CHECK: delete the role the current session is running as.
EXPECT: impossible or handled — the active session falls back to `owner` rather than
to a dangling id that resolves to no capabilities at all (which would deny
everything, including the way back).
EVIDENCE: two layers, on purpose. `AccessPolicy.resolve` falls back to the owner for a
session naming a role that no longer exists, AND drops the stale rep binding with it —
otherwise a fallback could leave the owner looking at one rep's numbers while believing
they were the store's. On top of that, `deleteRole` writes the owner session
immediately when the deleted role is the active one, so the fallback is never
load-bearing.

### G11 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`

## Closing evidence

    npm run typecheck && npm run lint && npm test && npm run build
      → clean · clean · 258 passed (15 files) · 27 static routes

    node .agents/../scratchpad/p3sweep.mjs   (12 routes under the rep session)
      → NO COST FIGURES LEAKED

18 proof renders in `design-system/proofs/p3/`: the access screen under the owner, and
products · the product page · targets · the ledger · two refusals under a rep session,
at 1440 and 360.

## What this is not, one more time

A merchant who believes his costs are cryptographically hidden from a rep holding the
device has been misled by us. The screen says so, the PIN card says so, and the PIN
sheet says forgetting the code locks nothing. Everything above is worth building —
handing a rep a tablet that opens on their own page, keeping purchase prices off a
shared screen, stopping a wrong tap on «إغلاق الشهر» — and none of it is a lock.
