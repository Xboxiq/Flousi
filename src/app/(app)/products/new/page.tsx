import { PageHeader } from "@/presentation/components/layout/page-header";
import { ProductForm } from "@/presentation/features/products/product-form";

export const metadata = { title: "إضافة منتج" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="إضافة منتج"
        description="أدخل السعر والتكاليف لترى صافي الربح فورًا."
      />
      <ProductForm />
    </>
  );
}
