import { Footer } from "@/presentation/marketing/components/footer";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { ServicesCatalogPage } from "@/presentation/marketing/components/services-catalog-page";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ServicesCatalogPage />
      <Footer />
    </main>
  );
}
