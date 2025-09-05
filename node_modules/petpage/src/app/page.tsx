import { Hero } from "./_components/hero";
import { NavBar } from "./_components/nav-bar";
import { Products } from "./_components/products";
import { Services } from "./_components/services";
import { Testimonials } from "./_components/testimonials";
import { Footer } from "./_components/footer";

export default function Home() {
  return (
    <main>
     <NavBar/>
     <Hero />
     <Services />
     <Products/>
     <Testimonials/>
     <Footer/>
    </main>
  );
}