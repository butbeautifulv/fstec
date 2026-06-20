import { Suspense } from "react"
import { notFound } from "next/navigation"
import { PublicNavSidebarSection } from "@/components/public/public-nav-sidebar-section"
import { PublicShell } from "@/components/public/public-shell"
import { PublicSidebarNavSkeleton } from "@/components/public/public-sidebar-nav-skeleton"
import { validateAccessLink } from "@/lib/public/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function PublicTokenLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params["params"]
}) {
  const { token } = await params
  const ctx = await validateAccessLink(token)
  if (!ctx) notFound()

  return (
    <PublicShell
      token={token}
      organizationName={ctx.organization.name}
      subdivisionName={ctx.subdivision?.name ?? null}
      navContent={
        <Suspense fallback={<PublicSidebarNavSkeleton />}>
          <PublicNavSidebarSection token={token} />
        </Suspense>
      }
    >
      {children}
    </PublicShell>
  )
}
