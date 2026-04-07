import { SiteHeader } from "@/components/boty/site-header"
import { SiteFooter } from "@/components/boty/site-footer"
import { LandingHero } from "./landing-hero"
import { LandingServices } from "./landing-services"
import { LandingDoctors } from "./landing-doctors"
import { LandingTestimonials } from "./landing-testimonials"
import { LandingAppointmentForm } from "./landing-appointment-form"
import { LandingLocation } from "./landing-location"
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
        <LandingDoctors doctors={doctors} />
        <LandingTestimonials reviews={reviews} />
        <LandingAppointmentForm />
        <LandingLocation />
      </main>

      <SiteFooter
        footerPhone={footerPhone}
        footerPhoneSecondary={footerPhoneSecondary}
        footerAddress={footerAddress}
        footerEmail={footerEmail}
      />
    </div>
  )
}
