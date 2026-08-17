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

---
Also adopt from nova (not recipes but structure): glass tokens as a paired set
(`--glass/-strong/-edge/-edge-shade/-specular/-caustic`), material depth as a
separate axis (`data-glass="g1|g2|g3"`), theme packs may only override existing
token names, and `direction:ltr` forced on code/OTP-style LTR data islands.
