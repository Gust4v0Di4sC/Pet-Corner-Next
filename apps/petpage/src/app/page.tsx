import { About } from "@/presentation/marketing/components/about";
import { Footer } from "@/presentation/marketing/components/footer";
import { Hero } from "@/presentation/marketing/components/hero";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { Products } from "@/presentation/marketing/components/products";
import { Services } from "@/presentation/marketing/components/services";
import { Testimonials } from "@/presentation/marketing/components/testimonials";

export default function Home() {
  return (
    <main>
      <NavBar />
      <Hero />
      <Services />
      <About />
      <Products />
      <Testimonials />
      <Footer />
    </main>
  );
}
