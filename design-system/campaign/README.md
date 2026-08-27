# Flousi — campaign series 01–08

Eight 16:9 key visuals, 3840×2160. One brand, eight art directions.

**They are not generated images.** Every frame is authored HTML/CSS/SVG and
photographed by Chromium at a 2× pixel ratio, which is why the type is the app's
own Cairo (lifted from the production build, `fonts/`), the blue is the app's own
`--accent: #0a6cff`, and every highlight, contact shadow and specular sits where
it was put rather than where a diffusion model guessed. Re-render any frame after
editing it and the change is exact.

    npm run build                                   # only if the fonts need refreshing
    (cd design-system/campaign && python3 -m http.server 8360 &)
    node design-system/campaign/render.mjs          # all eight
    node design-system/campaign/render.mjs 03       # just one

Output: `renders/*.png` (4K, lossless) and `renders/*.jpg` (4K, q93 — the sharing copy).

## The system that holds across all eight

| | |
|---|---|
| Wordmark | the app's mark, unaltered: accent tile + growth glyph + Flousi in Cairo 700, tight tracking. Scaled by `--wm`, never redrawn |
| Type | Cairo for display and copy, IBM Plex Mono 500 for every figure. **Two weights per frame, never three.** Figures always latn numerals |
| Light | one source, always from **above** (VISUAL-LAW §2). A raking side light would invert the physics of every object the moment the layout mirrors for RTL |
| Material | matte ceramic bodies · at most one chrome part per frame · glass once in the set · brushed steel once. Three shadows per body: contact, cast, edge (§3) |
| Objects | only Flousi's own instruments — the price column's plate stack, the till with its bays and catch, the pace rail with its hatched remainder, the ring gauge, the ladder rail with milled pins, the segmented pill. No generic UI cards, no fake app screens |
| Colour | accent is a **code, not decoration** (§13): it marks the one measured thing, once per frame, and never fills a background. Red appears exactly once in the whole set (frame 05's hot pin) |
| Grounds | eight frames, eight grounds, none reused: bone · cool grey · warm ceramic · near-black · steel · deep ink blue · warm olive · a hard bone/black seam |

## What makes each frame a different photograph, not a variant

| | Direction | Camera | Ground | Type | Dominant |
|---|---|---|---|---|---|
| **01** | type-led poster | flat-on, no perspective | bone, flat + grain | headline 248px bleeding off the reading edge, upper right | bone / ink |
| **02** | floating objects | elevated ¾, real CSS perspective | cool grey floor with a horizon | small, at the edges only; one line rotated 90° | cool grey / chrome |
| **03** | product macro | close and low, 34°, four-edge crop, shallow DOF | warm ceramic, blurred at the far end | no headline at all: one figure, one label pair | warm white / chrome |
| **04** | dark cinematic | eye level, standing back | near-black room, polished floor, one pool of light | headline low left, cropped by the bottom edge | black / accent glow |
| **05** | experimental editorial | flat-on, composition rotated, scale deliberately wrong | steel plate | no display headline: a narrow measure bottom-left | steel grey / one red |
| **06** | plan view / parts sheet | straight down, 90°, no horizon at all | deep ink blue deck + a measure rule | no headline: mono captions on one baseline, the index set at 460px in the corner | ink blue / bone parts |
| **07** | extreme wide | standing well back; the object is 11% of the frame width | warm olive floor with a far wall | one line along the TOP edge, and a drawn callout to the object | warm olive / one accent dot |
| **08** | the split | straight-on elevation, the part drawn as in an assembly view | a hard vertical seam: bone against near-black, no blend | the headline crosses the seam and changes ink where it does | 50/50 bone and black |

Nothing is shared between frames: not the headline position, not the camera, not
the background construction, not the object placement, not the balance. 03 and 07
deliberately shoot the SAME object at opposite ends of the lens, which is the one
relationship in the set that is meant to be noticed.

## Notes from the render pass

Each of these was a defect the eye caught and the code did not:

* **01** — Arabic needs leading Latin does not. At `line-height: 0.83` the ج of
  «الربح» sat inside the ق below it and the ي dots broke off as loose blue
  squares. 1.16 is the tightest setting that still reads as two words.
* **02** — the extrusion walls hinged the wrong way (`rotateX(-90deg)`), so every
  slab rendered with its own side detached below it. And the first shadow pass was
  too faint to ground anything: a floating object without a shadow is a sticker.
* **03** — the first cut sat at 64° and flattened the whole till into a white band
  with no form. A macro needs value range (a bright rim, a genuinely dark cavity)
  and one subject, not just texture; the second cut was then cropped so close that
  neither the catch nor the money in the bay was visible.
* **04** — the figure and its unit overflowed the glass onto the floor, and inside
  the LTR figure row the abbreviation «د.ع.» reordered into «.ع.د». The slab also
  needed a bevel: thickness is what keeps it from reading as a UI card.
* **05** — at 1560px the shared brushed pattern averaged into flat grey, so the
  letter stopped being metal; and each pin's label printed inside the pin's own
  body, white on white.
* **06** — a plan view has no visible walls, so without a machined edge, drilled
  seats and a milled slot the parts were just rounded rectangles: the generic card
  this system exists to refuse. The captions also stepped up and down with each
  part's height until they were pinned to one baseline.
* **07** — the leader line was a rotated div, which meant guesswork: it ran through
  its own label and the accent dot landed at the wrong end. Redrawn in SVG with two
  exact coordinates. The till also read as an empty tray until the money went back
  into the near bay.
* **08** — the inks were inverted. The dark-ink caption was positioned from the
  right edge, which on this frame is the black half, so both captions and both
  marks rendered as ghosts. The rule is now mechanical: `left` sits on bone and
  takes ink, `right` sits on black and takes white.
