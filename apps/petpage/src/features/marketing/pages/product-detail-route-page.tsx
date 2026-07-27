import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ProductDetailPage } from "@/features/marketing/components/product-detail-page";
import { getLandingProductByIdServer } from "@/features/marketing/services/landing-content.server";

type ProductDetailRoutePageProps = {
  productId: string;
};

export async function ProductDetailRoutePage({ productId }: ProductDetailRoutePageProps) {
  const product = await getLandingProductByIdServer(productId);

  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ProductDetailPage productId={productId} initialProduct={product} />
      <Footer />
    </main>
  );
}
