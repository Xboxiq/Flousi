# RITM — القانون البصري VISUAL LAW (v1)

> Ported and adapted 2026-08-17 from the client's own `Xboxiq/nova`
> (`design-system/VISUAL-LAW.md`) — first-party, fully licensed. This law is what
> turns "رسوم بمستوى الصور" from a wish into a build requirement. It binds every
> visual object in RITM. Enforced by design-law gates (see DESIGN-PLAN §process)
> and the anti-slop matrix.

## §1 الجسم قبل الشكل — Body before shape
Every visual element is an OBJECT: it has thickness, a light-catching edge, or an
overlap proving something is in front of something. A colored rectangle that
cannot say where its surface ends and its edge begins is filler, not design.
**The screenshot test:** a RITM visual object, cropped alone, should be
mistakable for a rendered image — not for "simple CSS".

## §2 الضوء من فوق — Light comes from directly overhead
Slightly toward the camera. NEVER lateral. Reason (non-negotiable in an RTL
product): any object mirrored by `scaleX(-1)` for direction would otherwise have
its physics flipped by a *language setting*. Per-face lighting is done with ONE
neutral material + `filter: brightness()` per face — never a second color system.
(This supersedes MASTER v4 §3 "top-start".)

## §3 ثلاثة ظلال لثلاث وظائف — Three shadows, three jobs
Contact shadow (pins the object to the ground) + cast shadow (tells height) +
ambient occlusion (seats it in the scene). One soft shadow alone = a sticker.
Contact shadows are ALIVE: they tighten as objects close/land, spread as they
open/lift.

## §4 الميل للمحتوى لا للحاوية — Angle belongs to content
Containers stay straight. Content inside may tilt — and no two tilt angles are
equal, none is zero (an equal or zero angle reads as a bug, not a choice).

## §5 التفصيل عند الحافة والمفصل — Detail lives at the edge and the joint
The center may be empty. Speculars, seams, lips, stitches — at edges. A real
glass edge needs TWO insets: bright top lip + dark bottom lip.

## §6+§9 الحاوية محايدة واللون من المحتوى — Neutral container, color from content
Test: remove all color but one spot — which spot deserves it? That spot gets it.

**§6a أكسنت واحد لكل ريل — one accent per rail (added 2026-08-17, batch 5):** when a
coloured PRIMARY and a coloured STATE sit on the same rail, neither points any more.
The dock proved it: an accent label for "you are here" beside an accent add-button
made two claims on the eye. Position and elevation say where you are — the raised,
rimmed capsule with a filled icon; the accent stays with the verb.

## §7 لا شيء يطفو وحده — Nothing floats alone
A composed scene has at least three objects on three depth planes (field / mid /
focal). One floating card on a flat page is a decal.

## §8 كل تفصيلة تحمل معلومة — Every detail carries information
Ask: what does this detail SAY? A paperclip always visible is ornament; a
paperclip that appears only when `filed && sheets > 0` is language. State-bound
detail is the entire difference between rich and noisy.

## §10 موازنة التكوين — Composition balance
No "خطوط وكلشي مو متوازن": every scene is composed on a deliberate visual axis;
weights (mass, color, motion) balance across it. If you can't name the axis and
the counterweight, the composition isn't done.

## §11 المتبقي بيانات — The unfilled remainder is data
The empty part of a meter/target arc is structural (hairline hatch or carved
groove), never a soft decorative gradient.

**§11a قواعد النقش — one grammar for texture (added 2026-08-17):** a texture is
vocabulary, so it may mean only one thing across the product.
`hatch (diagonal)` = **a remainder / an amount not covered** · `dots` = **a
reading that has been quieted** (present, but not the one being reported) ·
`grid / dense hatch` = **a named part inside a whole** (the distribution bar's
plates). Never use the diagonal hatch to decorate a filled value, and never use a
hue where a texture is what distinguishes two things of the same kind.

**§11b الكل يساوي كلّه — a part-to-whole object must sum to its own whole:** if a
bar says "this is the month", the parts drawn inside it add to 100% of that month.
An excess (costs past revenue) is drawn as a **region across the parts it
swallowed**, with a scribe line where the money ran out — never as an extra
segment appended to the bar, which silently pushes the composition past its own
frame and clips the truth.

## §12 توهج الحافة يحتاج موقعاً وحالة — Edge leaks need position + state
A light-leak/glow must name the state it reports ("تمت التسوية", "الهدف تحقق")
and where it leaks from. A permanent glow is atmospheric wash in disguise.

## §13 اللون شيفرة لا زينة — Color tied to stable categories is code
Color for a stable meaning (profit/loss/action) is code; color for variety is
decor and gets removed.

## §14 مصالحة anti-slop-ui — Reconciliation with the client-supplied skill

The client supplied `anti-slop-ui` (30 banned patterns) on 2026-08-18. Twenty-two of
its rules we already keep, and several of them we keep more strictly than it asks.
Eight of them we **deliberately break**, and the reason is the same in all eight
cases: the skill is written for a flat, bordered, technical-document aesthetic, and
it bans the *symptom* (a shadow, a radius, a gradient) rather than the fault (depth
that reports nothing). RITM's brief was the opposite and was stated twice:
«يهتم بالتفاصيل والأشكال ثلاثية الأبعاد» and
«تكون كأنها صور أو تكوينات احترافية … مو خطوط وكلشي مو متوازن». A 1px
border on a flat panel is exactly the drawing he rejected.

So each break is bound to the clause that governs it instead. A break with no clause
holding it is not a break, it is slop — and any new one has to be added to this table
before it ships.

| قاعدة المهارة | ما نفعله | البند الأصرم الذي يحكمه بدلاً منها |
|---|---|---|
| #7 لا `box-shadow` | طبقة مواد كاملة (`.clay` `.molded` `.slab`) | **§2 + §3**: الضوء من فوق حصراً، وكل جسم له ثلاثة ظلال لكل واحد وظيفة (ملامسة، مطروح، حواف). الممنوع عندنا هو الظل الطافي الملوّن — وهو نفس ما تمنعه المهارة، لكننا نمنعه بسببه لا باسمه |
| #8 لا زجاج | `.glass` على سطح واحد: نتيجة الحاسبة | **§6**: الزجاج ليس مادة زينة بل طبقة واحدة فوق العمل تقول «هذا الرقم محسوب ممّا تحته». مرة واحدة في التطبيق كله؛ ممنوع على البطاقات والأشرطة |
| #9 نصف قطر ≤ 6px | 18px للمفاتيح، 30px للألواح، وكبسولات للمرشّحات | **§1**: الجسم قبل الشكل. قطعة مسبوكة لها نصف قطر القالب؛ زاوية 4px على جسم مجسّم تقرأ كمستطيل مرسوم لا كقطعة. والكبسولة تحمل معنى: المرشّح ينزلق، واللوح لا |
| #1 لا تدرجات | تدرجات دقيقة داخل الأجسام والأقراص | **§2**: التدرج ليس لوناً، بل وجه يميل تحت ضوء علوي. الممنوع هو تدرج متعدد الألوان يمتد خلف المحتوى — واللاندينغ في هذه الدفعة فقد ما كان منه |
| #11 لا كرات ضوء | `.scene-spot` مسرح واحد تحت جسم قائم | **§2 + §7**: بقعة المسرح لها موقع (تحت الجسم مباشرة) وتربطه بالأرض. كرة في زاوية فارغة مصدر ضوء بلا موقع — وقد أُزيلت من اللاندينغ في G3 |
| #12 لا شبكات نقاط | نقاط وتحزيز في الأجزاء | **§11a**: للملمس قواعد معنى محددة — التحزيز تجاوز، والنقاط قراءة مُسكتة. ملمس بلا معنى يسقط بـ§8، وملمس خلفية زخرفي ممنوع مثلما تمنعه المهارة |
| #14 لا شبكة bento | مركز التقارير مشبّك | **§10**: ممنوع ما تمنعه المهارة فعلاً: بطاقات متنافرة بمقاييس عشوائية. مركز التقارير مجموعة من أجسام متماثلة تفتح الملف نفسه؛ واللاندينغ خرج من الـbento في G7 |
| #21 لا رفع عند المرور | مرور يغيّر اللون والحافة فقط | **متفقان** — أُزيل `bento-hover` و`hover:scale` في G8. يبقى المال مغنطة (`Magnetic`) داخل زر واحد لأنها تتبع المؤشر لا ترفع البطاقة |

وما التزمنا به من المهارة دون تحفّظ: لا Lucide (Phosphor)، لا Inter/Geist/Space Grotesk
(Cairo + IBM Plex Mono)، لا إيموجي، لا بريق ذكاء اصطناعي، لا شهادات ملفقة، لا طرفية مزيفة،
لا ثلاث باقات أسعار، لا ألوان نيون ولا باستيل، لا بنفسجي على أسود، لا شريط جانبي ملوّن،
لا أسهم متحركة، وهياكل تحميل موجودة لكل شاشة تقرأ من المخزن.

## §15 سقف الهدوء — The quiet ceiling

حكم العميل بعد P10: «التصميم تحسه صعب ومعقد جدا». والقياس وافقه: 124 رقماً في حالة
السكون على شاشة واحدة، و31 على ورشة القسمة، وفقرات قائمة حيث يكفي سطر. كل إضافة كانت
مبرَّرة وحدها، ولم توزن ولا مرة في مقابل المجموع.

الدواء الذي اختاره هو، بنصّه: «هدوء صارم بسقف لكل شاشة». وشرطه هو أيضاً بنصّه:
«لا تُفقد ميزة».

**البنود:**

1. **سقف لكل شاشة، يُقاس في حالة السكون** — قبل فتح أي إفصاح — ويُنفَّذ بسكربت لا بنيّة:
   `npm run sweep:density`. أرقام في منطقة الملخّص ≤ 8، أرقام في سطر واحد ≤ 4، شارات في
   سطر واحد ≤ 2، أجسام قياس في الملخّص ≤ 1، جُمَل نثر ≤ 12، وأطول كتلة نثر واحدة ≤ 3.
2. **ما يتجاوز السقف لا يُحذف، بل يُنقل** خلف إفصاح موجود أصلاً: درجة في السلّم، لوح
   داخل سطر، أو حوار. الميزة المحذوفة إسقاط للبوابة لا اجتياز لها.
3. **حقيقة واحدة في مكان واحد.** العدد المطبوع في الترويسة والمذكور في اللاتش نفسه رقم
   يُطلب من القارئ أن يوفّق بينهما. النسبة التي يضبطها الحقل لا تُطبع في شارة فوقه.
4. **النسبة المشتقّة ليست قراءة.** `pace` = الإنجاز ÷ ما مضى: رقم ثالث مستخرج من رقمين
   على الشاشة، ولا أحد يتصرّف به. يبقى حكمه بالكلمات («في الوتيرة» / «متأخّر») ويسقط رقمه.
5. **العدّاد الذي لا يعدّ شيئاً ضجيج.** «ظهر 7 من 7» تحت ترويسة تقول «طلبيات: 7» يظهر
   الآن فقط عندما يكون هناك فعلاً ما هو محجوب.
6. **«ماتريد شي تقليدي» لم تكن يوماً «ماتريد شي هادئ».** القاعدة الثابتة تمنع المنسوخ
   والمجوّف، ولم تطلب الكثافة قط. الشاشة التي تجيب سؤالها الواحد بنظرة واحدة هي أقل شيء
   تقليدي يمكن لهذا التطبيق أن يفعله.
7. **أرقام الميزانية مقيسة لا مُدّعاة.** كل معايرة مكتوبة في `sweep-density.mjs` مع
   سببها، وأربع منها كانت تصحيحاً للمقياس نفسه لا للواجهة: العدّاد كان يقرأ أسطوانات
   الأودومتر المخفية، ويعدّ «د.ع.» جملتين، ويبتلع النقاط عند حدود العناصر، ويقيس نثر
   الأسطر مع نثر الملخّص. **مقياس يجمّل الشاشة أسوأ من لا مقياس.**

**ما نُقل، وإلى أين** (P11، لا ميزة مفقودة):

| الشاشة | ما كان قائماً | صار خلف |
|---|---|---|
| `/orders` | لوح التوصيل مفتوحاً بجانب الصندوق (18 رقماً في ملخّص يجيب سؤالاً واحداً) | درجة «التوصيل: مقبوض مقابل مدفوع»، ولاتشها يطبع الهامش |
| `/reps` | «قسمة الأرباح» مفتوحة بجانب الرصيد | درجة واحدة، ولاتشها يطبع الحصة |
| `/settlements` | ثلاثة أرقام لكل عملة فوق أربعة أسطر | درجة «المستحق والمدفوع»، ولاتشها يطبع المتبقّي |
| `/periods` | جدول ربح كل منتج (ست أعمدة) مفتوحاً تحت أرقام الشهر | درجة «الربح حسب المنتج»، بكل أعمدتها |
| `/access` | فقرة من خمس جمل تشرح أن الأدوار ليست حسابات دخول | الدعوى نفسها صارت عنوان اللاتش، والتفسير كامل خلفه حرفاً بحرف |
| `/reps/schemes` | عمود السعر، الوحدة المتبقّية، سياستا الخسارة، آخر عملية، والاستثناءات — كلها مفتوحة | سلّم من خمس درجات تحت منصّة العمل |
| `/targets` | شارة نسبة + مسطرة + حكم بالكلمات في كل سطر | المسطرة والحكم فقط؛ الشارة كانت الطبعة الثالثة |

## §16 اللغات البديلة — Alternative languages, and how a conflict is settled

The shipped app (`src/`) speaks **v4**, and every clause above governs it. Two
further languages exist as complete, rendered explorations, and neither is
allowed to leak into `src/` clause by clause:

| | | |
|---|---|---|
| **v5** | `design-system/ui-v5/` | «آلة تحريرية» · rules and space; 2px radius + one pill; ink on paper with one reserved blue |
| **v6** | `design-system/ui-v6/` | «مساحات» · area is the only encoding; **radius 0 everywhere**, one 16px chamfer meaning «touchable»; no drawn line at all, only 4px of gypsum grout; glaze = identity for life, ink = verdict |

**The rule for conflicts.** v6 forbids outright three things v4 uses on every
screen: any radius, any drawn hairline, and any card. That is not a violation of
this document, because v6 is a *different* language, not a proposal to relax v4.
The moment any part of v6 is lifted into `src/`, the clause it contradicts is
resolved here in writing, in this table, with the reason and the date. Nothing is
resolved silently in either direction.

**v6.1 adds a third, and a script that enforces all of them.** `design-system/
ui-v6/audit.mjs` runs seven checks — four on the files, three on the rendered DOM
in Chromium — and fails the build on any of: a literal `font-size`, an off-lattice
geometric value, a rule setting both `direction` and `inset-inline-*`, a text node
under WCAG AA against its painted ground, a field over 240px tall with no foot, a
clipped text or painted box, or two text boxes overlapping by more than 3px. It
was written because six inks at 2.49–4.28:1 and an entire footer pushed off the
plane survived four passes of looking at the screens.

**Three engineering laws v6 discovered, which bind every language here:**

1. `inset-inline-start/end` resolve against the **element's own** `direction`. An
   absolutely positioned mono stamp that sets `direction:ltr` on itself has its
   inline axis flipped, so `inset-inline-end` lands on the reading edge. A run of
   digits and a per cent sign needs no `direction` override at all: it is ET/EN
   under bidi and reorders correctly on its own. Drop the override, keep the
   logical property.
2. A light-ground surface placed on a dark screen must **declare its own ink**. A
   limestone field inheriting a kiln page's light ink is unreadable, and this
   failed on ten surfaces across two screens before it was seen.
3. A secondary ink is **never an alpha of the primary**. `rgba(ink, 0.40)` is a
   dimmer, not a colour: on limestone it measures 2.49:1. Every secondary and
   tertiary ink is a solid value chosen against its ground, and its ratio is
   written next to it in the token block. An overlay that carries text must own
   its background too, or its contrast becomes a property of what it sits over.

## §17 v7 «من المرجع» — the reference-built language, and its two conflicts

The client's note on v6 was **«اعتمد على رفرنس والتفكير ك مصمم مو ك رسام»**. It was
correct: v6 invented a private visual vocabulary and called it product design.
`design-system/ui-v7/` has no invented vocabulary. Its style, metrics, palette,
typeface, component set, table rules, form rules and chart choices each cite the
row of `ui-ux-pro-max` data they came from; the README lists them one by one.

**Only three things in v7 are original, and each is named there:** the split bar,
one stable hue per rep, and the «مجمَّد» marker on frozen prices and rules. Each
exists because the product genuinely differs from a generic dashboard, and each is
assembled from standard parts.

**Two conflicts with the shipped app, recorded rather than settled silently:**

| | v4 (shipped) | v7 (exploration) | why |
|---|---|---|---|
| icons | Phosphor, one weight per surface | **Lucide** | shadcn's own icon set is Lucide, and v7's whole point is to follow its reference stack rather than mix vocabularies. If any v7 component is lifted into `src/`, its icons are redrawn in Phosphor at that moment. |
| card ground | never pure `#fff` | **`#FFFFFF` on an off-white `#F8FAFC` page** | `colors.csv #42` prescribes exactly this pair, and the gate's ban is on pure-white **page** backgrounds. The page here is not white. |

**What the anti-slop gate changed in v7**, before it shipped: the ghost card (a
hairline border and a shadow on the same element) became border-only elevation;
the default semantic rainbow became a neutral chip with a coloured dot, with a
tint reserved for the two states that want a decision; four KPI cards nested
inside a card became a figure row on hairlines; and one em dash left the copy.

**A fourth engineering law, from v7:** a report that disagrees with its own chart
is the worst defect a money product can ship. v7's rep table summed to 1,437,670
while the split bar above it said 769,420. Every figure now derives from one set
(736,000×45% + 996,000×30% + 116×1,200 = 769,200, the exact rep slice of
5,164,500), and `audit.mjs` is the standing check on everything else.

## ميزانية الحركة (من nova — تحمي السينمائية من أكل المقروئية)
- Max **two simultaneously animating elements** on a product/data surface.
- Max **one** endless loop per page; **zero** infinite animation on a product
  component (loops live in heroes/marketing only).
- One focal material effect per surface.
- Every directional animation ships its `[dir="ltr"]` counter-rule.

## سجل الرفض — The rejection log
What we refuse from moodboards gets recorded here with the reason. A reference
appearing twice is not an argument for accepting it.
| مرفوض | السبب |
|---|---|
| **كرة زرقاء منقوش عليها «د.ع» (عملة D0 الأولى)** | **رفض العميل 2026-08-17: «من أسوأ الأشكال». الحكم صحيح — كرة + نص ليست جسماً؛ لم تُستمد من المراجع ولا من الفكرة، ولا تحمل أي معلومة (يسقط §1 و§8). استُبدلت بعمود السعر: الجسم صار هو الحساب نفسه، وارتفاع كل صفيحة حصتها الحقيقية.** |
| أي جسم يحمل نصاً منقوشاً بدل بيانات | النقش زخرفة؛ الجسم يجب أن يقيس شيئاً |
| كيكر مونوسبيس بحروف كبيرة ومتباعدة فوق العنوان (من تغذية 2026-08-17) | جميل في مرجعه، لكنه يخالف قانوننا: لا عناوين فرعية فوق العناوين، والمونو للأرقام والكود فقط. رُفض صراحةً لا صمتاً. |
| أرقام مال بخط رقيق عريض (من بطاقة البنك الخضراء) | الأرقام مقفولة على المونو الجدولي للمسح السريع؛ الخط الرقيق مسموح في أسطح التسويق فقط |
| Flat corporate illustration | بلا جسم ولا ضوء — يسقط §1 |
| Pastel per-icon tiles | لون بلا معنى — يسقط §13 |
| Side-lit objects | تنقلب فيزياؤها بالمرآة RTL — يسقط §2 |
| **«الصرف حبر عادي والإيراد فقط ملوّن» (من محفظة استهلاكية، تغذية 5)** | صحيح في محفظة شخصية حيث الصرف طبيعي؛ رِتم موجود ليقول إن هذه البيعة **خسرت**، فالربح السالب يبقى بالأحمر. الدرس المأخوذ: ليس كل سالب يستحق اللون — الكميات والتكاليف حبر محايد، والقطبية للربح وحده |
| صبغ الألواح بألوان باستيل حسب الدور (نعناعي/بنفشي/مرجاني) | نأخذ فكرة أن اللوح قد يُصبغ بدوره، لا الأصباغ نفسها؛ ألوانها ليست ألواننا |
| **استيراد لوحة «lime على أسود» من تغذية 2026-08-17** | المراجع الأربعة داكنة بلون واحد حاد. الدرس الحقيقي هو **التوزيع**: أرضية هادئة ولون واحد فقط مسموح له أن يشير — وهذا قانوننا أصلاً (§6 §13). أُخذ الدرس وطُبّق على أكسنت RITM؛ استيراد الـ hue نفسه مرفوض. |
| مخطط النقاط (dot-matrix) لمقارنة مبالغ | شبكة نقاط أسوأ قراءةً من قضيب لسؤال «أي منتج ربح أكثر»؛ مؤجّل لشاشة المندوبين حيث الوحدة شخص لا مبلغ |
| شريط أجزاء يزيد مجموعه على كلّه (التجاوز كقطعة مضافة) | ضُبط في هذه الدفعة: كان الشريط يتجاوز 100% فيُقصّ من طرفه؛ صار التجاوز منطقةً محزّزة فوق الأجزاء التي أكلها (§11b) |
| Purple/violet hues from nova's legacy HTML | يخالف بوابة السلوب؛ نأخذ التقنية ونعيد ربط الألوان بتوكنات RITM |


---

## §18 · نظام رِتم / THE RITM DESIGN SYSTEM

`design-system/ritm/` is the product layer of the identity in `design-system/brand/`.
The brand is the source and is not re-opened here; what was added is the answer a
brand manual cannot give — what each colour, size and duration MEANS in a product.

Published: https://claude.ai/code/artifact/c205bf8a-7a37-4a45-a2ba-ab09b7918dd0

### The two clauses this phase adds

**18.1 · A palette that works on one ground is half a palette.** The identity was
settled on ink. Moving it to paper needed a token the dark mode does not have:
sand is `1.98:1` on paper, so `--accent` (a fill) and `--accent-ink` `#7C6036`
(a word) are two different tokens and are never interchangeable. The general rule:
when a mode needs a value the other does not, that is a NEW TOKEN, never the same
token quietly reassigned.

**18.2 · A rule that cannot be run is a wish.** Every rule in this document that
governs `ritm/` is executable in `ritm/audit.mjs`: contrast for 37 pairs in both
modes, the plane, the ten-step scale, the 4px lattice, the ghost card, Arabic in a
Latin face, and unisolated LTR runs. Two of its checks are FAILING controls — sand
and teal as text on paper must stay below AA. A check that can only pass cannot
catch a regression that loosens a threshold.

### Recorded conflicts

* **The brand's six display steps vs a product's density.** The manual sets 116 /
  56 / 38 / 22 / 16 / 13. A table row and an axis tick live below that floor. The
  product ramp keeps five of the six as members (13, 16, 22, 38, 56) and adds the
  five the manual has no reason to name (10, 11, 12, 14, 28). Resolved in favour of
  the product, and `brand/Type.dc.html` now says «ستّ درجات للهوية» rather than
  «لا سابعة».
* **Teal is «the live signal, dark only» and is also this manual's annotation
  colour.** Both are true; the Colour board now says so, and teal is not a general
  fill anywhere in the product.
* **A white card on an off-white page** (recorded in §17) stands: light mode is
  `#FFFFFF` on `#F2F1EE`, because the brand's light ground is warm and a card that
  is not lighter than it has no elevation at all.
