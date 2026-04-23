import { Footer } from "@/presentation/marketing/components/footer";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { ProductsCatalogPage } from "@/presentation/marketing/components/products-catalog-page";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ProductsCatalogPage />
      <Footer />
    </main>
  );
}
