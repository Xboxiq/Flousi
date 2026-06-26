---
name: mixed-initiative-flow
description: Decide when the AI should lead versus when the user should lead, and design clean handoffs of control between them. Use this skill when designing agentic flows, autocomplete/suggestions, copilots, wizards, or any feature where both the human and the AI can take action. Covers initiative allocation, interruptibility, and control handoff.
---

# Mixed-Initiative Flow

## Overview

Mixed-initiative interaction is the design of flows where both the human and the AI can
take the lead, contribute, and hand control back and forth. The hard questions are:
*who acts next, how does the other party interrupt or take over, and how is control
handed off cleanly?* Getting this wrong produces either a passive tool that never helps
or a runaway agent that does things the user didn't want.

## Core Principle

> Initiative should sit with whichever party has the most relevant
> information/capability at this moment — and the other party must always be able to see
> what's happening and take back control cheaply.

## When to Use This Skill

- Designing an agent or copilot that can act on the user's behalf
- Building suggestions, autocomplete, or "AI drafts" the user can accept/edit
- A wizard or guided flow where the AI could pre-fill or auto-advance steps
- Deciding how/when the AI should ask vs. act
- Designing interruption, pause, undo, and takeover affordances

## Who Leads? (Initiative Allocation)

Let the **AI lead** when:
- The task is well-specified and low-risk (formatting, summarizing, boilerplate).
- The AI has high confidence and the cost of being wrong is low/recoverable.
- Speed matters more than precision and the user can correct after.

Let the **user lead** when:
- Intent is ambiguous or underspecified.
- The action is high-stakes, irreversible, or value-laden (send, delete, pay, publish).
- The user has context the AI cannot see.
- Confidence is low or sources conflict.

Use **shared initiative** (AI proposes, user disposes) as the safe default for most
consequential work: the AI does the heavy lifting and stages a result; the user reviews,
edits, and commits.

## Handoff Patterns

- **Propose-and-confirm.** AI prepares the action and asks for a single confirm before
  executing. Best for consequential or irreversible steps.
- **Draft-and-edit.** AI produces editable output the user refines in place. Control is
  shared continuously rather than at a gate.
- **Act-and-report.** AI executes autonomously and reports what it did, with easy undo.
  Only for low-risk, reversible actions.
- **Ask-when-stuck.** AI proceeds until confidence drops or ambiguity rises, then hands
  back with a specific, answerable question (not "what do you want?").
- **Interruptible autonomy.** Long-running AI work shows live progress and a prominent,
  always-available **Pause/Stop/Take over** control.

## Designing the Handoff Itself

A clean handoff has four parts:
1. **Signal** — make it obvious control is changing hands ("Drafting…", "Waiting for you").
2. **State** — show what's been done so far and what's pending.
3. **Affordance** — provide the exact control the receiving party needs next.
4. **Reversibility** — make taking back control cheap (pause, undo, edit), not a restart.

## Decision Guide

| Risk × Confidence | Recommended flow |
|-------------------|------------------|
| Low risk, high confidence | Act-and-report (with undo) |
| Low risk, low confidence | Draft-and-edit |
| High risk, high confidence | Propose-and-confirm |
| High risk, low confidence | Ask-when-stuck → user leads |

## Anti-Patterns

- Acting irreversibly without confirmation ("helpfully" sending/deleting).
- Asking the user to confirm so often that the AI provides no leverage (confirmation
  fatigue).
- Hiding in-progress autonomous work with no way to interrupt.
- Vague handbacks ("How can I help?") instead of a specific decision the user can make.
- Losing the AI's work when the user takes over (forces a restart).

## Quality Checklist

- [ ] For each action, it's intentional who leads and why (risk × confidence).
- [ ] The user can always see whether the AI or they are "up next".
- [ ] Consequential/irreversible actions require explicit user commit.
- [ ] Autonomous work is interruptible and reversible at any time.
- [ ] When the AI hands back, it asks a specific, answerable question.

## Trade-offs

More AI initiative = more leverage but more risk of unwanted actions and erosion of user
agency. More user initiative = more control but less of the speed-up that justifies the
AI. Tune per action by risk and reversibility; when unsure, prefer propose-and-confirm.
