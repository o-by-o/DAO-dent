import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import {
  clinicPhone,
  clinicPhoneSecondary,
  clinicAddress,
  clinicEmail,
  fallbackServices,
  fallbackDoctors,
  fallbackReviews,
  clinicGeo,
  CLINIC_FULL_NAME,
  CLINIC_TAGLINE,
} from "@/lib/dib-interfarm-content"
import { LandingPage } from "@/components/landing/landing-page"

export const metadata: Metadata = {
  title: "ДаоДент — Семейная стоматология у м. Семёновская | Москва",
  description:
    "Стоматологическая клиника ДаоДент у метро Семёновская — 5 минут пешком. Лечение зубов, имплантация, ортодонтия, детская стоматология. Безболезненно, современно, с гарантией. Запись онлайн.",
  keywords: [
    "стоматология семёновская",
    "стоматология соколиная гора",
    "зубной врач семёновская",
    "лечение зубов измайлово",
    "имплантация зубов семёновская",
    "детский стоматолог семёновская",
    "стоматологическая клиника электрозаводская",
  ],
  openGraph: {
    title: "ДаоДент — Семейная стоматология у м. Семёновская",
    description: "Безболезненное лечение зубов, имплантация, ортодонтия. 5 минут от метро. Запись онлайн.",
    type: "website",
    locale: "ru_RU",
  },
  other: {
    // Schema.org JSON-LD будет в head через скрипт ниже
  },
}

// Schema.org structured data для LocalBusiness + DentalClinic
function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Dentist"],
    name: CLINIC_FULL_NAME,
    description: CLINIC_TAGLINE,
    url: "https://daodent.ru",
    telephone: clinicPhone,
    email: clinicEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Семёновская",
      addressLocality: "Москва",
      addressRegion: "Москва",
      postalCode: "105094",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinicGeo.lat,
      longitude: clinicGeo.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "18:00",
      },
    ],
    priceRange: "₽₽",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function LandingRoute() {
  const session = await auth()

  // TODO: загружать услуги и врачей из БД когда данные будут заполнены
  const services = fallbackServices.map((s) => ({ ...s }))
  const doctors = fallbackDoctors.map((d) => ({ ...d }))
  const reviews = fallbackReviews.map((r) => ({ ...r }))

  return (
    <>
      <StructuredData />
      <LandingPage
        heroTitle="Семейная стоматология у метро Семёновская"
        heroSubtitle="Безболезненное лечение, современное оборудование, опытные врачи. 5 минут пешком от метро."
        services={services}
        doctors={doctors}
        reviews={reviews}
        footerPhone={clinicPhone}
        footerPhoneSecondary={clinicPhoneSecondary}
        footerAddress={clinicAddress}
        footerEmail={clinicEmail}
        isLoggedIn={!!session?.user}
      />
    </>
  )
}
