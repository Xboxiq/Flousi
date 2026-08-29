"use client";

import { useMemo, useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { CommissionCalculator, assignmentTier, type SchemeTier } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import {
  Badge,
  Button,
  Dialog,
  Field,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
import { SCHEME_TIER_LABELS } from "@/presentation/lib/labels";
import { cn } from "@/presentation/lib/cn";

const ANY = "";
/** The chain, in the order the resolver walks it. */
const CHAIN: SchemeTier[] = ["productRep", "product", "rep", "accountDefault"];
/** Printed by both the table and the phone list, so it is worded once. */
const NO_ROWS = "لا توجد استثناءات، فكل بيع يقع على الافتراضي للحساب.";

/**
 * The overrides bench: where the chain is bound, and where it is proven.
 *
 * The table is the merchant's own list of exceptions; the probe underneath is the
 * UI counterpart of the most-specific-wins test — pick a rep and a product and
 * the four tiers are laid out with the one that actually won marked by the domain
 * resolver itself, not by a rule re-implemented here.
 */
export function SchemeOverrides() {
  const products = useDataStore((s) => s.products);
  const reps = useDataStore((s) => s.reps);
  const schemes = useDataStore((s) => s.commissionSchemes);
  const assignments = useDataStore((s) => s.commissionAssignments);
  const settings = useDataStore((s) => s.settings);
  const createAssignment = useDataStore((s) => s.createCommissionAssignment);
  const deleteAssignment = useDataStore((s) => s.deleteCommissionAssignment);

  const activeSchemes = useMemo(() => schemes.filter((s) => s.status === "active"), [schemes]);
  const [productId, setProductId] = useState(ANY);
  const [repId, setRepId] = useState(ANY);
  const [schemeId, setSchemeId] = useState(ANY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /* A precedence binding is not lost to one mis-tap: removal is confirmed first,
     the same shape product-detail uses for a destructive action. */
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const [probeRep, setProbeRep] = useState(ANY);
  const [probeProduct, setProbeProduct] = useState(ANY);

  const productName = (id?: string) =>
    id ? (products.find((p) => p.id === id)?.name ?? "منتج محذوف") : "كل المنتجات";
  const repName = (id?: string) =>
    id ? (reps.find((r) => r.id === id)?.name ?? "مندوب محذوف") : "كل المندوبين";
  const schemeName = (id: string) => schemes.find((s) => s.id === id)?.name ?? "نظام محذوف";

  const rows = useMemo(
    () =>
      assignments
        .filter((a) => a.status === "active")
        .slice()
        .sort((a, b) => assignmentTier(b).localeCompare(assignmentTier(a))),
    [assignments],
  );

  /* One key, two widths: the sanctioned icon-only Button is 44px tall and carries
     the moulded grammar its siblings have, so the phone gets a real target. */
  const removeKey = (a: (typeof rows)[number]) => (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`إزالة استثناء ${schemeName(a.schemeId)}`}
      title="إزالة الاستثناء"
      onClick={() => setPendingRemove(a.id)}
    >
      <Trash size={16} />
    </Button>
  );

  const pending = pendingRemove ? (rows.find((a) => a.id === pendingRemove) ?? null) : null;

  const doRemove = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await deleteAssignment(pendingRemove);
      setPendingRemove(null);
    } finally {
      setRemoving(false);
    }
  };

  const add = async () => {
    if (!schemeId) {
      setError("اختر نظام القسمة الذي سيُطبَّق.");
      return;
    }
    if (!productId && !repId) {
      setError("حدّد منتجًا أو مندوبًا، فبدونهما هذه هي القاعدة الافتراضية للحساب.");
      return;
    }
    setSaving(true);
    try {
      await createAssignment({
        schemeId,
        productId: productId || undefined,
        repId: repId || undefined,
        status: "active",
      });
      setError(null);
      setProductId(ANY);
      setRepId(ANY);
      setSchemeId(ANY);
    } finally {
      setSaving(false);
    }
  };

  /* The resolver is the authority on who wins; the candidates below are looked up
     only so the chain can be READ. */
  const probe = useMemo(() => {
    if (!probeRep) return null;
    const resolved = CommissionCalculator.resolveScheme({
      productId: probeProduct,
      repId: probeRep,
      assignments,
      schemes,
      accountDefaultSchemeId: settings.defaultCommissionSchemeId,
    });
    const candidate = (tier: SchemeTier): string | null => {
      if (tier === "accountDefault")
        return settings.defaultCommissionSchemeId
          ? schemeName(settings.defaultCommissionSchemeId)
          : null;
      const hit = assignments.find(
        (a) =>
          a.status === "active" &&
          assignmentTier(a) === tier &&
          (tier === "productRep"
            ? a.productId === probeProduct && a.repId === probeRep
            : tier === "product"
              ? a.productId === probeProduct
              : a.repId === probeRep),
      );
      return hit ? schemeName(hit.schemeId) : null;
    };
    return { resolved, candidate };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- schemeName reads `schemes`, already a dep
  }, [probeRep, probeProduct, assignments, schemes, settings.defaultCommissionSchemeId]);

  return (
    /* The title and the precedence line moved onto the rung's own latch when this
       device was hung on the bench's ladder (P11): a card inside a rung would be a
       card in a card, and the chain is now stated once instead of twice. */
    <>
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="المنتج" htmlFor="ov-product">
            <Select
              id="ov-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              options={[
                { label: "كل المنتجات", value: ANY },
                ...products.map((p) => ({ label: p.name, value: p.id })),
              ]}
            />
          </Field>
          <Field label="المندوب" htmlFor="ov-rep">
            <Select
              id="ov-rep"
              value={repId}
              onChange={(e) => setRepId(e.target.value)}
              options={[
                { label: "كل المندوبين", value: ANY },
                ...reps.map((r) => ({ label: r.name, value: r.id })),
              ]}
            />
          </Field>
          <Field label="النظام المطبَّق" htmlFor="ov-scheme" error={error ?? undefined}>
            <Select
              id="ov-scheme"
              value={schemeId}
              onChange={(e) => {
                setSchemeId(e.target.value);
                if (error) setError(null);
              }}
              placeholder="اختر نظامًا"
              options={activeSchemes.map((s) => ({ label: s.name, value: s.id }))}
            />
          </Field>
          <div className="flex items-end">
            <Button
              variant="secondary"
              leadingIcon={<Plus size={16} weight="bold" />}
              loading={saving}
              onClick={add}
            >
              إضافة استثناء
            </Button>
          </div>
        </div>

        {/* Five columns need a tablet's width. On a phone the precedence chain —
            the whole point of this list — would become a sideways-scrolling strip,
            so it becomes rows instead (the shape rep-sale-rows.tsx established). */}
        <div className="hidden sm:block">
          <Table>
            <THead>
              <TR>
                <TH>النطاق</TH>
                <TH>المنتج</TH>
                <TH>المندوب</TH>
                <TH>النظام</TH>
                <TH className="text-end">إزالة</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((a) => (
                <TR key={a.id} data-row>
                  <TD>
                    <Badge>{SCHEME_TIER_LABELS[assignmentTier(a)]}</Badge>
                  </TD>
                  <TD className="text-muted">{productName(a.productId)}</TD>
                  <TD className="text-muted">{repName(a.repId)}</TD>
                  <TD className="font-medium text-fg">{schemeName(a.schemeId)}</TD>
                  <TD className="text-end">{removeKey(a)}</TD>
                </TR>
              ))}
              {rows.length === 0 && (
                <TR>
                  <TD className="py-8 text-center text-muted" colSpan={5}>
                    {NO_ROWS}
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

        <ul className="flex flex-col gap-2 sm:hidden">
          {rows.map((a) => (
            <li
              key={a.id}
              data-row
              className="r-inset flex items-center gap-3 p-3"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge>{SCHEME_TIER_LABELS[assignmentTier(a)]}</Badge>
                  <span className="min-w-0 truncate text-sm font-medium text-fg">
                    {schemeName(a.schemeId)}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] text-subtle">
                  {productName(a.productId)} · {repName(a.repId)}
                </span>
              </span>
              <span className="shrink-0">{removeKey(a)}</span>
            </li>
          ))}
          {rows.length === 0 && <li className="py-6 text-center text-sm text-muted">{NO_ROWS}</li>}
        </ul>

        {/* The chain, proven on a real pair rather than described */}
        <div className="border-t border-border pt-4">
          <span className="text-[11px] text-subtle">جرِّب القاعدة على حالة</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="المندوب" htmlFor="probe-rep">
              <Select
                id="probe-rep"
                value={probeRep}
                onChange={(e) => setProbeRep(e.target.value)}
                options={[
                  { label: "اختر مندوبًا", value: ANY },
                  ...reps.map((r) => ({ label: r.name, value: r.id })),
                ]}
              />
            </Field>
            <Field label="المنتج" htmlFor="probe-product">
              <Select
                id="probe-product"
                value={probeProduct}
                onChange={(e) => setProbeProduct(e.target.value)}
                options={[
                  { label: "اختر منتجًا", value: ANY },
                  ...products.map((p) => ({ label: p.name, value: p.id })),
                ]}
              />
            </Field>
          </div>

          {probe && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {CHAIN.map((tier) => {
                const name = probe.candidate(tier);
                const won = probe.resolved.tier === tier;
                return (
                  <li
                    key={tier}
                    className={cn(
                      "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2 text-[13px]",
                      won ? "r-choice is-on font-medium text-fg" : "text-muted",
                    )}
                  >
                    <span>{SCHEME_TIER_LABELS[tier]}</span>
                    <span className="flex items-baseline gap-2">
                      <span>{name ?? "لا ارتباط"}</span>
                      {/* the raised body already says which tier won, so the pill
                          stays neutral: one state, one channel (VISUAL-LAW §6a) */}
                      {won && <Badge>المطبَّق</Badge>}
                    </span>
                  </li>
                );
              })}
              {probe.resolved.tier === "none" && (
                <li className="text-[13px] text-muted">
                  لا قاعدة تنطبق على هذه الحالة، فالبيع يُسجَّل بدون حصة محسوبة.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title="إزالة الاستثناء"
        description={
          pending
            ? `يُزال ارتباط «${schemeName(pending.schemeId)}» بـ ${productName(
                pending.productId,
              )} · ${repName(pending.repId)}، فيعود القرار لما بعده في سلسلة الأولوية.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingRemove(null)} disabled={removing}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={doRemove} loading={removing}>
              إزالة
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          الاستثناء وحده يُزال، ولا يتغيّر شيء في العمليات المسجّلة: حصصها مجمّدة على قاعدتها.
        </p>
      </Dialog>
    </>
  );
}
