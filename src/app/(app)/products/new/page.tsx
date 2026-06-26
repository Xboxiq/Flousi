import { PageHeader } from "@/presentation/components/layout/page-header";
import { ProductForm } from "@/presentation/features/products/product-form";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Add product" description="Enter pricing and costs to see profit instantly." />
      <ProductForm />
    </>
  );
}
