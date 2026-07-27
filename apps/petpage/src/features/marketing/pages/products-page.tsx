import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ProductsCatalogPage } from "@/features/marketing/components/products-catalog-page";
import { listLandingProductsServer } from "@/features/marketing/services/landing-content.server";

export async function ProductsPage() {
  const products = await listLandingProductsServer();

  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ProductsCatalogPage initialProducts={products} />
      <Footer />
    </main>
  );
}
