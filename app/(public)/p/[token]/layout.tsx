import { notFound } from "next/navigation"
import { PublicShell } from "@/components/public/public-shell"
import { validateAccessToken } from "@/lib/public/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function PublicTokenLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params["params"]
}) {
  const { token } = await params
  const ctx = await validateAccessToken(token)
  if (!ctx) notFound()

  return (
    <PublicShell
      token={token}
      organizationName={ctx.organization.name}
      subdivisionName={ctx.subdivision?.name ?? null}
      navOrders={ctx.orders}
    >
      {children}
    </PublicShell>
  )
}
