"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, ArrowUUpLeft, FloppyDisk, Plus, Sliders } from "@phosphor-icons/react";
import {
  CommissionCalculator,
  DEFAULT_REP_RATIO,
  Money as MoneyValue,
  defaultCommissionSchemeParams,
  makeCostBreakdown,
  schemeParams,
  toFixedAmountMinor,
  type CommissionKind,
  type CommissionScheme,
  type CommissionSchemeParams,
  type CommissionSplitResult,
  type LossPolicy,
  type ProfitBasis,
  type RoundingBeneficiary,
  type DiscountTreatment,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Money,
  Segmented,
  Skeleton,
} from "@/presentation/components/ui";
import {
  DistributionBar,
  type DistributionPart,
} from "@/presentation/components/objects/distribution-bar";
import { PriceColumn, type ColumnBlock } from "@/presentation/components/objects/price-column";
import {
  currencySymbol,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/presentation/lib/format";
import {
  COMMISSION_KIND_LABELS,
  COST_LINE_LABELS,
  LOSS_POLICY_LABELS,
  PROFIT_BASIS_HINTS,
  PROFIT_BASIS_LABELS,
  ROUNDING_BENEFICIARY_LABELS,
} from "@/presentation/lib/labels";
import { cn } from "@/presentation/lib/cn";
import { Ladder, Rung } from "@/presentation/features/dashboard/ladder";
import { SchemeOverrides } from "./scheme-overrides";
import { SchemeTiles } from "./scheme-tiles";
import { SplitPreview } from "./split-preview";

/** The four follow-up readings, one open at a time (P11). */
type BenchRung = "column" | "crumb" | "loss" | "recent" | "overrides";

interface Draft {
  name: string;
  kind: CommissionKind;
  /** Held as a percent because that is what the merchant types. */
  repPercent: number;
  fixedAmountMajor: number;
  pricePercent: number;
  profitBasis: ProfitBasis;
  lossPolicy: LossPolicy;
  roundingBeneficiary: RoundingBeneficiary;
  /** Is the rep's basis taken before or after an order offer? (P6, the client's «خيار لكل طريقة عمولة») */
  discountTreatment: DiscountTreatment;
}

const KIND_OPTIONS = (["profitShare", "fixedPerUnit", "percentOfPrice"] as const).map((k) => ({
  label: COMMISSION_KIND_LABELS[k],
  value: k,
}));
const BASIS_OPTIONS = (["netProfit", "afterPurchaseCost"] as const).map((b) => ({
  label: PROFIT_BASIS_LABELS[b],
  value: b,
}));
const LOSS_OPTIONS = (["ownerOnly", "shared"] as const).map((l) => ({
  label: LOSS_POLICY_LABELS[l],
  value: l,
}));
const ROUND_OPTIONS = (["owner", "rep"] as const).map((r) => ({
  label: ROUNDING_BENEFICIARY_LABELS[r],
  value: r,
}));
const DISCOUNT_OPTIONS = [
  { label: "بعد الخصم", value: "afterDiscount" as const },
  { label: "قبل الخصم", value: "beforeDiscount" as const },
];

/** The client's own example, verbatim: bought at 10, the rep sells at 20, ship 2. */
const CLIENT_EXAMPLE = { price: 20, purchase: 10, shipping: 2, quantity: 1 };

const BLANK: Draft = {
  name: "",
  ...(() => {
    const p = defaultCommissionSchemeParams();
    return {
      kind: p.kind,
      repPercent: (p.repRatio ?? DEFAULT_REP_RATIO) * 100,
      fixedAmountMajor: 0,
      pricePercent: 0,
      profitBasis: p.profitBasis,
      lossPolicy: p.lossPolicy,
      roundingBeneficiary: p.roundingBeneficiary,
      discountTreatment: p.discountTreatment ?? "afterDiscount",
    };
  })(),
};

function fromScheme(scheme: CommissionScheme, currency: string): Draft {
  return {
    name: scheme.name,
    kind: scheme.kind,
    repPercent: (scheme.repRatio ?? DEFAULT_REP_RATIO) * 100,
    fixedAmountMajor: MoneyValue.fromMinor(scheme.fixedAmountMinor ?? 0, currency).amount,
    pricePercent: (scheme.priceRatio ?? 0) * 100,
    profitBasis: scheme.profitBasis,
    lossPolicy: scheme.lossPolicy,
    roundingBeneficiary: scheme.roundingBeneficiary,
    // Absent on every pre-P6 scheme, and absent MEANS afterDiscount (the stored
    // default), so the control shows the truth rather than an empty state.
    discountTreatment: scheme.discountTreatment ?? "afterDiscount",
  };
}

/**
 * «مِسطرة القسمة» — the calibration bench.
 *
 * PRODUCT-PLAN §7.1 and P1 G4 make the same demand: the choice is explained by
 * SHOWING NUMBERS. So the live example is this screen's focal object, not a
 * footnote: every knob re-reads it through the domain calculator, the basis switch
 * physically moves cost plates in or out of the divided column, and both loss
 * policies are printed side by side on a losing price rather than described.
 *
 * This is the one surface where `LivingNumber` is sanctioned (inside
 * `SplitPreview`), because the merchant is actively shaping the figure.
 */
export function CommissionBench() {
  const loaded = useDataStore((s) => s.loaded);
  const schemes = useDataStore((s) => s.commissionSchemes);
  const assignments = useDataStore((s) => s.commissionAssignments);
  const settings = useDataStore((s) => s.settings);
  const sales = useDataStore((s) => s.sales);
  const products = useDataStore((s) => s.products);
  const createScheme = useDataStore((s) => s.createCommissionScheme);
  const updateScheme = useDataStore((s) => s.updateCommissionScheme);
  const saveSettings = useDataStore((s) => s.saveSettings);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [override, setOverride] = useState<Draft | null>(null);
  const [example, setExample] = useState(CLIENT_EXAMPLE);
  const [lossPrice, setLossPrice] = useState<number | null>(null);
  const [rung, setRung] = useState<BenchRung | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = settings.currency;
  const locale = settings.locale;
  const money = (n: number) => formatCurrency(n, { currency, locale });
  const share = (r: number, digits = 0) => formatPercent(r, { locale, digits });
  const count = (n: number) => formatNumber(n, { locale, digits: 0 });
  const symbol = currencySymbol(currency, locale);

  const selected = useMemo(
    () =>
      schemes.find((s) => s.id === (selectedId ?? settings.defaultCommissionSchemeId)) ??
      schemes[0],
    [schemes, selectedId, settings.defaultCommissionSchemeId],
  );

  /* null = untouched, so switching schemes follows the record instead of leaving a
     stale draft behind. No effect writes this state. */
  const draft = useMemo(
    () => override ?? (selected ? fromScheme(selected, currency) : BLANK),
    [override, selected, currency],
  );
  const set = (patch: Partial<Draft>) => setOverride({ ...draft, ...patch });
  const dirty = override !== null;

  const params: CommissionSchemeParams = useMemo(
    () => ({
      kind: draft.kind,
      /* percent → ratio exactly once, here. The domain turns it into integer
         basis points before it ever meets money, so no float reaches a share. */
      repRatio: draft.repPercent / 100,
      fixedAmountMinor: toFixedAmountMinor(draft.fixedAmountMajor),
      priceRatio: draft.pricePercent / 100,
      profitBasis: draft.profitBasis,
      lossPolicy: draft.lossPolicy,
      roundingBeneficiary: draft.roundingBeneficiary,
    }),
    [draft],
  );

  /* The rail echoes the ratio the DOMAIN will receive, not a second conversion of
     the typed percent: one number, one source (see the `params` memo above). */
  const railPct = Math.min(100, Math.max(0, (params.repRatio ?? 0) * 100));

  const costs = useMemo(
    () =>
      makeCostBreakdown({
        purchase: { fixed: example.purchase, percent: 0 },
        shipping: { fixed: example.shipping, percent: 0 },
      }),
    [example.purchase, example.shipping],
  );

  const split = useMemo(
    () =>
      CommissionCalculator.split({
        unitPrice: example.price,
        quantity: example.quantity,
        currency,
        costs,
        params,
      }),
    [example.price, example.quantity, currency, costs, params],
  );

  /** The column is a per-unit object, so it reads its own unit split. */
  const unitSplit = useMemo(
    () =>
      CommissionCalculator.split({
        unitPrice: example.price,
        quantity: 1,
        currency,
        costs,
        params,
      }),
    [example.price, currency, costs, params],
  );

  /* The basis IS a line drawn across the cost stack: on `netProfit` every plate
     is inside the column and its head is net profit; on `afterPurchaseCost` the
     delivery plate steps out of the column and lands on the owner alone. */
  const columnCosts: ColumnBlock[] = useMemo(() => {
    const purchase = {
      key: "purchase",
      label: COST_LINE_LABELS.purchase,
      amount: example.purchase,
    };
    if (draft.profitBasis === "afterPurchaseCost") return [purchase];
    return [
      purchase,
      { key: "shipping", label: COST_LINE_LABELS.shipping, amount: example.shipping },
    ];
  }, [draft.profitBasis, example.purchase, example.shipping]);

  const excluded = useMemo(
    () =>
      draft.profitBasis === "afterPurchaseCost" && example.shipping > 0
        ? [{ label: COST_LINE_LABELS.shipping, amount: example.shipping }]
        : [],
    [draft.profitBasis, example.shipping],
  );

  /* The residual, printed literally in the smallest unit of the currency: the two
     beneficiaries differ by at most one, and an option nobody can see is an
     option nobody chose. */
  const crumb = useMemo(() => {
    const basisMinor = split.basis.minorUnits;
    const toOwner = CommissionCalculator.applyRatioMinor(basisMinor, params.repRatio ?? 0, "owner");
    const toRep = CommissionCalculator.applyRatioMinor(basisMinor, params.repRatio ?? 0, "rep");
    return { toOwner, toRep, exists: toOwner !== toRep };
  }, [split.basis, params.repRatio]);

  const lossPriceValue = lossPrice ?? example.purchase;
  const lossCases = useMemo(() => {
    const at = (lossPolicy: LossPolicy) =>
      CommissionCalculator.split({
        unitPrice: lossPriceValue,
        quantity: 1,
        currency,
        costs,
        params: { ...params, lossPolicy },
      });
    return { ownerOnly: at("ownerOnly"), shared: at("shared") };
  }, [lossPriceValue, currency, costs, params]);

  /** One real recent sale, re-split under the draft: an abstract percent proves nothing. */
  const recent = useMemo(() => {
    const withProduct = sales
      .map((s) => ({ sale: s, product: products.find((p) => p.id === s.productId) }))
      .filter((x): x is { sale: (typeof sales)[number]; product: NonNullable<typeof x.product> } =>
        Boolean(x.product),
      )
      .sort((a, b) => new Date(b.sale.soldAt).getTime() - new Date(a.sale.soldAt).getTime());
    const first = withProduct[0];
    if (!first) return null;
    const result = CommissionCalculator.split({
      unitPrice: first.sale.unitPrice,
      quantity: first.sale.quantity,
      currency: first.sale.currency,
      costs: first.product.costs,
      params,
    });
    return { ...first, result };
  }, [sales, products, params]);

  const recentParts = useMemo(() => {
    if (!recent) return null;
    const r = recent.result;
    if (r.basis.minorUnits <= 0 || r.repShare.minorUnits < 0 || r.ownerShare.minorUnits < 0)
      return null;
    const parts: DistributionPart[] = [
      { id: "owner", label: "حصتك", amount: r.ownerShare.amount, kind: "keep" },
      { id: "rep", label: "حصة المندوب", amount: r.repShare.amount, kind: "spend" },
    ];
    return { parts, total: r.basis.amount };
  }, [recent]);

  const bindings = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments) {
      if (a.status !== "active") continue;
      map.set(a.schemeId, (map.get(a.schemeId) ?? 0) + 1);
    }
    return map;
  }, [assignments]);

  /** Every tile prints its own resolved figure on the shared example. */
  const tileExample = (scheme: CommissionScheme) =>
    money(
      CommissionCalculator.split({
        unitPrice: example.price,
        quantity: example.quantity,
        currency,
        costs,
        params: schemeParams(scheme),
      }).repShare.amount,
    );

  const save = async () => {
    if (!selected) return;
    if (!draft.name.trim()) {
      setError("اكتب اسمًا للنظام.");
      return;
    }
    setSaving(true);
    try {
      await updateScheme(selected.id, {
        name: draft.name.trim(),
        kind: draft.kind,
        repRatio: params.repRatio,
        fixedAmountMinor: params.fixedAmountMinor,
        priceRatio: params.priceRatio,
        profitBasis: draft.profitBasis,
        lossPolicy: draft.lossPolicy,
        roundingBeneficiary: draft.roundingBeneficiary,
        discountTreatment: draft.discountTreatment,
      });
      setOverride(null);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const addScheme = async () => {
    const created = await createScheme({
      ...defaultCommissionSchemeParams(),
      name: `نظام قسمة ${count(schemes.length + 1)}`,
      status: "active",
    });
    setSelectedId(created.id);
    setOverride(null);
  };

  const toggleSchemeStatus = async () => {
    if (!selected) return;
    await updateScheme(selected.id, {
      status: selected.status === "active" ? "archived" : "active",
    });
  };

  const makeDefault = async () => {
    if (!selected) return;
    await saveSettings({ ...settings, defaultCommissionSchemeId: selected.id });
  };

  const toggleRung = (id: BenchRung) => setRung((cur) => (cur === id ? null : id));

  const header = (
    <PageHeader
      title="إعدادات القسمة"
      description="اضبط القاعدة والأرقام تشرح نفسها."
      actions={
        <>
          {/* A confirmation is not a profit figure, so it stays in neutral ink and
              lets the word do the work (§13 keeps success for «the merchant keeps»).
              The region is always in the DOM, because it self-clears after 2s and a
              live region mounted with its message is announced by nothing. */}
          {/* `empty:hidden` keeps it in the DOM (so the message IS announced when
              it appears) without leaving an empty flex item holding a gap open in
              the action row while there is nothing to say. */}
          <span aria-live="polite" className="text-sm text-muted empty:hidden">
            {saved ? "تم الحفظ." : null}
          </span>
          <Button
            leadingIcon={<FloppyDisk size={16} />}
            loading={saving}
            onClick={save}
            disabled={!selected}
          >
            حفظ
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<Plus size={16} weight="bold" />}
            onClick={addScheme}
          >
            نظام جديد
          </Button>
        </>
      }
    />
  );

  if (!loaded) {
    return (
      <>
        {header}
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const back = (
    <div className="mb-2">
      {/* Back is toward the inline START, which in RTL is the right — an unmirrored
          left arrow reads as «forward» (the idiom slide-to-commit already owns). */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        leadingIcon={<ArrowLeft size={16} className="rtl:rotate-180" />}
      >
        <Link href="/reps">الفريق</Link>
      </Button>
    </div>
  );

  if (schemes.length === 0 || !selected) {
    return (
      <>
        {back}
        {header}
        <EmptyState
          icon={<Sliders size={24} />}
          title="لا يوجد نظام قسمة بعد"
          description="أنشئ نظامًا واحدًا لتُقسم أرباح كل عملية تلقائيًا بينك وبين مندوبك."
          action={
            <Button leadingIcon={<Plus size={16} weight="bold" />} onClick={addScheme}>
              نظام جديد
            </Button>
          }
        />
      </>
    );
  }

  const isDefault = selected.id === settings.defaultCommissionSchemeId;

  return (
    <>
      {back}
      {header}

      <Card>
        <CardHeader className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div>
            {/* The tiles print the share and the binding count themselves, so a
                description saying that they do was a sentence about the screen rather
                than about the merchant's money (VISUAL-LAW §15). */}
            <CardTitle>أنظمة القسمة</CardTitle>
          </div>
          {!isDefault && (
            <Button variant="secondary" size="sm" className="sm:ms-auto" onClick={makeDefault}>
              اجعله الافتراضي للحساب
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <SchemeTiles
            schemes={schemes}
            bindings={bindings}
            defaultId={settings.defaultCommissionSchemeId}
            selectedId={selected.id}
            onSelect={(id) => {
              setSelectedId(id);
              setOverride(null);
              setError(null);
            }}
            example={tileExample}
            exampleLabel="حصة المندوب في المثال"
            count={count}
          />
        </CardContent>
      </Card>

      {/* The workbench column got SHORTER when its two secondary devices moved onto
          the ladder, and two equal columns then left a 350px void under it. The form
          takes the wide track and the bench a fixed sticky rail beside it, which is
          also the better fit for a panel of two figures (VISUAL-LAW §10). */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>القاعدة</CardTitle>
              <CardDescription>تعديلها يسري على المبيعات الجديدة فقط.</CardDescription>
            </div>
            {dirty && <Badge tone="warning">غير محفوظ</Badge>}
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field label="اسم النظام" htmlFor="scheme-name" required error={error ?? undefined}>
              <Input
                id="scheme-name"
                value={draft.name}
                invalid={Boolean(error)}
                onChange={(e) => {
                  set({ name: e.target.value });
                  if (error) setError(null);
                }}
              />
            </Field>

            {/* A Segmented row is a GROUP: <label for> cannot name it, so the label
                renders as a span and the group points back at it. */}
            <Field label="طريقة الحساب" htmlFor="scheme-kind" labelsGroup>
              <Segmented
                id="scheme-kind"
                aria-labelledby="scheme-kind-label"
                options={KIND_OPTIONS}
                value={draft.kind}
                onChange={(kind) => set({ kind })}
              />
            </Field>

            {draft.kind === "profitShare" && (
              <div className="flex flex-col gap-2">
                <Field
                  label="حصة المندوب من الأساس"
                  htmlFor="scheme-ratio"
                  helper={`الافتراضي ${share(DEFAULT_REP_RATIO)}`}
                >
                  <Input
                    id="scheme-ratio"
                    type="number"
                    min={0}
                    max={100}
                    trailing="%"
                    className="clay-inset"
                    value={draft.repPercent || ""}
                    onChange={(e) => set({ repPercent: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                {/* The rail's job is the COMPARISON: how far the typed share stands
                    from the account's default, which is struck on the scale. It used
                    to print the value in a badge as well, so one number appeared four
                    times on this screen — in the field, on the badge, in the helper
                    and in the caption's parenthetical. The field holds it, the helper
                    names the default, the rail shows the distance (VISUAL-LAW §15). */}
                <div className="rail relative h-7 overflow-hidden rounded-[10px]">
                  <div
                    className="rail-fill absolute inset-y-0 start-0 rounded-[10px] bg-accent"
                    style={{ width: `${railPct}%` }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-y-1 w-[2px] bg-fg/45"
                    style={{ insetInlineStart: `${DEFAULT_REP_RATIO * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-subtle">الخط الرأسي هو افتراضك.</span>
              </div>
            )}

            {draft.kind === "fixedPerUnit" && (
              <Field
                label="المبلغ لكل وحدة"
                htmlFor="scheme-fixed"
                helper="يُثبَّت عند الحفظ بأصغر وحدة من العملة، فلا يتغيّر التقريب بعد ذلك."
              >
                <Input
                  id="scheme-fixed"
                  type="number"
                  min={0}
                  step="0.01"
                  leading={symbol}
                  className="clay-inset"
                  value={draft.fixedAmountMajor || ""}
                  onChange={(e) => set({ fixedAmountMajor: parseFloat(e.target.value) || 0 })}
                />
              </Field>
            )}

            {draft.kind === "percentOfPrice" && (
              <Field
                label="نسبة من سعر البيع"
                htmlFor="scheme-price-ratio"
                helper="تُحسب من السعر لا من الربح، فقد تتجاوز الربح في العمليات ضعيفة الهامش."
              >
                <Input
                  id="scheme-price-ratio"
                  type="number"
                  min={0}
                  max={100}
                  trailing="%"
                  className="clay-inset"
                  value={draft.pricePercent || ""}
                  onChange={(e) => set({ pricePercent: parseFloat(e.target.value) || 0 })}
                />
              </Field>
            )}

            <Field
              label="الأساس المقسوم"
              htmlFor="scheme-basis"
              labelsGroup
              helper={PROFIT_BASIS_HINTS[draft.profitBasis]}
            >
              <Segmented
                id="scheme-basis"
                aria-labelledby="scheme-basis-label"
                options={BASIS_OPTIONS}
                value={draft.profitBasis}
                onChange={(profitBasis) => set({ profitBasis })}
              />
            </Field>

            <Field label="عند الخسارة" htmlFor="scheme-loss" labelsGroup>
              <div className="flex flex-wrap items-center gap-3">
                <Segmented
                  id="scheme-loss"
                  aria-labelledby="scheme-loss-label"
                  options={LOSS_OPTIONS}
                  value={draft.lossPolicy}
                  onChange={(lossPolicy) => set({ lossPolicy })}
                />
                {/* lit only while the rep can actually be debited (§8 §12) */}
                {draft.lossPolicy === "shared" && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                    <span
                      aria-hidden
                      className="lamp size-[8px]"
                      style={
                        {
                          "--lamp-color": "var(--danger)",
                          "--lamp-glow": "color-mix(in srgb, var(--danger) 60%, transparent)",
                        } as React.CSSProperties
                      }
                    />
                    يُخصم من رصيد المندوب
                  </span>
                )}
              </div>
            </Field>

            <Field
              label="لو كان على الطلبية عرض"
              htmlFor="scheme-discount"
              labelsGroup
              helper={
                draft.discountTreatment === "afterDiscount"
                  ? "حصّته من بعد الخصم: المندوب يشارك في كلفة العرض الذي يمنحه، فلا يتساهل به."
                  : "حصّته من قبل الخصم: العرض كلّه على حسابك أنت."
              }
            >
              <Segmented
                id="scheme-discount"
                aria-labelledby="scheme-discount-label"
                options={DISCOUNT_OPTIONS}
                value={draft.discountTreatment}
                onChange={(discountTreatment) => set({ discountTreatment })}
              />
            </Field>

            <Field
              label="الوحدة الصغرى غير القابلة للقسمة"
              htmlFor="scheme-round"
              labelsGroup
              helper="الطرف الذي يأخذها في الربح ويحملها في الخسارة."
            >
              <Segmented
                id="scheme-round"
                aria-labelledby="scheme-round-label"
                options={ROUND_OPTIONS}
                value={draft.roundingBeneficiary}
                onChange={(roundingBeneficiary) => set({ roundingBeneficiary })}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              {isDefault ? (
                <span className="text-[11px] text-subtle">
                  الافتراضي للحساب لا يُؤرشف قبل اختيار غيره.
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={
                    selected.status === "active" ? (
                      <Archive size={15} />
                    ) : (
                      <ArrowUUpLeft size={15} />
                    )
                  }
                  onClick={toggleSchemeStatus}
                >
                  {selected.status === "active" ? "أرشفة النظام" : "إعادة تنشيطه"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* The example column is bodies on a bench, not a card: an instrument
            shell inside a card would be a card in a card (VISUAL-LAW, and the
            same shape product-form uses for the profit panel). */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <div className="clay px-5 pt-4 pb-5">
            {/* The client's own example used to be spelled out in words here as
                well: «اشتريته بعشرة، باعه المندوب بعشرين، والتوصيل باثنين» over four
                labelled fields already holding 20, 10 and 2. The fields ARE the
                sentence (VISUAL-LAW §15). */}
            <span className="text-sm font-semibold text-fg">المثال، رقمًا رقمًا</span>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="سعر البيع" htmlFor="ex-price">
                <Input
                  id="ex-price"
                  type="number"
                  min={0}
                  leading={symbol}
                  value={example.price || ""}
                  onChange={(e) =>
                    setExample({ ...example, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label={COST_LINE_LABELS.purchase} htmlFor="ex-purchase">
                <Input
                  id="ex-purchase"
                  type="number"
                  min={0}
                  leading={symbol}
                  value={example.purchase || ""}
                  onChange={(e) =>
                    setExample({ ...example, purchase: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label={COST_LINE_LABELS.shipping} htmlFor="ex-shipping">
                <Input
                  id="ex-shipping"
                  type="number"
                  min={0}
                  leading={symbol}
                  value={example.shipping || ""}
                  onChange={(e) =>
                    setExample({ ...example, shipping: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="الكمية" htmlFor="ex-qty">
                <Input
                  id="ex-qty"
                  type="number"
                  min={1}
                  value={example.quantity || ""}
                  onChange={(e) =>
                    setExample({ ...example, quantity: parseInt(e.target.value) || 1 })
                  }
                />
              </Field>
            </div>
          </div>

          <SplitPreview
            split={split}
            profitBasis={draft.profitBasis}
            repName="المندوب"
            schemeName={draft.name || "قاعدة بلا اسم"}
            tierLabel={dirty ? "مسودة غير محفوظة" : "محفوظ"}
            money={money}
            locale={locale}
          />

        </div>
      </div>

      {/* Four secondary readings used to stand open under the workbench: the
          per-unit column, the leftover-unit case, the two loss policies side by side,
          and the last real operation. Thirty-one figures at rest, on a screen whose
          job is to shape ONE rule. The workbench keeps its example and its split;
          everything that answers a follow-up question hangs on the ladder, whole
          (VISUAL-LAW §15). */}
      <Ladder className="mt-5">
        <Rung
          title="ما يُقسم من السعر"
          hint="عمود السعر لكل وحدة: ما خرج تكلفةً وما بقي أساساً"
          open={rung === "column"}
          onToggle={() => toggleRung("column")}
        >
          <div>
            <PriceColumn
              price={example.price}
              costs={columnCosts}
              netProfit={unitSplit.basis.amount}
              format={money}
            />
            {excluded.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                {excluded.map((line) => (
                  <li
                    key={line.label}
                    className="flex items-baseline justify-between gap-3 text-[12px]"
                  >
                    <span className="text-muted">{line.label} خارج الأساس، عليك وحدك</span>
                    <Money className="text-fg">{money(line.amount)}</Money>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Rung>

        {/* Titled for the CASE, not for the setting: the field above is already called
            «الوحدة الصغرى غير القابلة للقسمة» and prints the chosen side, so a latch
            repeating both was the same fact three times (VISUAL-LAW §15). */}
        {draft.kind === "profitShare" && (
          <Rung
            title="الوحدة المتبقّية في هذا المثال"
            hint="حصة المندوب بأصغر وحدة من العملة تحت كل خيار"
            open={rung === "crumb"}
            onToggle={() => toggleRung("crumb")}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <CrumbCase
                  label={`إلى ${ROUNDING_BENEFICIARY_LABELS.owner}`}
                  value={count(crumb.toOwner)}
                  applied={draft.roundingBeneficiary === "owner"}
                />
                <CrumbCase
                  label={`إلى ${ROUNDING_BENEFICIARY_LABELS.rep}`}
                  value={count(crumb.toRep)}
                  applied={draft.roundingBeneficiary === "rep"}
                />
              </div>
              <span className="text-[11px] text-muted">
                {crumb.exists
                  ? "هذا الأساس لا ينقسم بالتساوي، فوحدة واحدة تذهب للطرف المختار."
                  : "هذا الأساس ينقسم تمامًا، فلا وحدة متبقّية أصلًا."}
              </span>
            </div>
          </Rung>
        )}

        <Rung
          title="لو خسرت العملية"
          hint="نفس التكاليف بسعر خاسر، والسياستان جنباً إلى جنب"
          open={rung === "loss"}
          onToggle={() => toggleRung("loss")}
        >
          <div className="flex flex-col gap-4">
            <div className="sm:w-40">
              <Field label="سعر خاسر" htmlFor="loss-price">
                <Input
                  id="loss-price"
                  type="number"
                  min={0}
                  leading={symbol}
                  value={lossPrice === null ? lossPriceValue || "" : lossPrice || ""}
                  onChange={(e) => setLossPrice(parseFloat(e.target.value) || 0)}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <LossCase
                title={LOSS_POLICY_LABELS.ownerOnly}
                split={lossCases.ownerOnly}
                applied={draft.lossPolicy === "ownerOnly"}
                money={money}
              />
              <LossCase
                title={LOSS_POLICY_LABELS.shared}
                split={lossCases.shared}
                applied={draft.lossPolicy === "shared"}
                money={money}
              />
            </div>
          </div>
        </Rung>

        {recent && (
          <Rung
            title="على آخر عملية فعلية"
            hint="آخر عملية مسجّلة فعلاً، وكيف انقسم أساسها"
            open={rung === "recent"}
            onToggle={() => toggleRung("recent")}
          >
            <p className="mb-3 text-[12px] text-muted">
              {recent.product.name} · {formatDate(recent.sale.soldAt, { locale })} ·{" "}
              {count(recent.sale.quantity)} قطعة
            </p>
            {recentParts ? (
              <DistributionBar
                parts={recentParts.parts}
                total={recentParts.total}
                format={money}
                formatShare={(r) => share(r)}
                label={`قسمة أساس آخر عملية: ${recent.product.name}`}
              />
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                <p className="w-full text-muted">
                  هذه العملية لا تعطي أساسًا موجبًا يُقسم، والأرقام كما هي:
                </p>
                <Reading
                  label="الأساس"
                  value={money(recent.result.basis.amount)}
                  polarity={recent.result.basis.minorUnits}
                />
                <Reading label="حصة المندوب" value={money(recent.result.repShare.amount)} />
                <Reading
                  label="ما يبقى لك"
                  value={money(recent.result.ownerKeeps.amount)}
                  polarity={recent.result.ownerKeeps.minorUnits}
                />
              </div>
            )}
          </Rung>
        )}

        {/* Four selects, a table and a precedence probe: a second workbench under the
            first. It answers «لماذا طُبّق هذا النظام على هذه الحالة؟», which is a
            question asked when it is asked (VISUAL-LAW §15). */}
        <Rung
          title="الاستثناءات وترتيب الأولوية"
          hint="الأخصّ يفوز، والسلسلة مُجرَّبة على حالة بالأسفل"
          open={rung === "overrides"}
          onToggle={() => toggleRung("overrides")}
        >
          <SchemeOverrides />
        </Rung>
      </Ladder>
    </>
  );
}

/** A label over its figure. Polarity is spent on profit figures only (§13). */
function Reading({ label, value, polarity }: { label: string; value: string; polarity?: number }) {
  return (
    <div>
      <div className="text-[11px] text-muted">{label}</div>
      <Money polarity={polarity} className="mt-0.5 block text-[15px] font-bold text-fg">
        {value}
      </Money>
    </div>
  );
}

function CrumbCase({ label, value, applied }: { label: string; value: string; applied: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] px-3 py-2",
        applied ? "molded molded-quiet" : "clay-inset",
      )}
    >
      <div className="text-[11px] text-muted">{label}</div>
      <Money className="mt-0.5 block text-[14px] font-bold text-fg">{value}</Money>
    </div>
  );
}

/**
 * One loss policy, priced. The applied one is raised rather than tinted, so the
 * comparison carries no colour it has not earned: the rep's share is a quantity,
 * and only what the owner is left holding is a profit figure.
 */
function LossCase({
  title,
  split,
  applied,
  money,
}: {
  title: string;
  split: CommissionSplitResult;
  applied: boolean;
  money: (n: number) => string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-lg)] px-4 py-3",
        applied ? "molded molded-quiet" : "clay-inset",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-fg">{title}</span>
        {/* the raised body already carries «applied»; a tinted pill would claim
            the same state twice on two channels (VISUAL-LAW §6a) */}
        {applied && <Badge>المطبَّق</Badge>}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Reading label="حصة المندوب" value={money(split.repShare.amount)} />
        <Reading
          label="ما يبقى لك"
          value={money(split.ownerKeeps.amount)}
          polarity={split.ownerKeeps.minorUnits}
        />
      </div>
      <span className="text-[11px] text-subtle">
        {split.basis.minorUnits >= 0
          ? "هذا السعر لا يخسر، فالسياستان متساويتان هنا."
          : split.lossApplied
            ? "الخسارة كلها عليك، وحصته صفر."
            : "الخسارة مقسومة، ويُخصم نصيبه من رصيده."}
      </span>
    </div>
  );
}
