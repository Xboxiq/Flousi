---
name: output-quality-rubrics
description: Define what "good" means for AI output in measurable terms - accuracy, relevance, helpfulness, safety - and turn it into rubrics you can evaluate against. Use this skill when specifying acceptance criteria for an AI feature, building evals, reviewing model output, or deciding whether output is ship-ready. Covers rubric design, scoring, and evaluation workflows.
---

# Output Quality Rubrics

## Overview

"Make it better" is unactionable. A rubric turns a fuzzy sense of quality into explicit,
measurable dimensions you can score, track, and improve against. Rubrics make quality
*observable* — they let a team agree on what good means, catch regressions, and compare
prompts/models objectively instead of by vibes.

## Core Principle

> Define "good" before you generate, in terms you can measure after. If you can't score
> it, you can't reliably improve it.

## When to Use This Skill

- Writing acceptance criteria for an AI feature
- Building evals / a test set for prompts or model changes
- Reviewing AI output before shipping
- Comparing prompts, models, or settings
- Diagnosing *why* output feels off

## Common Quality Dimensions

Pick the subset that matters for the task; don't score dimensions that don't apply.

- **Accuracy / factuality** — claims are correct and verifiable; no fabrication.
- **Relevance** — addresses the actual request and context; nothing off-topic.
- **Completeness** — covers what was asked; no critical omissions; no padding.
- **Helpfulness** — moves the user toward their goal; actionable, not generic.
- **Faithfulness / grounding** — stays consistent with provided sources/context.
- **Coherence & clarity** — well-structured, unambiguous, right reading level.
- **Tone & format fit** — matches requested style, format, length, and audience.
- **Safety & policy** — no harmful, biased, or disallowed content; honest refusals.
- **Calibration** — confidence and hedging match actual certainty.

## Designing a Rubric

1. **Name the task and the user goal.** Quality is relative to intent.
2. **Choose 3–6 dimensions** that actually matter here. More than ~6 dilutes focus.
3. **Define each level concretely.** Anchor scores with observable descriptions, not
   adjectives. Prefer a short scale (e.g., 0–2 or 1–4) with explicit anchors.
4. **Set gates vs. graded dimensions.** Some dimensions are pass/fail (safety,
   factuality) — a failure blocks ship regardless of other scores. Others are graded.
5. **Specify evidence.** State how a scorer decides (check sources? run the code?),
   so scoring is repeatable across people/runs.
6. **Weight by stakes.** In high-stakes domains, accuracy/safety dominate; in
   brainstorming, helpfulness/novelty may matter more.

### Example anchor (Accuracy, 0–2)

| Score | Anchor |
|-------|--------|
| 0 | Contains a false or fabricated claim |
| 1 | Mostly correct; minor unverifiable detail |
| 2 | All claims correct and grounded in cited sources |

## Evaluation Workflow

- **Golden set.** Keep a fixed set of representative inputs with known-good expectations.
- **Score consistently.** Apply the same rubric to every candidate; record per-dimension
  scores, not just an overall verdict.
- **Track over time.** Re-run the set on every prompt/model change to catch regressions.
- **Human + automated.** Use automated checks (exact match, schema, source-overlap, LLM-
  as-judge) for scale; keep human review for the dimensions automation judges poorly.
- **Close the loop.** When output fails, trace which dimension failed and fix the prompt/
  retrieval/guardrail responsible — not just the one example.

## Anti-Patterns

- Single "looks good" verdict with no dimensions (unimprovable, unauditable).
- Vague anchors ("good", "high quality") that two reviewers score differently.
- Scoring 12 dimensions nobody acts on (rubric theater).
- Optimizing one dimension (fluency) while a gate (accuracy/safety) silently fails.
- Evaluating once and never re-running as prompts/models drift.

## Quality Checklist

- [ ] The rubric names the task and user goal.
- [ ] 3–6 relevant dimensions, each with concrete level anchors.
- [ ] Gate dimensions (safety, factuality) are pass/fail and block ship.
- [ ] Scoring is evidence-based and repeatable across reviewers.
- [ ] A golden set exists and is re-run on changes to catch regressions.

## Trade-offs

Rigorous rubrics cost effort to build and maintain and can over-index on what's easy to
measure (fluency) over what matters (correctness, usefulness). Keep rubrics lean, weight
toward the dimensions that carry real risk, and revisit them as the product and failure
modes evolve.
