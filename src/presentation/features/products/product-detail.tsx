"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash } from "@phosphor-icons/react";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Badge, Button, Dialog, EmptyState, Skeleton } from "@/presentation/components/ui";
import { ProductForm } from "./product-form";
import { RecordSaleDialog } from "./record-sale-dialog";

export function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const deleteProduct = useDataStore((s) => s.deleteProduct);

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
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
        <Button asChild variant="ghost" size="sm" leadingIcon={<ArrowLeft size={16} />}>
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
            <Button
              variant="secondary"
              leadingIcon={<Plus size={16} />}
              onClick={() => setSaleOpen(true)}
            >
              تسجيل بيع
            </Button>
            <Button
              variant="ghost"
              leadingIcon={<Trash size={16} />}
              onClick={() => setConfirmDelete(true)}
            >
              حذف
            </Button>
          </>
        }
      />

      <ProductForm product={product} />

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
