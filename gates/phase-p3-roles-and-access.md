# Phase P3 — «تخصيص متكامل واكسسز»

The client's feature request had two halves. P1 built the first (commissions, reps,
settlements) and P2 finished the reading side (targets, payments, the movement log).
This is the half still unbuilt, in his words:

> «ان يكون هناك تخصيص متكامل واكسسز عندي أكدر احدد شنو طريقة الاستخدام المعينه لكل
> مستخدم … وان تكون هناك مرونة في التخصيص وان يكون هناك تنظيم وتضبيط متكامل»

## G0 — say what this IS, before building it

CHECK: does the feature claim to be something it cannot be?
EXPECT: Flousi is a **local-first app with no server and no accounts**. Everything
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

EVIDENCE: the sentence is present on `/access`; `docs/PRODUCT-PLAN.md` records it;
no copy anywhere uses «حماية» or «تشفير» about the PIN.

## Gates

### G1 — capabilities name real surfaces, not abstractions
CHECK: every capability maps to something a user can actually see or press.
EXPECT: no `canRead`/`canWrite` matrix invented for symmetry. Each capability is a
sentence about this product: «يرى تكاليف الشراء», «يسجّل بيعة», «يغلق الشهر». A
capability nothing consumes is dead flexibility and gets deleted.
EVIDENCE: every member of `CAPABILITIES` is referenced by at least one screen or
read model — checked by a test that greps the source, not by inspection.

### G2 — the owner cannot lock himself out
CHECK: the owner role and the way back.
EXPECT: `owner` is built in, holds every capability, and is not editable or
deletable. Switching INTO a limited role is always reversible on the same device:
the way back is the PIN when one is set, and unconditional when none is. A state
where no role can reach `/access` must be unreachable by construction.
EVIDENCE: tests assert `can(owner, every capability) === true`, that the owner role
rejects edits, and that `manageAccess` cannot be removed from it.

### G3 — a rep view is scoped to ONE rep, and the scope is data, not decoration
CHECK: what a bound rep session actually reads.
EXPECT: binding a session to a rep filters the READ MODELS — sales, targets, the
ledger, balances — to that rep. Hiding rows in the presentation while the read model
still computes the store's totals would leak the real figures into any total on
screen. The scope travels with the query.
EVIDENCE: a test passes a bound scope and asserts the returned sales, ledger rows and
target rows contain no other rep's work, and that the totals match the scoped set.

### G4 — costs are the merchant's own secret
CHECK: a rep session anywhere a purchase price appears.
EXPECT: without `viewCosts`, no screen prints purchase price, cost lines, margin or
the profit split's owner side. What a rep sees is their own share and what it was
calculated from at the level they agreed to — never «اشتريته بعشرة».
EVIDENCE: the proof renders of `/products`, a product page, `/reps/view` and the
calculator under a rep session, eye-verified for any leaked figure.

### G5 — a forbidden route says so, and offers the way back
CHECK: navigating to `/settings` under a rep session.
EXPECT: not a blank page, not a redirect that looks like a bug, and not a crash. A
stated refusal naming the role, plus a link to what this role CAN open.
EVIDENCE: the proof render of a denied route.

### G6 — the nav shows only what the role can open
CHECK: the sidebar and the mobile dock under each role.
EXPECT: filtered by capability, and a group with nothing left in it disappears
rather than rendering an empty heading.
EVIDENCE: proof renders of the shell under owner, rep and accountant.

### G7 — the role is visible while it is active
CHECK: a limited session's chrome.
EXPECT: the app says which role it is in, at all times, with the way back. A
merchant who forgot he is in rep view and concludes his sales collapsed is a bug
we shipped.
EVIDENCE: the proof renders show the marker on every screen and at both widths.

### G8 — the PIN is stored as a hash, and never as the PIN
CHECK: `localStorage` after setting a PIN.
EXPECT: a SHA-256 hash with a per-install salt, never the digits. This does not make
it secure (see G0) — it makes it not *careless*, so a shoulder-glance at storage
does not read the merchant's PIN, which he has probably reused elsewhere.
EVIDENCE: a test asserts the stored record contains no substring of the PIN, and
that verification succeeds for the right PIN and fails for a wrong one.

### G9 — a custom role is a first-class thing
CHECK: creating «محاسب» with reports and costs but no editing.
EXPECT: roles are created, renamed, edited and deleted by the merchant. Two are
seeded as starting points (مندوب, محاسب) and both are editable, because a seeded
role a merchant cannot change is a decision taken away from him.
EVIDENCE: the create/edit sheet in the proofs; tests over the repository.

### G10 — deleting a role in use cannot orphan a session
CHECK: delete the role the current session is running as.
EXPECT: impossible or handled — the active session falls back to `owner` rather than
to a dangling id that resolves to no capabilities at all (which would deny
everything, including the way back).
EVIDENCE: a test deletes the active role and asserts the resolved session is the
owner's.

### G11 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`

## Closing evidence
pending
