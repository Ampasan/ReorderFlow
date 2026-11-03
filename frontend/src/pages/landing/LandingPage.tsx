import { LandingFooter } from './LandingFooter'
import { LandingNav } from './LandingNav'
import { AboutSection } from './sections/AboutSection'
import { ContactSection } from './sections/ContactSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { HeroSection } from './sections/HeroSection'
import { IndustriesSection } from './sections/IndustriesSection'
import { PricingSection } from './sections/PricingSection'
import { ProcessSection } from './sections/ProcessSection'
import { ValuePropsSection } from './sections/ValuePropsSection'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">
      <LandingNav />
      <HeroSection />
      <ValuePropsSection />
      <FeaturesSection />
      <IndustriesSection />
      <ProcessSection />
      <AboutSection />
      <PricingSection />
      <ContactSection />
      <LandingFooter />
    </div>
  )
}
