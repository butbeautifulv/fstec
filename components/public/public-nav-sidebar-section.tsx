import { PublicNavMain } from "@/components/public/public-nav-main"
import { countPublicReportsNeedingRevision } from "@/lib/public/reports"
import { fetchPublicNavOrders } from "@/lib/public/validate-token"

export async function PublicNavSidebarSection({ token }: { token: string }) {
  const [ctx, revisionCount] = await Promise.all([
    fetchPublicNavOrders(token),
    countPublicReportsNeedingRevision(token),
  ])
  if (!ctx) return null

  return (
    <PublicNavMain
      token={token}
      navOrders={ctx.navOrders}
      revisionCount={revisionCount}
    />
  )
}
