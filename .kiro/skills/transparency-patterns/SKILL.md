---
name: transparency-patterns
description: Show what the AI knows, what it does not know, how it reached an answer, and how confident it is. Use this skill when designing explanations, reasoning displays, source attributions, data-use disclosures, or any UI that communicates the AI's internal state to users. Covers explainability surfaces and honest disclosure of limits.
---

# Transparency Patterns

## Overview

Transparency is making the AI's behavior legible: what it knows, what it doesn't, what it
used, how it decided, and how sure it is. Transparency is the *mechanism*; calibrated
trust and appropriate reliance are the *outcomes*. Good transparency is selective and
layered — it answers the questions a user would actually ask at the moment they'd ask
them, rather than dumping internals.

## Core Principle

> Reveal enough of the AI's state and process for the user to make a good decision —
> and be honest about the edges of what it knows. Explanation should reduce uncertainty,
> not perform sophistication.

## When to Use This Skill

- Designing "why did I get this?" explanations or reasoning displays
- Attributing sources, data, or tools used to produce output
- Disclosing what data the AI can/can't see, and what it remembers
- Communicating limits, staleness, or out-of-scope situations
- Showing live state during agentic/multi-step work

## The Four Questions Transparency Answers

1. **What did you use?** — sources, documents, tools, memory, context.
2. **How did you get here?** — the steps/reasoning, at the right level of abstraction.
3. **How sure are you?** — confidence, uncertainty, alternatives considered.
4. **What don't you know?** — scope limits, missing data, staleness, refusal reasons.

## Patterns

- **Layered explanation.** One-line "why" by default; expandable to steps; expandable
  again to raw detail/sources. Match progressive-disclosure depth to user need.
- **Inline attribution.** Tie specific claims to specific sources (footnote/hover/link),
  not a generic "sources" pile at the end.
- **Process visibility.** For multi-step or agentic work, stream the plan and steps
  ("Searching → Reading 3 docs → Drafting") so the user sees what's happening.
- **Capability + memory disclosure.** Make clear what the AI can access (files, web,
  history) and what it retains, especially across sessions.
- **Honest "I don't know".** Explicitly surface no-answer, low-data, and out-of-scope
  states instead of fabricating. A clear gap is more trustworthy than a smooth guess.
- **Decision rationale for actions.** When the AI acts or recommends, state the key
  factors behind it in plain language.

## Levels of Explanation (pick to fit the user)

| Level | Content | For |
|-------|---------|-----|
| Glance | One-sentence "why" | Most users, most of the time |
| Walkthrough | Ordered steps / main factors | Engaged users, debugging a result |
| Deep | Raw reasoning, full sources, parameters | Experts, audits, disputes |

## Anti-Patterns

- Explanation theater: plausible-sounding rationales that don't reflect the real process.
- Dumping chain-of-thought or logs as a substitute for a usable explanation.
- Generic disclaimers ("AI can make mistakes") in place of specific, situated honesty.
- Citing sources that don't actually support the claim, or post-hoc rationalization.
- Hiding what data/memory is in play, creating unpleasant surprises.

## Quality Checklist

- [ ] The user can answer "why did I get this?" in one glance, deeper on demand.
- [ ] Claims are attributable to specific, real sources.
- [ ] The AI's access (data/tools/memory) and retention are disclosed.
- [ ] "Don't know / out of scope / stale" is surfaced honestly, not faked.
- [ ] Explanations reflect the actual process, not a flattering story.
- [ ] Multi-step work shows live, truthful progress.

## Trade-offs

Transparency competes with simplicity and, sometimes, with IP or safety constraints.
Too much detail overwhelms and can mislead (more text ≠ more understanding); too little
leaves users unable to judge output. Layer it: lightweight by default, deep on demand.
Prefer honesty about limits over completeness of internals.
