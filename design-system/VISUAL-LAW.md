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
| Flat corporate illustration | بلا جسم ولا ضوء — يسقط §1 |
| Pastel per-icon tiles | لون بلا معنى — يسقط §13 |
| Side-lit objects | تنقلب فيزياؤها بالمرآة RTL — يسقط §2 |
| Purple/violet hues from nova's legacy HTML | يخالف بوابة السلوب؛ نأخذ التقنية ونعيد ربط الألوان بتوكنات Flousi |
