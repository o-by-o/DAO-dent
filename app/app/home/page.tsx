import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
  getDashboardStats,
  getUserCourses,
  getUserCertificates,
  getSkinAnalysisCount,
  getAdminDashboardStats,
  getPopularCourses,
  getRecentEnrollments,
  getUpcomingAlerts,
} from "@/lib/queries"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "../dashboard-client"
import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client"

export const metadata: Metadata = {
  title: "Главная — личный кабинет",
  description: "Статистика обучения, ваши курсы и быстрый доступ к материалам DIB Academy.",
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role

  if (role === "ADMIN") {
    const [stats, popularCourses, recentEnrollments, upcomingAlerts] = await Promise.all([
      getAdminDashboardStats(),
      getPopularCourses(5),
      getRecentEnrollments(5),
      getUpcomingAlerts(7),
    ])

    return (
      <AdminDashboardClient
        userName={session.user.name || "Администратор"}
        stats={stats}
        popularCourses={popularCourses}
        recentEnrollments={recentEnrollments}
        upcomingAlerts={upcomingAlerts}
        session={session}
      />
    )
  }

  // STUDENT dashboard
  const [stats, courses, certificates, skinAnalysisCount, shopProducts] =
    await Promise.all([
      getDashboardStats(session.user.id),
      getUserCourses(session.user.id),
      getUserCertificates(session.user.id).catch(() => []),
      getSkinAnalysisCount(session.user.id),
      prisma.product
        .findMany({
          where: { published: true },
          orderBy: { order: "asc" },
          take: 4,
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            brand: true,
            slug: true,
          },
        })
        .catch(() => []),
    ])

  const continueCourse = courses
    .filter((c) => c.progress > 0 && c.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0]

  return (
    <DashboardClient
      userName={session.user.name || "Студент"}
      stats={stats}
      courses={courses}
      continueCourse={continueCourse || null}
      skinAnalysisCount={skinAnalysisCount}
      certificates={certificates.slice(0, 3)}
      shopProducts={shopProducts.map((p) => ({
        ...p,
        price: p.price != null ? Number(p.price) : null,
      }))}
      session={session}
    />
  )
}
