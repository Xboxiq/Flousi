# Flousi — Recipe Book (image-grade CSS, mined from Xboxiq/nova)

> First-party source: the client's `Xboxiq/nova` (`nova-ui-library.html` +
> `design-system/tokens.css` + `src/madar/`). License: client-owned.
> RULE: port the TECHNIQUE, rebind every hex to Flousi tokens (nova's legacy
> violet violates our slop gate). Each recipe names its Flousi target.
> These feed D0 (direction proof) and D1 (asset foundry).

## R1 — Mesh money field (2 radials + linear + dot-grain overlay)
Target: balance/net-profit hero fields. Inset white glow = clay bloom; 3px
`mix-blend-mode:overlay` dot grid kills banding.
```css
.field-money{position:relative;overflow:hidden;border-radius:22px;
  background:radial-gradient(circle at 76% 24%, color-mix(in srgb,var(--accent) 60%,white), transparent 32%),
    radial-gradient(circle at 20% 78%, color-mix(in srgb,var(--success) 45%,white), transparent 34%),
    linear-gradient(120deg, var(--accent-soft), var(--bg-tint) 45%, var(--accent-soft));
  box-shadow:inset 0 0 55px rgba(255,255,255,.38)}
.field-money::after{content:"";position:absolute;inset:0;opacity:.22;pointer-events:none;
  background-image:radial-gradient(var(--ink) .65px, transparent .65px);
  background-size:3px 3px;mix-blend-mode:overlay}
```

## R2 — Real glass (specular + caustic + two-lip edge)
Target: glass panels (ProfitPanel, top chrome, overlays). Two insets: bright top
lip + dark bottom lip. Ship with the reduced-transparency fallback.
```css
.glass{position:relative;isolation:isolate;overflow:hidden;
  background:linear-gradient(148deg,var(--glass-strong),var(--glass) 48%,
    color-mix(in srgb,var(--glass) 70%,var(--glass-caustic)));
  border:1px solid var(--glass-edge);
  box-shadow:0 1px 0 rgb(255 255 255/.64) inset, 0 -1px 0 rgb(20 30 40/.10) inset,
    0 18px 46px rgb(20 30 40/.12), 0 3px 12px rgb(20 30 40/.08);
  backdrop-filter:blur(28px) saturate(180%) contrast(104%)}
.glass::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(112deg,var(--glass-specular),transparent 28% 68%,var(--glass-caustic));
  mask-image:linear-gradient(to bottom,black,transparent 58%)}
.glass>*{position:relative;z-index:1}
@media (prefers-reduced-transparency:reduce){.glass{background:var(--surface);backdrop-filter:none}}
```

## R3 — Animated conic rim via @property (state-bound)
Target: target-arc "goal reached" rim. Blue→teal→green spectrum only.
`background:inherit` + blur on the pseudo = one gradient, crisp rim + soft bloom.
```css
@property --rim-angle{syntax:"<angle>";initial-value:0deg;inherits:false}
.goal-rim{--rim-angle:0deg;padding:2px;border-radius:28px;
  background:conic-gradient(from var(--rim-angle),var(--accent),var(--success),var(--accent));
  animation:rim-rotate 5s linear infinite}
.goal-rim::before{content:"";position:absolute;inset:-14px;z-index:-1;border-radius:inherit;
  background:inherit;filter:blur(26px);opacity:.5}
@keyframes rim-rotate{to{--rim-angle:360deg}}
```

## R4 — Pointer-tracked metal/foil (blend-mode trio + 3D tilt)
Target: the Coin, premium cards, receipt seal. `screen, color, normal` blending:
mid layer contributes hue only — metal stays metal.
```css
.foil{--mx:50%;--my:50%;overflow:hidden;
  background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,.95) 0 8%,transparent 23%),
    linear-gradient(115deg,color-mix(in srgb,var(--accent) 22%,transparent),
      color-mix(in srgb,var(--success) 18%,transparent) 57%,
      color-mix(in srgb,var(--indigo) 22%,transparent)),
    linear-gradient(145deg,#f4f5ee,#dfe3df);
  background-blend-mode:screen,color,normal;
  transition:transform 150ms var(--ease-out)}
.foil::after{content:"";position:absolute;inset:-40%;pointer-events:none;mix-blend-mode:overlay;
  background:conic-gradient(from 120deg at var(--mx) var(--my),transparent,rgba(255,255,255,.48),transparent 22%)}
.foil:hover{transform:perspective(700px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}
```

## R5 — Real 3D body: faces + per-face brightness (RTL-safe camera rig)
Target: the Vault, coin edge, receipt stack. Three wrappers: stage (camera) /
mirror (direction) / scene (parallax) — collapsing them makes RTL fight the tilt.
Both side walls share ONE brightness (overhead light law §2).
```css
.stage{perspective:900px;perspective-origin:50% 34%}
.mirror{transform-style:preserve-3d}
[dir="rtl"] .mirror{transform:scaleX(-1)}
.scene{transform-style:preserve-3d;transition:transform var(--motion-slow) var(--ease-out)}
.face{position:absolute;transform-style:preserve-3d;backface-visibility:hidden;
  background:var(--surface-2);border:1px solid var(--border);filter:brightness(var(--face-light,1))}
/* faces: back .86 · tab .94 · bottom 1.09 · sides .95 EACH · lid 1.05 */
@media (prefers-reduced-motion:reduce){.scene{transform:none!important}}
```

## R6 — Three-role shadow + hatched remainder
Target: every meter/target rail. The unfilled remainder is DATA (hard hatch),
never a soft gradient. Contact shadow animates with the object.
```css
.rail{background-color:var(--surface-2);
  background-image:repeating-linear-gradient(135deg,var(--border) 0 1px,transparent 1px 5px)}
.contact-shadow{position:absolute;border-radius:50%;background:var(--ink);
  transition:transform var(--motion-slow) var(--ease-out),opacity var(--motion-base) var(--ease-out)}
```

## R7 — State-bound edge light-leak
Target: "تمت التسوية" / vault-unlocked. Caller MUST pass the color = must name
the state. Permanent leak is banned (§12).
```css
.leak::after{content:"";position:absolute;inset-inline:12%;bottom:-7px;height:16px;
  border-radius:50%;background:var(--leak-color);filter:blur(13px);opacity:.5;pointer-events:none}
```

## R8 — Direction-aware fill (scales, never lays out)
Target: every bar/meter. A bar filling away from its label reads as draining in RTL.
```css
.fill{transform-origin:left center;will-change:transform}
[dir="rtl"] .fill{transform-origin:right center}
```

## R9 — Cinematic metal switch (carved groove + rim-lit cap + state glow)
Target: clay/metal switches (auto-backup, live mode, lossPolicy).
```css
.switch-track{width:76px;height:38px;padding:4px;border-radius:999px;background:var(--sunken);
  box-shadow:inset 0 4px 10px rgb(0 0 0/.35);transition:350ms var(--ease-out)}
.switch-knob{width:30px;height:30px;border-radius:50%;
  background:linear-gradient(145deg,#7b7f8b,#4f535d);
  box-shadow:inset 0 2px 2px rgb(255 255 255/.25),0 3px 9px rgb(0 0 0/.5);
  transition:450ms cubic-bezier(.2,1.5,.3,1)}
input:checked ~ .switch-track{background:color-mix(in srgb,var(--success) 30%,var(--sunken));
  box-shadow:inset 0 4px 10px rgb(0 0 0/.3),0 0 26px color-mix(in srgb,var(--success) 38%,transparent)}
input:checked ~ .switch-track .switch-knob{transform:translateX(-38px);
  background:linear-gradient(145deg,color-mix(in srgb,var(--success) 55%,white),var(--success))}
[dir="ltr"] input:checked ~ .switch-track .switch-knob{transform:translateX(38px)}
```

## R10 — Conic orb + desynced equalizer (Dynamic-Island notifier)
Target: live-sync orb, sale-recorded notifier. Negative `animation-delay`
desyncs bars free. Loops allowed in chrome/hero only (motion budget).
```css
.live-orb{width:34px;height:34px;border-radius:50%;
  background:conic-gradient(from 40deg,var(--accent),var(--success),var(--indigo),var(--accent));
  box-shadow:0 0 22px color-mix(in srgb,var(--accent) 45%,transparent);
  animation:slow-spin 7s linear infinite}
@keyframes slow-spin{to{transform:rotate(360deg)}}
.wave i{flex:1;max-width:4px;border-radius:8px;animation:wave .8s ease-in-out infinite alternate}
.wave i:nth-child(2n){animation-delay:-.3s}.wave i:nth-child(3n){animation-delay:-.55s}
```

## R11 — Organic blob + masked technical grid (hero field)
Target: hero mesh fields. 8-value border-radius slash = blob not circle; the
grid FADES OUT via mask instead of being cropped.
```css
.hero-grid{background-image:linear-gradient(rgb(255 255 255/.1) 1px,transparent 1px),
    linear-gradient(90deg,rgb(255 255 255/.1) 1px,transparent 1px);
  background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 85%)}
.hero-blob{width:480px;height:480px;border-radius:45% 55% 62% 38%/54% 42% 58% 46%;
  inset-inline-end:-220px;bottom:-260px;filter:blur(30px);opacity:.46;
  background:conic-gradient(from 40deg,var(--accent),var(--indigo),var(--blue-400),var(--accent));
  animation:slow-spin 18s linear infinite}
```

## R12 — Draw-on sparkline + same-hue area
Target: cashflow charts, rep cards. Mount-only (chart law). Area = same hue to
transparent, never a second color. Bars grow from `transform-origin:bottom`.
```css
.spark .line{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;
  stroke-dasharray:600;stroke-dashoffset:600;animation:draw 1.7s var(--ease-out) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
```

## R13 — Masked drum picker (RTL-safe selection lens)
Target: amount/month scrubbers. `inset-inline` lens behind the column; the mask
does the depth-of-field. No JS for the fade.
```css
.drum{height:210px;overflow:hidden;
  mask-image:linear-gradient(transparent,black 22%,black 78%,transparent)}
.drum-lens{position:absolute;inset-inline:15px;top:50%;height:42px;transform:translateY(-50%);
  border:1px solid var(--border);border-radius:13px;background:var(--surface-2)}
```

## R14 — RTL-correct shimmer skeleton
Target: all loading states. The sweep travels WITH reading direction.
```css
.shimmer::after{content:"";position:absolute;inset:0;transform:translateX(120%);
  background:linear-gradient(90deg,transparent,color-mix(in srgb,white 62%,transparent),transparent);
  animation:shimmer 1.6s infinite}
@keyframes shimmer{to{transform:translateX(-120%)}}
[dir="ltr"] .shimmer::after{transform:translateX(-120%);animation-name:shimmer-ltr}
@keyframes shimmer-ltr{to{transform:translateX(120%)}}
```

## R15 — Progress inside the action + particle seal + 3-line donut
Target: the settlement ritual ("الأثر": a control shows its result in itself,
not in a side toast). Shards = the celebratory stamp. Donut gauge without SVG.
```css
.act-btn::before{content:"";position:absolute;inset:0;width:var(--progress,0%);
  background:linear-gradient(90deg,var(--accent),var(--accent-strong));transition:width 200ms linear}
.act-btn span{position:relative;z-index:1}
.shard{position:absolute;left:50%;top:50%;width:18px;height:12px;
  background:linear-gradient(135deg,var(--accent),var(--success));
  animation:shard-fly .8s var(--ease-out) forwards}
@keyframes shard-fly{to{transform:translate(var(--x),var(--y)) rotate(var(--r)) scale(.15);opacity:0;filter:blur(2px)}}
.donut{background:conic-gradient(var(--success) var(--p),var(--border) 0);border-radius:50%}
.donut::before{content:"";position:absolute;inset:7px;border-radius:50%;background:var(--surface)}
```

## R16–R20 — from the client's visual feedback batch (2026-08-17)

The batch (matte 3D utility-icon renders, kWh meters with digit drums, a travel
journal built from clipped/stacked photo cards, floating pill docks) sets a
clear language: **objects are moulded shells, instruments are sunk into them,
collections are physical stacks, and attachments mark state.**

**R16 — Device shell** *(built: `.device` in materials.css)*
A moulded body, not a card: lit top face, both side rims shaded equally, a
shaded lower face, and a contact + cast shadow pair. Instruments are recessed
into it; nothing is printed on a flat plane.
Target: the profit instrument, settlement terminal, report covers.

**R17 — Digit drums** *(built: `.odo*` + `objects/odometer.tsx`)*
Each digit is a drum in a masked bay; the strip translates by `-digit × drumH`
with a 22ms cascade delay per place so the rightmost leads, exactly like a
utility counter. Separators and the currency mark are struck on the housing and
never spin. Reduced motion drops the transition, not the reading.
Target: net profit, rep balances, period totals.

**R18 — Recessed display window** *(built: `.display-window`)*
Dark bay + inner shadow + a single specular sweep for the glass + a state-bound
glow rising from below (green profit / red loss / none at break-even).
Target: every hero figure that reports a live state.

**R19 — Indicator lamp** *(built: `.lamp`)*
A moulded lens: specular highlight, body radial, inner shade, and a glow that
exists ONLY when there is something to report (§12). Grey and unlit at neutral.
Target: polarity, sync state, period open/closed.

**R20 — Clipped stacks** *(to build in D1/D3)*
Collections as physical stacks: cards rotated 2–5° (no two angles equal, §4),
white photo borders, a paperclip or stamp that appears only when the state
warrants it (`filed`, `closed`, `settled` — §8), memoji-style avatar circles
with white rings for people, and a floating pill dock for mobile navigation.
Target: products, closed periods (clipped + stamped), report archive, rep cards.

## R21–R30 — from the client's second visual-feedback batch (2026-08-17)

Batch read: dashboard cards with dials and coloured rails · a widget family shipped
in matched light AND dark pairs · a dithered halftone net-income card · gradient-faded
big digits · raised pill docks (soft-UI and liquid-glass) · modals with a gradient art
header · a dark tips card with faint line-art · an Arabic RTL dashboard with a
connected horizontal stepper and ring gauges · quick-action circles · slide-to-send ·
a gradient speed slider with a hatched "usual range" · sparkline tiles fused to list
rows · a 3D folder with documents peeking out for report downloads.

**R21 — Halftone hero** *(built: `.halftone`)*
A gradient whose noise is a visible 4px dot screen (`radial-gradient` dots at
`mix-blend-mode: overlay`, `soft-light` on dark). Reads as printed ink instead of
a CSS gradient and cannot band. Dark variant is a deep ink, not the light card
inverted. Target: month headline, landing hero, report covers.

**R22 — Capsule week** *(built: `.capsule-track/.capsule-fill` + `objects/week-bars.tsx`)*
Seven carved capsule tracks with a plunger at each day's level; an empty day still
shows its track because the remainder is part of the reading (§11). Capped narrower
than tall so capsules stay capsules on wide cards. Never animated — data being read.

**R23 — Ring dial** *(built: `objects/ring-gauge.tsx`)*
SVG dial: sunken track + a hatched remainder + a round-capped arc with a matched
drop shadow, figure struck in the middle. Direction-neutral, so RTL needs no rule.
Target: margin, target progress, rep achievement.

**R24 — Floating dock** *(built: `.dock/.dock-active` + `layout/mobile-dock.tsx`)*
A raised pill rail where the active destination sits in its OWN lifted capsule —
selection is a physical position, not a colour swap. The content column reserves
its height so no row is trapped underneath.

**R25 — Slide to commit** *(to build: periods)*
A committing action that requires a deliberate drag ("اسحب للإغلاق") with a
circular handle in a white rail. For irreversible money events — closing a period,
paying a settlement — where a tap is too cheap.

**R26 — Quick-action circles** *(to build: dashboard)*
Four soft-tinted circular tiles with a bare icon and a word beneath. Only for
actions that are genuinely daily; each tile's tint is its semantic (income green,
expense red, invoice accent).

**R27 — Sparkline row tile** *(to build: products, reps)*
A dark mini-tile fused to the leading edge of a list row carrying that item's
trend + its value. Turns a flat list into a scannable comparison.

**R28 — Range slider with a usual band** *(to build: pricing)*
A gradient rail with a hatched zone marking "your usual range" and an explicit
label when the handle passes it. Compares the current choice to the merchant's own
history instead of an abstract scale.

**R29 — Sheet with an art header** *(to build: dialogs)*
Modal = a gradient/halftone art strip + a white sheet + an inner bordered detail
card + one full-width dark CTA. Keeps confirmations calm and legible.

**R30 — Document folder object** *(to build: reports/export)*
An extruded folder with document sheets peeking out at unequal angles (§4), used
as the export affordance. The sheets only appear when there is something to export.

## R31–R34 — from the third visual-feedback batch (2026-08-17) — BUILT

**R31 — Moulded control** *(built: `.molded*` + `ui/button.tsx`)*
A pressable is a body: a lighter rim in a whiter mix of its own hue, a lit top edge
inside it, a shaded lower lip, a hard base line and a body-sized soft shadow.
Pressing travels the body down into that shadow instead of scaling it.

**R32 — Quiet fraction** *(built: `ui/money.tsx`)*
Split a formatted figure into whole / fraction / currency mark and set the last two
one step quieter, so a long price still reads at a glance.

**R33 — Badge on the fill edge** *(built: `.rail-badge` + dashboard rails)*
The share badge rides the fill's leading edge, positioned logically so it is correct
in both directions — the rail reports its own value with no legend.

**R34 — Marked reading** *(built: chart activeDot + dashed cursor)*
The hovered point becomes a filled disc with a surface-coloured collar and a dashed
line dropping to its axis: a measurement marked on paper, not a hover glow.

## R35–R39 — from the fourth visual-feedback batch (2026-08-17) — R35–R38 BUILT

Batch read: dark fintech dashboards carried by a single high-energy accent · a bar
chart with a **dashed threshold line ending in a value chip** · **tick-comb** category
charts (label + amount above a comb of hairlines) · a **segmented distribution bar
with a tick ruler and a legend** (50/30/20) · a **dot-matrix** magnitude chart · a
**pill filter row with exactly one filled chip** · circular black/accent actions and
dock FABs · **patterned bars with one solid active bar carrying its value** · an
outline-vs-filled icon pair language.

**R35 — Threshold line with a value chip** *(built: `ReferenceLine` + `ThresholdChip` in `charts/profit-area-chart.tsx`, fed by `settings.monthlyProfitTarget` with the window average as fallback)*
A dashed horizontal rule across the plot at a level that MEANS something (target,
break-even, average), ending in a small rounded chip carrying that level's figure.
The chip's tone reports the verdict — met or short — so the line is a sentence, not
a decoration. Never draw it at a round number chosen for looks.

**R36 — Distribution bar with a tick ruler** *(built: `objects/distribution-bar.tsx` + `.dist-*` / `.seg-*` + `--plate-N` tokens, on the dashboard as «وين راح المال»)*
One horizontal bar = one whole (a month's revenue). Segments are the parts, split by
hairline seams; a ruler under the bar drops a tick at each boundary with its share, and
a legend names each part with its amount. Parts are distinguished by **material
texture** (solid / dots / hatch), not by a hue per part — hue stays reserved for
meaning (the merchant's keep is `--success`; everything spent is graded neutral).

**R37 — One solid reading in a patterned set** *(built: `WeekBars activeIndex` + `.capsule-fill-quiet` + `.reading-chip`/`.reading-notch`)*
In a set of bars, the one being reported is solid and carries its figure above it;
the rest keep their hue but drop to a patterned fill and recede. Marking the reading
inside the chart removes the duplicate label from the card header.

**R38 — Pill filter row, one filled chip** *(built: `ui/segmented.tsx` active chip is now a moulded accent body; drives `computeDashboard({months})` on the dashboard)*
An inset track of pills where the active one is a filled accent body and the others
are text with a hit area. It must actually filter — a decorative range switch is
worse than no switch.

**R39 — Circular action with a raised primary** *(queued: the dock FAB — the dock already carries five keys at 360px, so this waits for the reps screen)*
Round actions in a row, all one neutral material except the primary, which is an
accent body raised above the rail. Round is for a single verb; anything needing two
words stays a pill.

## R40–R48 — from the fifth visual-feedback batch (2026-08-17)

Batch read: a light neumorphic wallet (masked account chip · balance with grey cents ·
one labelled green pill beside three icon-only graphite pills · activity rows where
**spend is neutral ink and only income is green** · a dock whose active key is a
rimmed capsule with a FILLED icon) · extruded pill studies showing the rim as a
lighter mix of the body's own hue · a report screen with a **tick-comb ruler band**,
**patterned stacked bars with avatars under them**, and tiny **delta chips with a
triangle** · a type-specimen card (overlapping surfaces + frosted sheet + hex
swatches) · a coral dashboard with a **black donut carrying one accent arc**,
**concentric magnitude rings**, a dot-matrix duration widget and removable filter
chips · a dock with a **black circular FAB** · Iconly's **outline/filled icon pairs**
and a dock that labels ONLY the active key · a bento wallet with **segmented
tick-comb meters**, a thin multi-colour distribution bar with a dot legend, and huge
figures whose currency sign is set small and leading · a currency-exchange card whose
**swap circle straddles the seam between the two rows**.

**R40 — Tick-comb meter** *(built: `objects/tick-meter.tsx` + `.comb-*`)*
A share drawn as a row of discrete ticks — filled ticks up to the value, carved empty
ticks for the rest. It quantises the reading (you can count it), and the remainder is
structural by construction (§11). Beats a smooth bar wherever the number matters more
than the sweep.

**R41 — Scale contrast inside one figure** *(built: `Stat` now renders through `Money`)*
One figure, three sizes: the whole part loud, the fraction quieter, the unit smallest.
The references set the currency sign at roughly half the numeral height. No figure in
the product is allowed to print its unit at full size again.

**R42 — Labelled primary + icon-only siblings** *(built: dashboard quick actions)*
An action row is ONE labelled primary in the accent material beside N icon-only
pills of the same height in neutral graphite. The icon-only siblings must carry
`aria-label` and a tooltip — an icon alone is a label only for the eye.

**R43 — Delta chip with a caret** *(built: `ui/delta.tsx`)*
A tiny pill on the soft tint of its own tone, a caret glyph, the percentage in mono.
Never a bare coloured number: the pill is what makes it scannable in a grid.

**R44 — Label only where you are** *(built: `layout/mobile-dock.tsx`)*
In a compact dock the active key shows a filled icon AND its label inside a raised
capsule; the others show an outline icon only, with the name still exposed to
assistive tech. Outline ⇄ filled is the state grammar — never two different icons.

**R45 — Raised circular primary at the dock's end** *(built: the dock FAB)*
The one verb worth a permanent button is a circle, larger than the rail's keys,
raised above it in the accent material. Round is for a single verb only.

**R46 — Swap straddling the seam** *(queued: settlements, P1)*
Two stacked inset rows (from / to) with a circular swap control centred on the seam
between them. The control belongs to the JOINT, which is why it reads as reversing
the pair rather than acting on one row.

**R47 — Concentric magnitude rings** *(queued: reports)*
Nested circles sized by √value so AREA carries the magnitude. Only legitimate when
the values genuinely contain one another (revenue ⊃ costs ⊃ profit); for a partition
use the distribution bar instead.

**R48 — The specimen surface** *(built: `/styleguide` instruments study)*
Every instrument shown at reading size beside what it measures and the law it obeys.
A design system that cannot be read on one page is folklore.

---
Also adopt from nova (not recipes but structure): glass tokens as a paired set
(`--glass/-strong/-edge/-edge-shade/-specular/-caustic`), material depth as a
separate axis (`data-glass="g1|g2|g3"`), theme packs may only override existing
token names, and `direction:ltr` forced on code/OTP-style LTR data islands.
