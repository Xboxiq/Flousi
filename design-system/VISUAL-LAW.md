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


---

## §19 · المصدر الأصلي / THE SOURCE ARRIVED LATE

The client supplied the original artwork after the identity boards and the whole design
system had been built. The symbol in it is **four vertical bars**, not the stepped
horizontal capsules everything had been built on. `brand/README.md` had recorded that
choice as a stated assumption; the assumption was wrong.

### 19.1 · A stated assumption is a debt, and it comes due

Writing «الرمز مُوحَّد على الكبسولات المتدرّجة… ونسخة الأشرطة الرأسية غير مبنيّة» was the
right thing to do — it is what made this reversible. But an assumption about the SOURCE
is not the same as an assumption about a detail: it sits under everything above it. The
rule that follows: when an assumption concerns the identity itself, stop and ask for the
artwork before building on it. Thirty-six marks, six colour tokens, eleven boards and a
grid law were rebuilt because that question was not asked.

### 19.2 · A derivation is only as good as the thing it derives from

The rhythm grid's four legal spans (2, 4, 6, 8) were read off the old mark's four capsule
WIDTHS. The real mark's bars are all one width, so that derivation did not survive: the
spans are now 3, 6, 9, 12 — four equal columns — and the distinctive law moved to the
vertical, where the real mark actually varies. The lesson is not "do not derive"; it is
that a derivation must name what it derives from, so that when the source changes you
can see immediately what falls with it.

### 19.3 · What the source does not say, say yourself, out loud

The identity board prints six colours and no light ground, and no profit or red. A
product that judges money needs both. Those are extensions, and every one of them is
commented as such in `ritm/tokens.css` rather than blended in as though the client had
chosen it. The same clause as §18.1, arrived at from the other direction: where a role
needs a value the source does not provide, that is a NEW token — and it says whose it is.


---

## §20 · بوابة مكافحة الرداءة / WHAT THE GATE FOUND

`ritm-anti-slop-gate` run over every rebuilt surface. Evidence in
`gates/phase-ritm-anti-slop-gate.md`. Three clauses come out of it.

### 20.1 · A label over a heading is decoration; a label over a list is a heading

The scanner flags every small letterspaced label as a kicker. It is right about half
of them and wrong about the other half, and the difference is what sits underneath:

* over a HEADING, restating it — decoration. `01 · COLOUR SYSTEM` above «اللون له دور»
  and `NEEDS YOU` above «ثلاثة تحصيلات تأخّرت» were both deleted.
* over a LIST or a panel, being its only label — a heading. Those stay.

The rule that follows: never let an eyebrow and a heading say the same thing. If the
eyebrow is doing work, it is the heading and the heading is redundant.

### 20.2 · A label the merchant reads is Arabic

The dashboard's own navigation was labelling its groups `TODAY / MONEY / REVIEW`.
Nobody noticed for a whole build, because the reviewer reads English. Any string that
reaches a user is Arabic; Latin is for token names, figures and this manual's own
stamps. A bilingual label that says the same thing twice is one label too many.

### 20.3 · A responsive rule that is only drawn is a wish

`d9-responsive` describes what happens at 360. It described it correctly and proved
nothing. The first honest attempt to measure it failed twice: once because the check
was pointed at a fixed 1440 artboard (a frame at 390 measures the frame), and once on
a real defect — crumb links 20px tall, under the 24 minimum. `p5-mobile` now exists so
that the media queries actually run and the audit can measure them. **Every rule this
document states about a size, a mode or a direction needs a surface where it executes.**


---

## §21 · ما لا يُرى إلا بالقياس / THE SILENT FAILURES

Two more, from widening the system to the product's real scope.

### 21.1 · A missing class is silent by construction

`.toolbar` was used on five screens and defined in no stylesheet. Nothing failed: no
clipping, no overflow, no contrast breach. The elements simply laid out as blocks, and a
filter bar's search box spanned an entire card. CSS has no undefined-symbol error, so
the check has to be written by hand — and now is: every class a screen names must be
declared, in a shared sheet or in that page's own `<style>`.

The general form: **a language that fails silently needs a gate that does not.**

### 21.2 · The product is wider than the number it is famous for

RITM was built and documented as a profit-and-commission system for weeks. It is also
order monitoring, an archive of frozen periods, and a record of details — and those are
not features hanging off the first thing, they are what the merchant opens it for.
A design system that covers one job of four is not a design system for the product.

The rule: **before building surfaces, read the domain and list its objects.** The object
model board (`d10`) exists because that question was answered late. Every object it
names is read off `src/domain`, not off the screens, because the screens are downstream
of the model and can only repeat its mistakes.

---

## §22 · نظام لا يعمل على شاشة أحد ليس نظامًا / A SYSTEM NOBODY'S SCREEN RUNS

> «ماكو تغييرات ولا تطبيق للشكل الجديد والالوان المقترحة وديزاين جديد ولوجو جديد
> كلشي ماتطبق»

Three phases produced a brand, a token architecture and nineteen artboards. All of it
lived in `design-system/`. The product in `src/` was untouched: Apple blue, Cairo, a
tick in a rounded tile. Every gate in those phases was honestly closed, and the client
still opened the app and saw nothing.

### 22.1 · A design system is not delivered until the product runs it

A board is a proposal. A spec is a proposal. The deliverable is the screen the merchant
opens. **A phase that produces only artboards must name, in its own gates, the phase
that lands them — or it is not finished, it is staged.**

### 22.2 · The identity's own colour is usually not a text colour

`#B8A880` is the mark's colour and it is 2.08:1 on paper, 1.9:1 under white. A palette
built by pointing `--accent` at the brand colour puts the brand's own hue on every
label, button and link in the product and fails all of them at once.

So the accent splits in two, permanently:

* `--accent` — the value that must READ. Darkened until it passes on the ground it sits
  on (`#736440`, 5.13 on paper).
* `--accent-fill` — the value that FILLS. The board's own sand, with `--accent-fill-fg`
  as the only ink allowed on it.

**The brand colour is a plate. Deciding which of the two a token is comes before
choosing its hex.**

### 22.3 · A palette swap breaks contrast silently

Nothing throws when `text-white` stays on a token that used to be a vivid blue and is
now a pale sand. The build is green, the typecheck is green, the screenshot looks
plausible, and the merchant is the one who cannot read the button.

`scripts/sweeps/sweep-contrast.mjs` measures every text run on every route in both
themes. Three separate things had to be fixed in the MEASUREMENT before its answer was
worth anything:

1. it walked past an opaque gradient body to the page ground behind it;
2. it matched `rgb()` with a regex, and `color-mix()` / `oklab()` survive into computed
   styles — so it missed exactly the colours these materials are mixed from;
3. it walked ancestors, and the segmented control paints its accent pill as an
   absolutely-positioned SIBLING under the label.

**A ground is what the compositor paints, not what the DOM tree suggests.** Ground a run
by hit test, resolve colours through the engine, and stop at the first opaque paint.

### 22.4 · A token is only as good as its worst ground

`--subtle` was documented "6.07 on bg · 5.21 on surface". Both true. It was also 4.23 on
`--surface-2`, which is where the reps' balance note and the calculator's captions
actually sit. **A comment that lists only the grounds where a token passes is worse than
no comment**, because it ends the question.

### 22.5 · A name is a bug waiting for its author

`--font-mono` pointed at Archivo. Every figure in the product was correct, every comment
explained why, and the name still invited the next person to put code in it or swap in a
real monospace — which would have broken every Arabic run sharing the class, the fourth
time this project paid for a Latin-only face. Renamed `--font-figure` across 30 files.
**When the comment exists to explain away the name, rename the thing.**

---

## §23 · السقف الهادئ في مواجهة اللوحات المعتمَدة / THE QUIET CEILING VS THE BOARDS

> «هذه ملفات استفد منها … كلها تصير نفس شكل وترتيب اللي صار على وفق العلامة
> التجارية الجديدة»

This is the conflict CLAUDE.md requires to be written down rather than resolved
silently, and it is between two things the client said at two different times.

**§15, the quiet ceiling**, was written from «التصميم تحسه صعب ومعقد جدا». It capped
the figures ABOVE the first list at 8, and it was right about the screen it was written
for: one number over a ladder of collapsed rungs.

**The artboards**, approved later, are a different shape: a BRIEF ROW of three titled
panels over a work panel. Measured on the client's own boards:

| board | figures on the screen | worst single panel |
|---|---|---|
| p1 dashboard | 48 | 13 |
| p6 monitor | 48 | 9 |
| p8 ledger | 47 | 3 |
| p9 product | 68 | 9 |
| p4 settlement | 55 | 25 *(a detail card, not a layout panel)* |
| p3 rep | 29 | 4 |
| p7 archive | 43 | 12 |

Under §15's counting rule every one of those boards fails its own ceiling by four to
eight times. So one of the two is measuring the wrong thing, and it is the rule.

### 23.1 · The ceiling is per PANEL, because that is the unit the eye reads

A panel carries its own title and its own hairline. The eye reads one at a time, which
is exactly why three panels of four figures do not feel like twelve, and why 43 figures
on the rebuilt dashboard read as four calm cards while 124 on the old one did not.

So the region moves from "everything above the first list" to "one panel's own
non-row figures", and the number is set the way `sentences` was already set: **one
above the worst honest board panel**, which is 13 → **14**.

### 23.2 · A screen-wide guard stays, because six compliant panels are still a wall

The per-panel rule alone would let a screen grow panels forever. The second guard is
the boards' own worst screen, p9 at 68 → **72**.

### 23.3 · What §15 keeps

Everything except the number and the region. The prose ceilings, the row ceilings, the
one-instrument rule and the "measured at rest, before any disclosure" scope are
unchanged, and they are the clauses that actually caught what the client complained
about: a five-clause paragraph at the top of /access, a six-figure meta line under an
order code. Volume was never the complaint. **Undifferentiated volume was.**

### 23.4 · The general form

**A budget is a measurement of a shape. Change the shape and the budget has to be
re-derived, out loud, against something real — not quietly raised until the new screens
fit.** The boards are the something real here, because the client approved them.

---

## §24 · صوت واحد على كل سطح / ONE VOICE ON EVERY SURFACE

The client's verdict on the typography was «خطوط مخزية … استخدم خطوط عربية واضحة
وتتميز بروح الإبداع واوزان جيده متماسكة». Four separate faults sat behind it, and
each one is now a rule with evidence under it.

### 24.1 · The face had no voice

Tajawal is the face every Arabic template ships. It has almost no vertical drama,
and a screen set entirely in it has ONE TEXTURE — so nothing on that screen can be
more important than anything else by voice alone.

Replaced by the oldest working pairing in Arabic typography rather than an
invention: **Kufi for what is built, Naskh for what is read.** Noto Kufi Arabic
carries titles, the wordmark, table heads and eyebrows; IBM Plex Sans Arabic
carries everything that is read; IBM Plex Sans carries the figures. Two of the
three are one superfamily, so the product is one type design plus one deliberate
voice.

Reem Kufi was tried first and rejected ON SIGHT: it is a display Kufi and its
joins come apart below about 16px, which is most of this app. Rendered, magnified,
looked at, dropped. That is the method, not the outcome.

### 24.2 · Every weight was the same weight

175 weight decisions, 135 of them at 600 or 700. The law is four rungs — 400
prose, 500 the identity of a row, 600 structure, 700 A FIGURE THAT CARRIES A
DECISION AND NOTHING ELSE — plus one optical correction: a figure above 22px steps
back a rung, because the same apparent colour needs less weight as the glyph grows.

**Bold in this product does not mean "important text". It means "a number you act
on".** That is why a panel title is lighter than the figure underneath it.

### 24.3 · Arabic was tracked

`.r-label` and every table head carried `letter-spacing: 0.04em`. That is a LATIN
habit — tracked-out small caps — applied to a connected script, and the mechanism
inserts its space between joined glyphs. Rendered at 4× and looked at: at 0.04em
«الشهر» loosens, at 0.08em it is visibly two words.

**Arabic is never tracked.** An eyebrow is set apart by its face, its size and its
colour, which is how Arabic has always done it. Latin figures are the opposite
case and tighten as they grow.

### 24.4 · Three surface languages in one product

Under the flat, hairline panel system the boards approved, three older languages
were still running on the reps and products screens and on every button in the app:

| was | what it drew | now |
|---|---|---|
| `.clay` / `.clay-inset` / `.clay-press` | carved wells, gradients, inset shadows | `.r-inset` |
| `.molded molded-quiet` on a tile | a lit, shadowed body for "selected" | `.r-choice` + `.is-on` |
| `.device` | 26px radius, three gradients, a 44px drop shadow | `.r-slab` |
| `.molded-accent` on a button | a rim light, a lit top edge, a drop shadow | a flat sand plate |

The button is the one that mattered most, because it is on every screen, and the
authority is the client's OWN actions board — `renders/d4-actions.png` — which
draws a primary as a solid sand plate with dark ink and a modest rounded rectangle
under it. No gradient, no rim, no shadow. The moulded button was drawn before the
boards were approved and it contradicts them; once every panel around it became one
hairline on a flat ground, it was the loudest object in the product.

`.molded-accent` and its siblings are gone from buttons. What stays is the press
(`active:scale`), because travel is feedback and travel is not decoration.

### 24.5 · The currency word was as big as the money

`formatCurrency` appends «د.ع.», and the app printed it at the figure's own size.
On the 56px hero that made a four-character word as tall as the number it
qualifies; on a phone it took most of the line. The board prints it beside the hero
at a fraction of its size, and on the rows underneath it prints no currency at all.

Both `<Money>` and `<Metric>` now split the trailing mark and set it at
`max(10px, 0.34em)` at 60% opacity — one rule that serves a 56px hero and an 11px
table cell.

### 24.6 · One locale, one calendar

`Intl.DateTimeFormat("ar", …)` resolves to the Egyptian month names — «أغسطس» —
while every date this app formats goes through `ar-IQ`, which uses «آب». BOTH WERE
ON THE SCREEN AT ONCE: the period chip in the top bar said «أغسطس 2026» and the
rows underneath it said «27 آب». Three call sites had bypassed the app's own
formatter. A merchant reads one calendar.

### 24.7 · The general form

**A second way of drawing the same thing is not a richer system, it is an
unfinished migration.** Every one of these survived because it was defensible in
the file it lived in and only wrong next to the file beside it. That is exactly the
class of defect a typechecker, a linter and a test suite cannot see, and the reason
this project renders every surface and looks at it.

---

## §25 · العمق المصنوع / MADE DEPTH

The client's answer, when asked how far to flatten:

> «ليس مسطحة بحد كبير بقدر ما تكون ابداعية وكرييتف اكثر ومميز وتضم افكار من رفرنس
> واشكال وترتيبات ذات قيمة تصميمة احترافية تفوق قواعد ui ux»

This is not a preference. It is the correct diagnosis, and it corrects §14 and §22
where they implied the fix for skeuomorphism is flat design.

**The cure for cheap 3D is not flatness. Flatness is cowardice.** A screen with
nothing in it is not restrained, it is empty, and it reads as a template because a
template is exactly what has no ideas in it.

The distinction that does the work:

| SIMULATED depth | MADE depth |
|---|---|
| light reflecting off glass | a panel one step down from the plate |
| a shadow cast on a floor | a row that steps by the mark's own pitch |
| metal catching an overhead lamp | a figure large enough that nothing competes |
| a glow emitted by an arc | an arc solid against a hatched track |

Simulated depth answers "what material is this pretending to be". Made depth
answers "what is more important than what". Only the second is design.

### 25.1 · One mechanism, and it is subtraction

`--cut`: a dark lip at the top of an element and a light one at the bottom. The
eye reads that pair as *down into the surface*; reverse the two and the identical
element reads as *up out of it*. That is the entire mechanism and it is one
declaration.

The page is a PLATE. A panel is CUT INTO it. Nothing in the product lifts.

`--float` is the one shadow that survives, and only a dialog may use it, because a
dialog is genuinely above the page and hiding that makes it read as glued on.

### 25.2 · Thirteen simulations is thirteen answers to a one-answer question

`materials.css` was 1,319 lines holding thirteen families, each simulating a
different material. Six of them were already dead code that nothing called.

**That is the tell.** A design language nobody's screen runs was never a language;
it was a collection of one-off effects that each looked defensible in the file it
lived in and only wrong next to the file beside it. 1,319 → 479 lines.

### 25.3 · Texture that encodes is not decoration

The hatches survived the purge and they had to. A diagonal hatch means AN UNFILLED
REMAINDER and a dot screen means A READING THAT HAS BEEN QUIETED, app-wide (§11).
A colour-blind reader and a printed page both still read the distribution bar
because of them.

The test is not "is it flat" but **"does removing it lose information"**. Remove
the glass caustic: nothing is lost. Remove the hatch: the remainder becomes
indistinguishable from a series.

### 25.4 · An object earns its keep by carrying a quantity

`Odometer` was deleted and `RingGauge` was kept, and the rule is the same for both.

The odometer's ONLY content was the rolling illusion — flat, it is just a number,
and `Metric` is a better number. It also rendered ten digit glyphs per drum, so a
seven-figure amount put seventy characters into the DOM, which is what blinded the
density gate in an earlier phase.

The ring gauge carries a real proportion, so it stayed — but its drop-shadow halo
came off. **An arc cannot glow.** That halo was found by eye on a styleguide
render, not by any sweep, because no sweep measures emitted light.

### 25.5 · The light ground stops being an extension

Open for two phases: the identity board prints no light ground, so `#f2f1ee` was a
derivation nobody had approved.

It answers itself here. **Bone is the PANEL and `#f2f1ee` is the page.** The
board's own value is now the ground it was drawn as, and bone has a job instead of
a justification.

### 25.6 · A token change is a contrast change

Making bone the panel made `--surface-2` equal the panel, so every track, bar and
badge inside a panel went invisible in light mode — caught by eye on the first
render.

Fixing it as one plane per token forced re-deriving two inks that now sit on THREE
grounds instead of two. Measured: `--subtle` was 4.22 on the new plane (a fail) and
`--accent` 3.85. Both moved until all three grounds cleared AA.

**The general form: a ground is never changed alone.** Every ink that lands on it
is part of the same change, and the only way to know is to compute all of them.

### 25.7 · A theme-relative token cannot paint an inverted surface

The landing page's one dark band was set with `bg-fg`. In dark mode `--fg` is
`#f2f1ee`, so the plate was near-WHITE under white text: **1.13:1**, caught by the
contrast sweep.

A surface that is deliberately inverted against BOTH themes needs the tokens that
do not follow the theme — `--ink` and `--paper`. And the reveal animation must not
sit on that surface either: a plate at `opacity: 0` is not a plate, and every
moment before the reveal fires is a moment of white text on the page.
