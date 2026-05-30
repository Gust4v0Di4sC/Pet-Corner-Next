import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ServicesCatalogPage } from "@/features/marketing/components/services-catalog-page";
import { listLandingServicesServer } from "@/features/marketing/services/landing-content.server";

export async function ServicesPage() {
  const services = await listLandingServicesServer();

  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ServicesCatalogPage initialServices={services} />
      <Footer />
    </main>
  );
}
