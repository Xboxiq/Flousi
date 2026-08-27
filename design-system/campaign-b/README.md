# Flousi — STYLE B: «نحاس ودُخان» / Brass & Smoke

Five 16:9 key visuals, 3840×2160. A **second art direction** for the same brand,
not a variation of the first. Same pipeline as `../campaign` (authored HTML/CSS/SVG,
photographed by Chromium at 2×, the app's real Cairo and IBM Plex Mono).

    (cd design-system/campaign-b && python3 -m http.server 8370 &)
    node design-system/campaign-b/render.mjs        # all five
    node design-system/campaign-b/render.mjs b3     # just one

## What stays, so it is still Flousi

The wordmark, unaltered · Cairo for display with IBM Plex Mono 500 for every
figure, latn numerals · the object vocabulary (the till, the price column's
plates, the pace rail, the ladder pin) · one light source, always from above ·
one measured thing per frame carrying the colour code.

## What changed, so it is a new campaign

| | Style A — «عاجي وكروم» | Style B — «نحاس ودُخان» |
|---|---|---|
| Material | matte ceramic, chrome, brushed steel. Every body **opaque** | **brass and smoked glass.** Bodies are translucent, so light passes through them |
| Light | cool daylight lighting FACES | warm amber raking from above and behind, lighting **edges** — undersides go dark |
| New physics | contact and cast shadows | **caustics**: a translucent body throws warm light through itself onto the stock (B1), and the print behind glass shifts and cools (B1, B5) |
| Palette | bone, cool grey, warm ceramic, near-black, steel | obsidian, coal, paper, sand, brass, amber |
| The accent | brand blue used once per frame as the measured mark | the brand blue survives as a single **cold spark** per frame, one small dot against all that warmth |
| Display type | flat ink | **foil**: brass, debossed into the stock, with a lit top arris |
| Personality | a workshop bench at noon | a vault at night: fewer objects, deeper ground, more silence |

## The five frames

| | Direction | Camera | Ground | Type | Dominant |
|---|---|---|---|---|---|
| **B1** | foil poster | flat-on | paper stock with fibre | two lines of brass foil at 206px, upper right, on a debossed rule | paper / brass |
| **B2** | bodies overhead | **from underneath, looking up** | obsidian, no floor and no horizon | headline in the upper right void, the reading low left | obsidian / amber edge |
| **B3** | the join, macro | close and low, the join on a diagonal | warm black room, shallow DOF | no headline: one reading and one line | brass / smoke |
| **B4** | the vault | looking down into a black room | one amber pool on a polished floor, with a reflection | small and high, plus one 172px mono figure low right | black / amber |
| **B5** | the numeral | flat-on, deliberately wrong scale | sand, the lightest ground here | **the figure IS the object**, in foil at 296px, with a glass bar laid across it | sand / brass |

Nothing is shared between the five: not the camera, not the ground, not the type
placement, not the balance. B2's camera (from below) and B5's hero (a figure as
the object) exist in neither style before this.

## Notes from the render pass

* **B1** — the amber plate read as beige plastic until something was put BEHIND it.
  Glass is only glass when you can see through it: the stock now carries a printed
  rule and a printed figure that pass under the plate and shift, warm and soften
  inside it. The headline also had to be SET, not left to reflow: on one line the
  phrase needed 1,900px and the browser chose the shape.
* **B2** — the first cut pushed the whole world into the bottom third and left a
  brown haze above it, and the headline printed over the pane. The bodies belong
  in the middle band, the type in the upper void, and the amber spill is a tight
  pool behind the glass rather than a cloud. The copy also lost its tanween: at
  132px a floating «ً» reads as a detached artefact.
* **B4** and **B5** — both cropped a money figure so hard it could be misread
  («1,949,500» for «4,949,500»; a half-cut final zero). A money brand does not
  print an ambiguous amount for the sake of a bleed. Both figures are now whole,
  and the interruption comes from the glass instead.
* **B5** — the glass bar floated above the numeral on empty stock, so it read as a
  grey rectangle and the refraction never happened. It lies across the digits now.
