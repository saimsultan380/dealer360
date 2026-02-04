import { MarketingHeader } from "@/components/landing/marketing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeatureSection } from "@/components/landing/feature-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <MarketingHeader />
      <HeroSection />
      <StatsSection />
      <FeatureSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
