import { Footer } from "@/features/marketing/components/footer";
import { Brands } from "@/features/marketing/components/brands";
import { Hero } from "@/features/marketing/components/hero";
import { LandingStaticNavBar } from "@/features/marketing/components/landing-static-nav-bar";
import { Products } from "@/features/marketing/components/products";
import { Services } from "@/features/marketing/components/services";
import { Testimonials } from "@/features/marketing/components/testimonials";
import { getLandingContentBundleServer } from "@/features/marketing/services/landing-content.server";

export async function LandingPage() {
  const content = await getLandingContentBundleServer();

  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <LandingStaticNavBar />
      <Hero />
      <Services items={content.services} />
      <Products items={content.products} />
      <Brands />
      <Testimonials items={content.testimonials} />
      <Footer />
    </main>
  );
}
