import { PublicNavMain } from "@/components/public/public-nav-main"
import { fetchPublicNavOrders } from "@/lib/public/validate-token"

export async function PublicNavSidebarSection({ token }: { token: string }) {
  const ctx = await fetchPublicNavOrders(token)
  if (!ctx) return null

  return <PublicNavMain token={token} navOrders={ctx.navOrders} />
}
