import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ServiceDetailPage } from "@/components/landing/service-detail"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let service: { name: string; description: string | null } | null = null
  try {
    service = await prisma.service.findUnique({
      where: { slug },
      select: { name: true, description: true },
    })
  } catch {
    // fallback
  }

  if (!service) {
    return { title: "Услуга не найдена — ДаоДент" }
  }

  return {
    title: `${service.name} у м. Семёновская — ДаоДент`,
    description:
      service.description ||
      `${service.name} в стоматологической клинике ДаоДент у метро Семёновская. Безболезненно, с гарантией. Запись онлайн.`,
    keywords: [
      `${service.name.toLowerCase()} семёновская`,
      `${service.name.toLowerCase()} соколиная гора`,
      `${service.name.toLowerCase()} москва`,
      "стоматология семёновская",
    ],
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params

  let service: {
    id: string
    name: string
    slug: string
    description: string | null
    price: { toString(): string }
    priceMax: { toString(): string } | null
    durationMin: number
    category: { name: string; slug: string }
  } | null = null

  let relatedServices: Array<{
    id: string
    name: string
    slug: string
    price: { toString(): string }
  }> = []

  try {
    service = await prisma.service.findUnique({
      where: { slug },
      include: { category: { select: { name: true, slug: true } } },
    })

    if (service) {
      relatedServices = await prisma.service.findMany({
        where: { categoryId: service.category.slug, slug: { not: slug }, published: true },
        take: 4,
        select: { id: true, name: true, slug: true, price: true },
      })
    }
  } catch {
    // fallback для отсутствия БД
  }

  if (!service) notFound()

  return <ServiceDetailPage service={service} relatedServices={relatedServices} />
}
