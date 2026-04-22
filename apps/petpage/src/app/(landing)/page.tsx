import { Brands } from "@/presentation/marketing/components/brands";
import { Footer } from "@/presentation/marketing/components/footer";
import { Hero } from "@/presentation/marketing/components/hero";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { Products } from "@/presentation/marketing/components/products";
import { Services } from "@/presentation/marketing/components/services";
import { Testimonials } from "@/presentation/marketing/components/testimonials";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <Hero />
      <Services />
      <Products />
      <Brands />
      <Testimonials />
      <Footer />
    </main>
  );
}
