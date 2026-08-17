# Flousi — القانون البصري VISUAL LAW (v1)

> Ported and adapted 2026-08-17 from the client's own `Xboxiq/nova`
> (`design-system/VISUAL-LAW.md`) — first-party, fully licensed. This law is what
> turns "رسوم بمستوى الصور" from a wish into a build requirement. It binds every
> visual object in Flousi. Enforced by design-law gates (see DESIGN-PLAN §process)
> and the anti-slop matrix.

## §1 الجسم قبل الشكل — Body before shape
Every visual element is an OBJECT: it has thickness, a light-catching edge, or an
overlap proving something is in front of something. A colored rectangle that
cannot say where its surface ends and its edge begins is filler, not design.
**The screenshot test:** a Flousi visual object, cropped alone, should be
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
| **«الصرف حبر عادي والإيراد فقط ملوّن» (من محفظة استهلاكية، تغذية 5)** | صحيح في محفظة شخصية حيث الصرف طبيعي؛ فلوسي موجود ليقول إن هذه البيعة **خسرت**، فالربح السالب يبقى بالأحمر. الدرس المأخوذ: ليس كل سالب يستحق اللون — الكميات والتكاليف حبر محايد، والقطبية للربح وحده |
| صبغ الألواح بألوان باستيل حسب الدور (نعناعي/بنفشي/مرجاني) | نأخذ فكرة أن اللوح قد يُصبغ بدوره، لا الأصباغ نفسها؛ ألوانها ليست ألواننا |
| **استيراد لوحة «lime على أسود» من تغذية 2026-08-17** | المراجع الأربعة داكنة بلون واحد حاد. الدرس الحقيقي هو **التوزيع**: أرضية هادئة ولون واحد فقط مسموح له أن يشير — وهذا قانوننا أصلاً (§6 §13). أُخذ الدرس وطُبّق على أكسنت Flousi؛ استيراد الـ hue نفسه مرفوض. |
| مخطط النقاط (dot-matrix) لمقارنة مبالغ | شبكة نقاط أسوأ قراءةً من قضيب لسؤال «أي منتج ربح أكثر»؛ مؤجّل لشاشة المندوبين حيث الوحدة شخص لا مبلغ |
| شريط أجزاء يزيد مجموعه على كلّه (التجاوز كقطعة مضافة) | ضُبط في هذه الدفعة: كان الشريط يتجاوز 100% فيُقصّ من طرفه؛ صار التجاوز منطقةً محزّزة فوق الأجزاء التي أكلها (§11b) |
| Purple/violet hues from nova's legacy HTML | يخالف بوابة السلوب؛ نأخذ التقنية ونعيد ربط الألوان بتوكنات Flousi |
