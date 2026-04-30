import { Footer } from "@/features/marketing/components/footer";
import { Hero } from "@/features/marketing/components/hero";
import { LandingLiveContent } from "@/features/marketing/components/landing-live-content";
import { NavBar } from "@/features/marketing/components/nav-bar";

export function LandingPage() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <Hero />
      <LandingLiveContent />
      <Footer />
    </main>
  );
}

