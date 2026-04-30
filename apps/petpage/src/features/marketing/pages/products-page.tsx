import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ProductsCatalogPage } from "@/features/marketing/components/products-catalog-page";

export function ProductsPage() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ProductsCatalogPage />
      <Footer />
    </main>
  );
}

