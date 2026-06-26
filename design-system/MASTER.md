# Flousi — Design System MASTER (source of truth)

> Generated from the **ui-ux-pro-max** skill (`.kiro/steering/ui-ux-pro-max`) reasoning
> over Flousi's product type, cross-checked against the reference screens in `references/`.
> This file overrides taste. When building a page, read this first.

## Product read
Flousi = profit calculator / financial tracker for online stores & small businesses.
Closest skill product types: **Invoice & Billing Tool** + **Personal Finance Tracker**.
Dashboard archetype: **Financial Dashboard**.

## Style (locked)
- **Bento Box Grid** for the app surfaces: modular cards, varied spans (1x1/2x1/2x2), rounded 16-24px, subtle soft shadows, hover scale 1.02, page bg `#F5F5F7`, card `#FFFFFF`.
- **Soft UI Evolution** (accessible neumorphism): soft multi-layer shadows (softer than flat, clearer than pure neumorphism), radius 8-12px on controls, 200-300ms transitions, **WCAG AA+ contrast** (NOT low-contrast pure neumorphism).
- Accent material: a restrained **brand gradient mesh** (blue → teal/green) on the hero/CTA only.

## Color (locked) — trust blue + profit green + alert red + slate neutrals
| Role | Light | Dark |
|---|---|---|
| Primary (trust blue) | `#1E40AF` | `#3B82F6` |
| Primary hover | `#1B399E` | `#2563EB` |
| On primary | `#FFFFFF` | `#FFFFFF` |
| Secondary blue | `#3B82F6` | `#60A5FA` |
| Profit / success / CTA-accent (green) | `#059669` | `#10B981` |
| Background (page) | `#F5F5F7` | `#0F172A` |
| Surface / card | `#FFFFFF` | `#192134` |
| Surface-2 | `#EFEFF3` | `#1E2740` |
| Sunken | `#E9E9EE` | `#101A34` |
| Border | `#E5E6EB` | `rgba(255,255,255,0.08)` |
| Foreground | `#1D1D1F` | `#F8FAFC` |
| Muted text | `#5B6472` | `#94A3B8` |
| Subtle text | `#9AA1AD` | `#64748B` |
| Destructive (loss) | `#DC2626` | `#EF4444` |
| Warning | `#D97706` | `#F59E0B` |

- **Accent lock:** trust blue is the single interactive accent (nav active, primary buttons, focus). Green is the **profit/positive semantic** (net-profit figures, success). Red = loss/destructive.

## Typography (locked) — skill "Financial Trust"
- **Sans (UI + headings):** IBM Plex Sans (300-700).
- **Mono (all numbers, money, SKU):** IBM Plex Mono.
- Mood: financial, trustworthy, professional, excellent for data.
- Google Fonts: `IBM+Plex+Sans` + `IBM+Plex+Mono`.

## Radius (locked)
`sm 8px · md 12px · lg 16px · xl 24px · full 9999px`. Buttons = pill; cards = 16-24px; inputs = 12px.

## Effects / motion
- Soft multi-layer shadows; card hover `scale(1.02)` + shadow lift; press `scale(0.98)`.
- Transitions 200-300ms, easing `cubic-bezier(.33,1,.68,1)`. Respect `prefers-reduced-motion`.
- Visible focus ring (trust blue), 2-3px.

## Anti-patterns (from the skill — DO NOT do)
- **No AI purple/pink/violet gradients** (finance anti-pattern). Brand mesh is blue→teal/green only.
- No pure-white page backgrounds (use `#F5F5F7`).
- No low-contrast pure neumorphism (use Soft UI Evolution, AA+).
- No emojis as icons (SVG icons only). cursor-pointer on clickables. Focus states visible.

## Pre-delivery checklist
- [ ] Responsive at 375 / 768 / 1024 / 1440.
- [ ] Text contrast ≥ 4.5:1 (light & dark).
- [ ] Hover (150-300ms) + visible focus on all interactive elements.
- [ ] `prefers-reduced-motion` respected.
- [ ] Numbers in IBM Plex Mono, profit polarity colored (green/red).
- [ ] No purple/violet anywhere; brand mesh is blue→teal only.
