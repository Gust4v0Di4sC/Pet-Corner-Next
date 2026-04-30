import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ProductDetailPage } from "@/features/marketing/components/product-detail-page";

type ProductDetailRoutePageProps = {
  productId: string;
};

export function ProductDetailRoutePage({ productId }: ProductDetailRoutePageProps) {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ProductDetailPage productId={productId} />
      <Footer />
    </main>
  );
}

