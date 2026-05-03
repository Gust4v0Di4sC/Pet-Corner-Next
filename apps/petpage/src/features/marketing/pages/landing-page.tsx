import { Footer } from "@/features/marketing/components/footer";
import { Brands } from "@/features/marketing/components/brands";
import { Hero } from "@/features/marketing/components/hero";
import {
  LandingLiveContent,
  LandingLiveTestimonials,
} from "@/features/marketing/components/landing-live-content";
import { LandingStaticNavBar } from "@/features/marketing/components/landing-static-nav-bar";

export function LandingPage() {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <LandingStaticNavBar />
      <Hero />
      <LandingLiveContent />
      <Brands />
      <LandingLiveTestimonials />
      <Footer />
    </main>
  );
}
