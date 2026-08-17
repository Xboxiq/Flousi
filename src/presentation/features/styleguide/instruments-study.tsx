"use client";

import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { TickMeter } from "@/presentation/components/objects/tick-meter";
import { WeekBars } from "@/presentation/components/objects/week-bars";
import { Odometer } from "@/presentation/components/objects/odometer";
import { DistributionBar } from "@/presentation/components/objects/distribution-bar";
import { PriceColumn } from "@/presentation/components/objects/price-column";
import { Delta } from "@/presentation/components/ui";
import { Sparkline } from "@/presentation/components/objects/sparkline";
import { MagnitudeRings } from "@/presentation/components/objects/magnitude-rings";
import { ReportFolder } from "@/presentation/components/objects/report-folder";
import { SlideToCommit } from "@/presentation/components/interactive/slide-to-commit";

const money = (n: number) =>
  new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency: "IQD",
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(n);

const share = (n: number) =>
  new Intl.NumberFormat("ar-IQ", {
    style: "percent",
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * The instrument case: every object at reading size, beside what it measures and
 * the law that shapes it (RECIPES R48).
 *
 * This page is the reason the language stays a language. An instrument that
 * cannot be explained in one line here does not belong in the product.
 */
export function InstrumentsStudy() {
  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-fg">خزانة الأدوات — The instrument case</h2>
        <p className="mt-1 text-sm text-muted">
          كل أداة مع ما تقيسه والقانون الذي يشكّلها. أداة لا يمكن شرحها بسطر واحد هنا لا مكان لها في
          المنتج.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bay
          name="العدّاد · Odometer"
          measures="مبلغ يتغيّر — الرقم نفسه في حالة حركة"
          law="§8 التفصيل يحمل معلومة · الأسطوانة اليمنى تسبق والبقية تتبعها بإيقاع"
        >
          <Odometer
            value={1492359}
            format={money}
            drumHeight={1.25}
            className="text-[34px] font-bold leading-none text-fg"
          />
        </Bay>

        <Bay
          name="المشط · TickMeter"
          measures="نسبة يمكن عدّها — أحد عشر سنّاً من عشرين"
          law="§11 المتبقي بيانات · الخلايا الفارغة محفورة لا متدرّجة"
        >
          <div className="flex w-full flex-col gap-3">
            <TickMeter value={0.58} label="عيّنة: 58٪" height={20} />
            <TickMeter value={0.92} tone="success" label="عيّنة: 92٪" height={20} />
            <TickMeter value={1.24} tone="danger" label="عيّنة: تجاوز" height={20} />
          </div>
        </Bay>

        <Bay
          name="القرص · RingGauge"
          measures="هامش أو نسبة تحقّق هدف"
          law="§11 المسار المحفور محزّز · لا قوس عند الصفر (لا نقطة معلّقة)"
        >
          <div className="flex items-center gap-6">
            <RingGauge value={0.365} label={share(0.365)} caption="الهامش" size={92} />
            <RingGauge value={0.82} label={share(0.82)} caption="الهدف" size={92} tone="accent" />
            <RingGauge value={0} label="-23%" caption="خسارة" size={92} tone="danger" />
          </div>
        </Bay>

        <Bay
          name="الأسبوع · WeekBars"
          measures="سبعة أيام، واحد منها هو القراءة"
          law="§11a النقاط = قراءة مُهدّأة · الصلب = القراءة المُبلَّغ عنها"
        >
          <div className="w-full pt-6">
            <WeekBars
              height={64}
              activeIndex={6}
              activeLabel={money(91065)}
              activeCaption="اليوم"
              days={["ح", "ن", "ث", "ر", "خ", "ج", "س"].map((mark, i) => ({
                mark,
                value: [420000, 180000, 610000, 95000, 350000, -80000, 91065][i],
                title: `${mark}`,
              }))}
            />
          </div>
        </Bay>

        <Bay
          name="شريط التوزيع · DistributionBar"
          measures="كلٌّ واحد مقسوم إلى أجزائه الحقيقية"
          law="§11b الأجزاء تساوي الكل · §13 اللون للمعنى والنقش للتمييز"
          wide
        >
          <DistributionBar
            className="w-full"
            total={4299000}
            format={money}
            formatShare={share}
            parts={[
              { id: "purchase", label: "تكلفة الشراء", amount: 1647000, kind: "spend" },
              { id: "shipping", label: "التوصيل", amount: 516000, kind: "spend" },
              { id: "fees", label: "رسوم المنصّة", amount: 383820, kind: "spend" },
              { id: "other", label: "بنود أخرى (3)", amount: 259821, kind: "spend" },
              { id: "keep", label: "صافي ربحك", amount: 1492359, kind: "keep" },
            ]}
          />
        </Bay>

        <Bay
          name="عمود السعر · PriceColumn"
          measures="من السعر إلى الربح — ارتفاع كل صفيحة حصتها"
          law="§1 الجسم قبل الشكل · الجسم هو الحساب نفسه"
        >
          <PriceColumn
            price={85000}
            costs={[
              { key: "purchase", label: "الشراء", amount: 28000 },
              { key: "shipping", label: "التوصيل", amount: 7000 },
              { key: "fees", label: "رسوم", amount: 9265 },
            ]}
            netProfit={40735}
            format={money}
          />
        </Bay>

        <Bay
          name="رقاقة التغيّر · Delta"
          measures="تغيّر مقابل فترة سابقة"
          law="§13 اللون شيفرة · السهم إشارة ثانية حتى لا يعتمد على اللون وحده"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Delta value={0.124} label="+12.4%" against="مقابل الشهر السابق" />
            <Delta value={-0.095} label="-9.5%" against="مقابل الشهر السابق" />
          </div>
        </Bay>

        <Bay
          name="خط الاتجاه · Sparkline"
          measures="ستة أشهر لصفٍّ واحد في جدول"
          law="لا حركة على بيانات تُقرأ · خط الصفر يظهر فقط عند العبور"
        >
          <div className="flex flex-col items-center gap-3">
            <Sparkline values={[120, 80, 210, 160, 260, 240]} width={150} height={34} />
            <Sparkline values={[90, 140, 40, -60, -20, 30]} width={150} height={34} />
          </div>
        </Bay>

        <Bay
          name="حلقات الحجم · MagnitudeRings"
          measures="ثلاث كميات يحوي بعضُها بعضاً — المساحة هي القيمة"
          law="نصف القطر ∝ √القيمة · شرعيتها الاحتواء الحقيقي، وإلا فشريط التوزيع"
        >
          <MagnitudeRings
            size={116}
            format={(n) => money(n)}
            rings={[
              { label: "الإيراد", value: 4299000, kind: "whole" },
              { label: "التكاليف", value: 2806641, kind: "cost" },
              { label: "صافي الربح", value: 1492359, kind: "keep" },
            ]}
          />
        </Bay>

        <Bay
          name="ملف الأرشيف · ReportFolder"
          measures="كم شهراً مؤرشفاً يحمله المتجر"
          law="§8 الأوراق تظهر فقط عند وجود أشهر مقفلة · §4 لا تساوي بين ميلين"
        >
          <div className="stage stage-standing h-[120px] w-44">
            <ReportFolder sheets={3} />
          </div>
        </Bay>

        <Bay
          name="اسحب للإتمام · SlideToCommit"
          measures="فعل لا رجعة فيه — إغلاق شهر"
          law="الإيماءة هي التأكيد · الإفلات المبكر يرتد · مسار لوحة المفاتيح موجود"
          wide
        >
          <SlideToCommit
            className="max-w-[420px]"
            label="اسحب لإغلاق الشهر وقفله"
            doneLabel="أُغلق الشهر"
            onCommit={() => new Promise((r) => setTimeout(r, 600))}
          />
        </Bay>
      </div>
    </section>
  );
}

function Bay({
  name,
  measures,
  law,
  wide,
  children,
}: {
  name: string;
  measures: string;
  law: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`clay flex flex-col gap-4 p-5 ${wide ? "lg:col-span-2" : ""}`}
      data-part="instrument-bay"
    >
      <div className="flex min-h-[132px] items-center justify-center">{children}</div>
      <div className="border-t border-border-soft pt-3">
        <p className="text-sm font-semibold text-fg">{name}</p>
        <p className="mt-1 text-xs text-muted">
          <span className="font-semibold text-subtle">يقيس: </span>
          {measures}
        </p>
        <p className="mt-0.5 text-xs text-subtle">{law}</p>
      </div>
    </div>
  );
}
