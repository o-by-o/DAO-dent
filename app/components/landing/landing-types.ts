export type LandingServiceTeaser = {
  id: string
  name: string
  category: string
  priceLabel: string
  icon: string
  description: string
}

export type LandingDoctorTeaser = {
  id: string
  name: string
  specialization: string
  experience: string
  description: string
  avatarUrl?: string | null
}

export type LandingReview = {
  name: string
  text: string
  tag: string
  rating: number
}

export type LandingPageProps = {
  heroTitle: string
  heroSubtitle: string
  services: LandingServiceTeaser[]
  doctors: LandingDoctorTeaser[]
  reviews: LandingReview[]
  footerPhone: string
  footerPhoneSecondary: string
  footerAddress: string
  footerEmail: string
  isLoggedIn: boolean
}
