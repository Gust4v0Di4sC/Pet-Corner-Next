import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ServicesCatalogPage } from "@/features/marketing/components/services-catalog-page";

export function ServicesPage() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ServicesCatalogPage />
      <Footer />
    </main>
  );
}

