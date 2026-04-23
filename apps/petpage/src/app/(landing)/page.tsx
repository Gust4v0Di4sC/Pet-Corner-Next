import { Footer } from "@/presentation/marketing/components/footer";
import { Hero } from "@/presentation/marketing/components/hero";
import { LandingLiveContent } from "@/presentation/marketing/components/landing-live-content";
import { NavBar } from "@/presentation/marketing/components/nav-bar";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <Hero />
      <LandingLiveContent />
      <Footer />
    </main>
  );
}
