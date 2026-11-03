import { JsonLd } from '../../components/JsonLd'
import {
  SITE_DESCRIPTION,
  graph,
  organizationSchema,
  softwareApplicationSchema,
  webPageSchema,
  websiteSchema,
} from '../../utils/schema'
import { LandingFooter } from './LandingFooter'
import { LandingNav } from './LandingNav'
import { ContactSection } from './sections/ContactSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { HeroSection } from './sections/HeroSection'
import { IndustriesSection } from './sections/IndustriesSection'
import { PricingSection } from './sections/PricingSection'
import { ProcessSection } from './sections/ProcessSection'
import { ValuePropsSection } from './sections/ValuePropsSection'

const LANDING_JSON_LD = graph(
  organizationSchema(),
  websiteSchema(),
  softwareApplicationSchema(),
  webPageSchema('WebPage', '/', 'ReorderFlow - Dashboard Inventori', SITE_DESCRIPTION),
)

export function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">
      <JsonLd data={LANDING_JSON_LD} />
      <LandingNav />
      <HeroSection />
      <ValuePropsSection />
      <FeaturesSection />
      <IndustriesSection />
      <ProcessSection />
      <PricingSection />
      <ContactSection />
      <LandingFooter />
    </div>
  )
}
