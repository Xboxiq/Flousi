---
name: anti-slop-ui
description: Enforces strict UI/UX, visual, and copywriting standards by prohibiting 30 cliché AI-generated interface tropes and generic design patterns. Use unconditionally whenever designing, developing, refactoring, or reviewing web applications, landing pages, frontend components, CSS styles, or marketing pages.
---

# Anti-Slop UI & UX Design Standards

This skill enforces strict frontend design integrity by explicitly eliminating 30 generic, repetitive, and low-effort "AI-generated" tropes. Every interface built under these standards must be grounded, authentic, high-utility, and engineered with precision.

---

## The 30 Prohibited Patterns & Mandatory Standards

```
+========================================================================================+
|                              THE 30 BANNED UI/UX PATTERNS                              |
+========================================================================================+
| 01. Harsh Gradients          11. Colored Left Stripe        21. No Skeleton Loaders    |
| 02. Lucide Icons             12. Fake Testimonials          22. Radial Orbs            |
| 03. Pure White Background    13. Bento Grids                23. Dot Grids              |
| 04. Rainbow Coloring         14. Terminal Window            24. Sparkle Icons          |
| 05. Drop Shadows             15. "It's not X, it's Y" Copy  25. Animated Arrows        |
| 06. 3 Feature Cards in a Row 16. Checkmark Bullets          26. No Terms of Service    |
| 07. Emojis in UI / Copy      17. 3 Pricing Tiers            27. No Privacy Policy      |
| 08. Liquid Glass (Glassmorphism) 18. No Real Product Demos  28. Hover Animations/Lift  |
| 09. Em Dashes (—)            19. Soft Corner Radius (Pills) 29. Neon Colors            |
| 10. Inter / Geist / Space Grotesk 20. Purple on Black Dark Mode 30. Basic Pastel Colors|
+========================================================================================+
```

---

## 1. Color Palette & Chromatic Discipline

### 1. No Harsh Gradients
* **FORBIDDEN**: Multi-stop linear or angular gradients, rainbow angle fills, or high-contrast gradient text fills (`background: linear-gradient(...)`).
* **REQUIRED**: Solid, disciplined color fields or barely perceptible single-step tonal shifts.
* **Bad**: `background: linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%);`
* **Good**: `background: #0f1117;` or `background: #181b22; border: 1px solid #262a35;`

### 2. No Pure White Backgrounds (`#FFFFFF`)
* **FORBIDDEN**: Full-bleed blinding pure white canvases (`#ffffff` / `rgb(255,255,255)`).
* **REQUIRED**: Intentional off-whites, warm neutral surfaces, paper tints, or slates.
* **Bad**: `background: #ffffff; color: #000000;`
* **Good**: `background: #F8F9FA;` or `background: #F4F4F5;` or `background: #0F172A;`

### 3. No Rainbow Coloring
* **FORBIDDEN**: Distributing arbitrary accent colors (green badge, yellow card, blue button, pink tag) across one screen.
* **REQUIRED**: Maximum 1 primary brand hue + 1 functional accent (e.g., error red or status amber) with monochromatic scale.

### 4. No Purple on Black / Violet Glow
* **FORBIDDEN**: The default "AI dark mode" aesthetic featuring jet black backgrounds with purple/violet `#8b5cf6`/`#a855f7` accents and glowing borders.
* **REQUIRED**: Engineered dark palettes (deep slate, obsidian, carbon, dark bronze, warm charcoal) paired with neutral or technical accents (e.g., zinc, amber, or ice blue).

### 5. No Neon Colors
* **FORBIDDEN**: Saturated neon green (`#00FF00`), electric cyan (`#00FFFF`), radioactive hot pink, or glowing laser accents.
* **REQUIRED**: Calibrated, accessible, mature chroma tones (e.g., `#0284C7`, `#059669`, `#D97706`).

### 6. No Basic Pastels
* **FORBIDDEN**: Washed-out candy pastels (baby pink, soft lavender, minty lime without contrast).
* **REQUIRED**: High-contrast, grounded palettes with crisp visual delineation.

---

## 2. Surfaces, Depth & Geometric Structure

### 7. No Drop Shadows (`box-shadow`)
* **FORBIDDEN**: Heavy, floaty outer drop shadows (`box-shadow: 0 10px 30px rgba(0,0,0,0.15)`).
* **REQUIRED**: Crisp 1px solid borders, hairline dividers, or subtle background tone contrast for depth.
* **Bad**: `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);`
* **Good**: `border: 1px solid #E2E8F0; background: #FFFFFF;` (or dark mode: `border: 1px solid #27272A; background: #121215;`)

### 8. No Liquid Glass / Glassmorphism
* **FORBIDDEN**: Translucent milky cards with heavy blur (`backdrop-filter: blur(...)`), frosted glass panels, and glass shine effects.
* **REQUIRED**: Solid, opaque, structured surfaces with defined borders.

### 9. No Soft / Overly Rounded Corner Radii
* **FORBIDDEN**: Exaggerated pill shapes, `rounded-3xl` (24px+), bubbled containers, and playful jelly-like corners.
* **REQUIRED**: Sharp (`0px`) or tight, architectural radii (`2px` to `6px` maximum).
* **Bad**: `border-radius: 28px;` or `border-radius: 9999px;` (for containers)
* **Good**: `border-radius: 0px;` or `border-radius: 4px;` or `border-radius: 6px;`

### 10. No Colored Left Stripes
* **FORBIDDEN**: The cliché 3px/4px colored border stripe on the left edge of cards, alerts, or quotes (`border-left: 4px solid #3b82f6`).
* **REQUIRED**: Unified borders, clear typography, or distinct inline status badges.

### 11. No Radial Orbs / Ambient Light Blobs
* **FORBIDDEN**: Blurry radial gradients floating in background corners (`radial-gradient(circle at 50% 50%, rgba(139,92,246,0.3) 0%, transparent 70%)`).
* **REQUIRED**: Clean, purposeful background architecture without decorative faux-glow fluff.

### 12. No Dot Grids or Mesh Backgrounds
* **FORBIDDEN**: Dot pattern overlays (`radial-gradient(#333 1px, transparent 1px)`), grid line backgrounds, or particle networks.
* **REQUIRED**: Clean canvas, subtle noise texture, or intentional typography-driven structure.

---

## 3. Layout, Architecture & Component Patterns

### 13. No "3 Feature Cards in a Row"
* **FORBIDDEN**: The cookie-cutter 3-column equal card grid (`grid-cols-3` with icon + title + short paragraph).
* **REQUIRED**: Asymmetrical layouts, deep master-detail rows, interactive tabbed workflows, or narrative split showcases.

### 14. No Bento Grids
* **FORBIDDEN**: Bento box layouts stuffed with disparate miniature cards, micro-charts, and random metrics.
* **REQUIRED**: Linear workflows, structured data tables, or focused deep-dive sections.

### 15. No Terminal Window Clichés
* **FORBIDDEN**: Faux macOS terminal windows with red/yellow/green top-left dots displaying mock code or commands in marketing heroes.
* **REQUIRED**: Real functional interactive playgrounds, actual product interfaces, or clean technical documentation blocks.

### 16. No "3 Pricing Tiers" Cliché
* **FORBIDDEN**: Standard 3-column pricing (Free / Pro with "Most Popular" ribbon / Enterprise).
* **REQUIRED**: Interactive usage/ROI sliders, transparent flat pricing tables, or modular feature-matrix configurators.

---

## 4. Iconography, Assets & Motion

### 17. No Lucide Icons
* **FORBIDDEN**: Default Lucide / Feather icon sets that give the generic Tailwind UI template appearance.
* **REQUIRED**: Bespoke custom SVGs, standard OS system symbols, or typography-first indicators.

### 18. No Emojis in UI or Copy
* **FORBIDDEN**: Using emojis (🚀, 💡, 🔥, ⚡, 🤖, 🧠, ✨) as section headers, card icons, or bullet points.
* **REQUIRED**: Precise technical SVG iconography or clean typographic labels.

### 19. No Sparkle Icons (✨)
* **FORBIDDEN**: AI "magic" sparkles, star cluster icons, or glowing wand glyphs.
* **REQUIRED**: Direct functional terminology (e.g., "Automated Analysis", "Synthesize", "Compute").

### 20. No Animated / Bouncing Arrows
* **FORBIDDEN**: Bouncing scroll-down arrows (`↓`), pulsing directional indicators, or floating pointer arrows.
* **REQUIRED**: Static, clear, accessible affordances and natural layout hierarchy.

### 21. No Hover Transformations / Elevating Lift
* **FORBIDDEN**: `transform: translateY(-4px) scale(1.02)` on card hovers, bouncy card expansions, or springy hover animations.
* **REQUIRED**: Subtle, instant state shifts (e.g., crisp border-color or background-color transition under `150ms ease`).
* **Bad**: `transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); &:hover { transform: translateY(-8px); }`
* **Good**: `transition: border-color 0.15s ease, background-color 0.15s ease; &:hover { border-color: #71717A; }`

---

## 5. Typography & Copywriting

### 22. No Inter, Geist, or Space Grotesk
* **FORBIDDEN**: Defaulting to the overused trio: Inter, Geist, or Space Grotesk.
* **REQUIRED**: Distinct, deliberate typefaces selected for the specific domain:
  - Technical / Modern: IBM Plex Sans, Plus Jakarta Sans, Archivo, General Sans, Satoshi.
  - Editorial / Refined: Newsreader, Fraunces, Playfair, Cormorant, Instrument Serif.
  - Monospace: JetBrains Mono, Fira Code, IBM Plex Mono.

### 23. No Em Dashes (`—`)
* **FORBIDDEN**: Using em dashes (`—`) in headlines, titles, or marketing subheaders.
* **REQUIRED**: Use natural, concise sentences, colons, or clean periods.

### 24. No "It’s not X, it’s Y" Copy Formula
* **FORBIDDEN**: Cliché marketing formulas (e.g., "It's not just a database, it's your engine", "Don't build faster. Build smarter.").
* **REQUIRED**: Direct, objective, technical descriptions that communicate exact value and utility.

### 25. No Checkmark Bullets (✔ / ✅)
* **FORBIDDEN**: Green, blue, or SVG checkmark icons as bullet points in feature lists.
* **REQUIRED**: Clean structured lists with typographic hierarchy, minimal dashes (`-`), or numbered steps.

---

## 6. Transparency, Product Reality & Mandatory Features

### 26. No Fake Testimonials
* **FORBIDDEN**: Fabricated quotes ("Changed my life — Sarah K., VP of Ops"), fake circular avatar photos, or made-up logos.
* **REQUIRED**: Verifiable case studies, concrete benchmark data, real platform metrics, or omit social proof completely.

### 27. MANDATORY: Real Product Demos (No Empty Fluff)
* **FORBIDDEN**: Static placeholder images, abstract mockups, or vague marketing copy without showing the actual tool.
* **REQUIRED**: Interactive, functional UI components, live playground demos, or real working feature previews.

### 28. MANDATORY: Skeleton Loaders
* **FORBIDDEN**: Blank white/black flashes, missing loading states, or jarring layout shifts during async data loading.
* **REQUIRED**: Carefully proportioned, matching skeleton loaders for all dynamic elements and data-fetching views.

### 29. MANDATORY: Terms of Service (TOS)
* **FORBIDDEN**: Omitting legal terms or leaving dead `#` links in footers.
* **REQUIRED**: Clear, accessible Terms of Service link and dedicated modal or page in every application/landing layout.

### 30. MANDATORY: Privacy Policy
* **FORBIDDEN**: Omitting privacy documentation or leaving dead `#` links in footers.
* **REQUIRED**: Clear, accessible Privacy Policy link and dedicated modal or page in every application/landing layout.

---

## Automated Verification Checklist

Before finalizing any UI, verify the code against this matrix:

| # | Check Item | Status |
|---|---|---|
| 01 | No harsh gradients or multi-color linear text fills | [ ] Pass |
| 02 | No Lucide / Feather icon sets | [ ] Pass |
| 03 | No pure `#ffffff` canvas background | [ ] Pass |
| 04 | No rainbow color distribution | [ ] Pass |
| 05 | No floaty `box-shadow` (using crisp 1px borders instead) | [ ] Pass |
| 06 | No generic 3-in-a-row feature cards | [ ] Pass |
| 07 | No emojis anywhere in copy or UI | [ ] Pass |
| 08 | No backdrop-filter blur / liquid glassmorphism | [ ] Pass |
| 09 | No em dashes (`—`) in copy | [ ] Pass |
| 10 | No Inter, Geist, or Space Grotesk font families | [ ] Pass |
| 11 | No colored 3px/4px left accent stripe on cards | [ ] Pass |
| 12 | No fake testimonials or fictitious persona quotes | [ ] Pass |
| 13 | No bento grid collage layouts | [ ] Pass |
| 14 | No fake terminal window hero displays | [ ] Pass |
| 15 | No "It's not X, it's Y" copy formulas | [ ] Pass |
| 16 | No checkmark icons (✔ / ✅) as list bullets | [ ] Pass |
| 17 | No cliché 3-tier pricing layout | [ ] Pass |
| 18 | Interactive, functional real product demo is present | [ ] Pass |
| 19 | Corner radii are crisp and restrained ($\le 6\text{px}$) | [ ] Pass |
| 20 | No purple-on-black generic dark mode | [ ] Pass |
| 21 | Skeleton loaders implemented for dynamic states | [ ] Pass |
| 22 | No glowing background radial orbs | [ ] Pass |
| 23 | No dot grid or blueprint grid backgrounds | [ ] Pass |
| 24 | No AI sparkle (✨) icons | [ ] Pass |
| 25 | No animated/bouncing directional arrows | [ ] Pass |
| 26 | Terms of Service link and view implemented | [ ] Pass |
| 27 | Privacy Policy link and view implemented | [ ] Pass |
| 28 | No translateY lift / hover scaling transformations | [ ] Pass |
| 29 | No neon saturated colors | [ ] Pass |
| 30 | No generic washed-out candy pastel colors | [ ] Pass |
