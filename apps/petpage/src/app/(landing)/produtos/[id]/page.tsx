import { Footer } from "@/presentation/marketing/components/footer";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { ProductDetailPage } from "@/presentation/marketing/components/product-detail-page";

export const dynamic = "force-dynamic";

type ProductDetailRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailRoutePage({
  params,
}: ProductDetailRoutePageProps) {
  const { id } = await params;

  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ProductDetailPage productId={id} />
      <Footer />
    </main>
  );
}
