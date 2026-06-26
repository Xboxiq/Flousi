---
name: progressive-disclosure
description: Reveal AI capability gradually so the interface matches the user's evolving mental model. Use this skill when designing AI features, onboarding, command surfaces, settings, or any UI where showing everything at once would overwhelm users. Covers layered reveal, defaults-first design, and just-in-time capability surfacing.
---

# Progressive Disclosure for AI Interfaces

## Overview

Progressive disclosure is the practice of showing users only what they need at the
current moment, then revealing depth and power on demand. For AI products this is
critical: the full capability surface of a model is enormous and unfamiliar, and
dumping it on a new user produces confusion, distrust, and abandonment.

The goal is to grow the user's mental model in step with the interface, so each new
capability appears exactly when the user is ready to understand and use it.

## Core Principle

> Match the visible complexity of the interface to the user's current intent and skill.
> Power that isn't needed right now should be one deliberate step away, not absent and
> not in the way.

## When to Use This Skill

- Designing onboarding for an AI feature or assistant
- A surface is accumulating options, toggles, modes, or prompt controls
- Users report feeling overwhelmed, or never discover advanced features
- Designing command palettes, slash menus, settings, or model/tool pickers
- Deciding what to show by default vs. behind "Advanced" / "More"

## The Three Layers

1. **Entry layer (default).** The single most common path, working with zero
   configuration. A sensible default does the right thing for ~80% of users. No jargon,
   no required choices.
2. **Adjustment layer.** Controls that a returning or engaged user reaches for: tone,
   length, model choice, sources, regenerate. Visible but secondary — one click/expand
   away.
3. **Expert layer.** Full control: system prompts, parameters, raw output, tool
   configuration, API surface. Discoverable but never blocking the primary task.

Each layer should be independently usable. A user must be able to succeed at the entry
layer forever without ever opening the others.

## Patterns

- **Defaults first.** Ship a confident default and label the escape hatch ("Customize",
  "Advanced"). Never present an empty form where a default would do.
- **Just-in-time reveal.** Surface a capability at the moment it becomes relevant (e.g.,
  show "cite sources" only after the AI produces a factual claim), not in a startup tour.
- **Staged onboarding.** Teach one capability per interaction. Let the user succeed,
  then introduce the next. Avoid multi-step coach-mark tours.
- **Earned complexity.** Unlock or highlight advanced controls after the user has
  demonstrated the corresponding intent (used a feature 3x → offer the power version).
- **Summary → detail.** Show a concise answer with an affordance to expand reasoning,
  sources, or alternatives ("Show steps", "Why?", "See sources").
- **Contextual density.** Collapse rarely-used options into menus; promote frequently
  used ones into the primary surface based on observed behavior.

## Decision Guide

| Situation | Do this |
|-----------|---------|
| New capability most users won't need | Hide behind a clearly labeled "Advanced" affordance |
| A required input that has a reasonable default | Pre-fill the default; allow override |
| Powerful but risky action | Reveal progressively + confirm; never default-on |
| Reasoning/sources behind an answer | Collapse by default, one tap to expand |
| Feature with low discovery | Surface just-in-time, tied to a relevant trigger |

## Anti-Patterns

- Front-loading every setting "so users know it exists" — this hides the important
  behind the unimportant.
- Multi-screen tours before the user has done anything.
- Hiding a capability so deeply it is effectively invisible (disclosure ≠ burial).
- Defaults that are safe-for-the-builder but useless for the user (empty/neutral).
- Re-asking for configuration the user already implicitly answered.

## Quality Checklist

- [ ] A brand-new user can complete the primary task with zero configuration.
- [ ] Each visible control earns its place for the current intent.
- [ ] Advanced power is reachable in one deliberate, labeled step.
- [ ] New capabilities appear when relevant, not all at startup.
- [ ] Expanding detail (reasoning/sources) is optional and non-blocking.

## Trade-offs

Progressive disclosure reduces overwhelm but can hurt discoverability if overdone — power
users may not find features. Balance by (a) using observed behavior to promote controls,
(b) keeping a single predictable "show everything" path, and (c) labeling escape hatches
clearly. This is a trade-off to reason about per surface, not a rigid rule.
