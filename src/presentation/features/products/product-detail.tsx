"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash } from "@phosphor-icons/react";
import type { Product } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Badge, Button, Dialog, EmptyState, Skeleton } from "@/presentation/components/ui";
import { ProductForm } from "./product-form";
import { RecordSaleDialog } from "./record-sale-dialog";
import { useAccess } from "@/presentation/hooks/use-access";
import { formatCurrency } from "@/presentation/lib/format";

export function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const deleteProduct = useDataStore((s) => s.deleteProduct);

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const access = useAccess();
  const canManage = access.can("manageProducts");
  const canRecord = access.can("recordSales");
  const [saleOpen, setSaleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!loaded) {
    return (
      <>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-96 w-full" />
      </>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="المنتج غير موجود"
        description="ربما تم حذف هذا المنتج."
        action={
          <Button asChild>
            <Link href="/products">العودة للمنتجات</Link>
          </Button>
        }
      />
    );
  }

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      router.push("/products");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm" leadingIcon={<ArrowLeft size={16} className="rtl:rotate-180" />}>
          <Link href="/products">المنتجات</Link>
        </Button>
      </div>
      <PageHeader
        title={product.name}
        description={product.sku ? `SKU ${product.sku}` : "عدّل بيانات المنتج وتكاليفه."}
        actions={
          <>
            <Badge tone={product.status === "active" ? "accent" : "neutral"}>
              {({ active: "نشط", draft: "مسودة", archived: "مؤرشف" } as Record<string, string>)[product.status] ?? product.status}
            </Badge>
            {canRecord && (
              <Button
                variant="secondary"
                leadingIcon={<Plus size={16} />}
                onClick={() => setSaleOpen(true)}
              >
                تسجيل بيع
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                leadingIcon={<Trash size={16} />}
                onClick={() => setConfirmDelete(true)}
              >
                حذف
              </Button>
            )}
          </>
        }
      />

      {/* The edit form IS the cost sheet: purchase price, every cost line, the margin
          and the break-even. A session without `manageProducts` gets the price list
          instead — enough to sell from, and nothing about what the merchant paid
          (gate P3/G4). */}
      {canManage ? <ProductForm product={product} /> : <ProductBrief product={product} />}

      <RecordSaleDialog product={product} open={saleOpen} onClose={() => setSaleOpen(false)} />

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="حذف المنتج"
        description={`سيُحذف "${product.name}" نهائيًا. تبقى المبيعات المسجّلة.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete} loading={deleting}>
              حذف المنتج
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</p>
      </Dialog>
    </>
  );
}

/**
 * What a rep needs from a product page: what it is, and what it sells for.
 *
 * Deliberately NOT a hollowed-out edit form — a form with its cost fields removed
 * still reads as "there is more here you cannot have", and half of it would be
 * disabled inputs. This is its own small object: a price list entry.
 */
function ProductBrief({ product }: { product: Product }) {
  const settings = useDataStore((s) => s.settings);
  const money = (n: number) =>
    formatCurrency(n, { currency: product.currency, locale: settings.locale });

  const lines: { label: string; value: string }[] = [
    { label: "سعر البيع", value: money(product.sellingPrice) },
    { label: "الفئة", value: product.category ?? "بلا فئة" },
    { label: "الرمز", value: product.sku ?? "بلا رمز" },
  ];

  return (
    <div className="device flex flex-col gap-5 p-5 sm:p-6">
      <ul className="flex flex-col">
        {lines.map((line) => (
          <li
            key={line.label}
            className="flex items-baseline justify-between gap-4 border-b border-border-soft py-3 last:border-b-0"
          >
            <span className="text-sm text-muted">{line.label}</span>
            <bdi dir="ltr" className="font-figure text-sm font-semibold text-fg">
              {line.value}
            </bdi>
          </li>
        ))}
      </ul>
      {product.notes && (
        <p className="text-sm leading-relaxed text-muted">{product.notes}</p>
      )}
    </div>
  );
}
