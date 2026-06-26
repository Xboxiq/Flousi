# Flousi — Design System (Single Source of Truth)

> One source of truth. No duplicated values. All tokens are implemented as CSS variables
> in `src/presentation/styles/globals.css` and exposed to Tailwind v4 via `@theme`.
> Components consume **semantic** tokens, never raw values.

## 0. Principles
- Calm, clean, premium, financial, trustworthy. Reference quality: Stripe, Linear, Vercel.
- One accent color, locked across the whole app. One radius scale. One type system.
- Dual light/dark from day one. WCAG AA minimum (AAA for primary numbers).
- Numbers are always tabular mono. Profit polarity is color-coded consistently.

## 1. Token tiers
1. **Primitive tokens** — raw palette + scales (e.g. `--blue-600`, `--space-4`). Never used directly by components.
2. **Semantic tokens** — intent-based aliases (`--color-bg`, `--color-text`, `--color-accent`, `--color-success`). Components use these.
3. **Component tokens** — only when a component needs local nuance; derived from semantic tokens.

## 2. Color system

### Neutrals — Slate/Zinc cool gray (financial, calm). No pure black/white.
`--gray-50 … --gray-950` (off-white `#fbfcfd` … near-black `#0a0c10`).

### Accent — single brand accent: **Indigo/Blue** (`--brand-600 ~ #4f46e5`-family).
The references lean blue for finance + neumorphic flows; we lock blue as the only accent.

### Semantic (light → dark swap)
| Token | Role |
|---|---|
| `--color-bg` | app background (off-white / near-black) |
| `--color-surface` | cards, panels |
| `--color-surface-2` | elevated/nested surfaces |
| `--color-border` | hairlines, dividers |
| `--color-text` | primary text |
| `--color-text-muted` | secondary text |
| `--color-text-subtle` | tertiary/placeholder |
| `--color-accent` | brand accent (CTAs, active nav, focus) |
| `--color-accent-fg` | text/icon on accent |
| `--color-success` | profit positive (emerald) |
| `--color-danger` | loss / destructive (rose) |
| `--color-warning` | caution (amber) |
| `--color-info` | neutral info (blue) |
| `--color-focus` | focus ring |

**Financial polarity (locked):** positive profit → `--color-success`; negative → `--color-danger`; zero/break-even → `--color-text-muted`.

## 3. Typography
- **Sans:** Geist (display + UI). **Mono:** Geist Mono (all numbers, SKUs, currency).
- Scale (`--text-*`): xs 12 / sm 14 / base 15 / md 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30 / 4xl 36 / 5xl 48.
- Weights: 400 body, 500 medium (labels), 600 semibold (headings/numbers).
- Line-heights: tight 1.15 (headings), normal 1.5 (body). Body max width ~65ch.
- Numbers: `font-variant-numeric: tabular-nums;` always.

## 4. Spacing scale (4px base)
`--space-0:0` `1:4` `2:8` `3:12` `4:16` `5:20` `6:24` `8:32` `10:40` `12:48` `16:64` `20:80` `24:96`.
No arbitrary one-off spacing; compose from the scale.

## 5. Radius
`--radius-sm:6px` `--radius-md:10px` `--radius-lg:14px` `--radius-xl:20px` `--radius-full:9999px`.
Lock: cards/inputs `md`, large panels `lg/xl`, pills/avatars `full`. Consistent everywhere.

## 6. Elevation / shadows (tinted to bg, never pure black)
- `--shadow-xs` subtle border-companion.
- `--shadow-sm` resting card.
- `--shadow-md` hover/raised.
- `--shadow-lg` popovers/menus.
- `--shadow-xl` modals.
Dark mode uses deeper, lower-opacity shadows + a subtle inner top highlight.

## 7. Motion
- Durations: `--motion-fast 120ms` · `--motion-base 200ms` · `--motion-slow 320ms`.
- Easing: `--ease-out cubic-bezier(.33,1,.68,1)` (enter), `--ease-in-out cubic-bezier(.65,.05,.36,1)` (move), `--ease-in cubic-bezier(.32,0,.67,0)` (exit).
- Rules: animate only `transform`/`opacity`; exits ~75% of enter duration; everything collapses under `prefers-reduced-motion`.
- Patterns: hover lift on cards, `scale(0.98)` button press, fade/slide-in on mount, shared `layoutId` for active nav/tab indicator, skeleton shimmer.

## 8. Grid & layout
- Container: `max-w-[1400px] mx-auto`, page padding `px-4 md:px-6 lg:px-8`.
- App shell: fixed sidebar (≤72px collapsed / 240px expanded) + content column.
- KPI grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.
- Use CSS Grid (no flex percentage math). `min-h-[100dvh]`, never `h-screen`.

## 9. Breakpoints
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536` (Tailwind defaults, standardized).

## 10. Iconography
- `@phosphor-icons/react`, one family, global `weight="regular"` (duotone reserved for emphasis), `size` from a fixed set (16/20/24).
- Never hand-roll SVG icon paths.

## 11. Component states (every interactive primitive)
default · hover · active (`scale .98`) · focus-visible (`--color-focus` ring) · disabled · loading · error · selected. Plus container-level loading (skeleton) / empty / error states.

## 12. Accessibility rules
- WCAG AA contrast (AAA for headline numbers). Verified in both themes.
- Visible focus ring on all interactive elements; logical tab order.
- Labels above inputs; helper below; error below. No placeholder-as-label.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Charts: provide text/table equivalents and accessible labels.
- RTL-aware (Arabic): use logical properties (`ms-*`/`me-*`), `dir` attribute.

## 13. Dark mode protocol
- Strategy: **CSS variables** swapped under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.
- Theme set once at the app root (provider) with a manual toggle; default = system.
- Maintain hierarchy parity and brand fidelity; off-black/off-white only.

## 14. Documentation & governance
- This file is the contract. Changing a token = edit `globals.css` + this doc together.
- No component defines a raw hex/px that exists as a token. New need → add a token first.
- A future `/styleguide` route will render living examples of every primitive + token.
