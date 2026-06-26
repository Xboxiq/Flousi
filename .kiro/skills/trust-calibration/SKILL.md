---
name: trust-calibration
description: Help users place warranted trust in AI output - neither over-trusting nor under-trusting - by surfacing confidence, sources, and uncertainty honestly. Use this skill when designing how an AI presents answers, recommendations, predictions, or actions, especially in high-stakes domains. Covers confidence signaling, source grounding, and failure framing.
---

# Trust Calibration

## Overview

Trust calibration is the practice of helping users trust an AI system *exactly as much
as it deserves on each output* — no more, no less. Two failure modes matter:

- **Over-trust (over-reliance):** the user accepts wrong output because the AI sounded
  confident. This is dangerous in proportion to stakes.
- **Under-trust (under-reliance):** the user ignores correct, useful output, losing the
  value of the system.

Well-calibrated trust means the user's confidence tracks the system's actual reliability
in this context. Research consistently shows users read AI *fluency and confidence as
competence*, and that trust drops sharply after a visible error — so honest signaling
matters more than impressive presentation. (Content rephrased for compliance.)

## Core Principle

> Make the system's real reliability legible at the point of decision. The user should be
> able to tell a strong answer from a shaky one without being an expert.

## When to Use This Skill

- Presenting answers, recommendations, predictions, classifications, or summaries
- Designing AI in high-stakes domains (health, finance, legal, safety)
- Output may be confidently wrong (hallucination-prone tasks)
- Deciding how much to encourage the user to verify vs. accept
- Designing how the AI communicates and recovers from errors

## Signals That Build Warranted Trust

- **Source grounding.** Cite where claims come from; link to the original; show quoted
  evidence. Ungrounded claims should look different from grounded ones.
- **Calibrated confidence.** Communicate confidence in a form the user can act on
  (verbal hedging done honestly, ranges, or "verify this" flags) — and only sound
  confident when the system actually is.
- **Uncertainty + alternatives.** Show competing answers or "I'm not sure, here are two
  possibilities" when the model genuinely is split.
- **Scope honesty.** State what the system did and did not consider, and what's outside
  its competence.
- **Track record / provenance.** Where appropriate, show how this kind of output has
  performed, or that it's based on stale/partial data.

## Calibrating Down (preventing over-trust)

- Flag low-confidence or unverifiable claims explicitly; don't smooth them into the same
  confident prose as solid claims.
- For high-stakes actions, add friction proportional to risk (review step, verify
  prompt), not blanket warnings everyone ignores.
- Avoid false precision (e.g., "94.7%") unless the number is real and meaningful.
- Make verification cheap: link straight to the source the user would check.

## Calibrating Up (preventing under-trust)

- Show the reasoning/evidence so good answers are visibly justified, not magic.
- Be consistent: erratic quality destroys trust faster than uniform modest quality.
- Recover gracefully from errors — acknowledge, correct, and explain — because trust
  withdrawn after an error is hard to win back.
- Don't over-hedge correct, well-grounded answers into uselessness.

## Anti-Patterns

- Uniform confident tone regardless of actual certainty.
- Confidence theater: scores, percentages, or "verified" badges not tied to real signals.
- Warning on everything (warning blindness) or warning on nothing.
- Hiding sources, or citing sources that don't actually support the claim.
- Apologizing without correcting, or correcting silently with no acknowledgment.

## Quality Checklist

- [ ] A shaky answer is visibly distinguishable from a solid one.
- [ ] Confidence signals reflect the system's real reliability, not its tone.
- [ ] Sources are present, relevant, and one click from verification.
- [ ] High-stakes outputs carry friction proportional to risk.
- [ ] Errors are acknowledged and corrected, not buried.
- [ ] Good answers aren't over-hedged into uselessness.

## Trade-offs

Every trust signal adds UI weight and can become noise if overused; warnings lose meaning
when ubiquitous. Calibrate the *amount* of signaling to stakes and to how often the system
is actually uncertain. The aim is appropriate reliance, not maximum caution.
