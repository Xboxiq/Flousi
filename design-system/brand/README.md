# RITM · نظام الهوية / Brand system

Eleven artboards, authored as Design Components (`.dc.html`) and published as a
canvas. Built on the five identity boards the client supplied: the DNA is theirs
(warm black, sand accent, «رِتم» over letterspaced RITM, a mark of stepped
capsules); what is added here is the system that makes it usable.

    https://claude.ai/code/artifact/618d58fa-d4bf-41b2-b0fd-8f65bd83f224

## The boards

| page | artboard | what it settles |
|---|---|---|
| الأساس | `Main` | cover, tagline, palette strip |
| | `Mark` | the symbol on a 24-unit grid, with its coordinate table, its four colour treatments and the app-icon rule (46% of the tile) |
| | `Wordmark` | primary and stacked lockups, clear space (X = one stroke height), minimum sizes |
| | `Misuse` | eight ways to break it |
| النظام | `Colour` | grounds, inks and semantics — every pair carries its **measured** ratio |
| | `Type` | Tajawal + Archivo, six steps, two hard rules |
| | `Rhythm` | the pattern's single generator, three sizes, and when it carries data |
| | `Icons` | 24 box / 20 live / stroke 1.75, and the sixteen the product needs |
| | `Motion` | beat 120ms, exit faster than enter, stagger 40ms, reduced-motion |
| التطبيق | `Product` | the app UI in brand colour, on ui-v7's structure and August's figures |
| | `Applications` | card, app icon, badge, phone, signage, cover, merch, signature |

## Three decisions taken from measurement, not taste

* **Sand `#C6A97D` fails on paper at 1.98:1.** On a light ground it is a fill
  that carries dark ink, never a text colour. This is the tightest constraint in
  the supplied palette and it was not visible in the boards.
* **Teal is dark-ground only** — 2.74:1 on paper.
* **`#6B7076` cannot carry text on either ground** (3.87 / 4.42). Raised to
  `#8A9199` on dark and `#5A6068` on light.

## Two stated assumptions

* The symbol is consolidated on the **stepped capsules** of boards 1–4 (the most
  repeated and most distinctive form). Board 5's vertical-bar variant is not built.
* The named faces — Tajawal Next and Neue Montreal — are commercial and the canvas
  can only load Google Fonts, so **Tajawal** and **Archivo** stand in as the
  nearest available. Swapping in the licensed cuts is a one-line change in each
  artboard's `<helmet>`.

## Re-seeding

The `.dc.html` files and `canvas.json` are the source. The published page and the
local previews are generated and are not committed. To update, edit an artboard
and re-seed a fresh copy of the payload with the `design` skill's helper, then
republish to the same URL.
