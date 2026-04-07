import { SiteHeader } from "@/components/boty/site-header"
import { SiteFooter } from "@/components/boty/site-footer"
import { BotyAiChat } from "@/components/boty/boty-ai-chat"
import { LandingHero } from "./landing-hero"
import { LandingServices } from "./landing-services"
import { LandingPrices } from "./landing-prices"
import { LandingDoctors } from "./landing-doctors"
import { LandingAbout } from "./landing-about"
import { LandingTestimonials } from "./landing-testimonials"
import { LandingPromotions } from "./landing-promotions"
import { LandingAppointmentForm } from "./landing-appointment-form"
import { LandingLocation } from "./landing-location"
import { StickyCTA } from "./sticky-cta"
import type { LandingPageProps } from "./landing-types"

export type { LandingPageProps }

export function LandingPage({
  services,
  doctors,
  reviews,
  footerPhone,
  footerPhoneSecondary,
  footerAddress,
  footerEmail,
  isLoggedIn,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteHeader isLoggedIn={isLoggedIn} />

      <main>
        <LandingHero />
        <LandingServices services={services} />
        <LandingPrices />
        <LandingDoctors doctors={doctors} />
        <LandingAbout />
        <LandingTestimonials reviews={reviews} />
        <LandingPromotions />
        <LandingAppointmentForm />
        <LandingLocation />
      </main>

      <SiteFooter
        footerPhone={footerPhone}
        footerPhoneSecondary={footerPhoneSecondary}
        footerAddress={footerAddress}
        footerEmail={footerEmail}
      />

      <StickyCTA />
      <BotyAiChat />
    </div>
  )
}
