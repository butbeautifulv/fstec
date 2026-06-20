import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { serializePublicStatuses } from "@/lib/public/serialize-public"
import { validateAccessLink } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string }> }

export default async function PublicLinkPage({
  params,
  searchParams,
}: {
  params: Params["params"]
  searchParams: Promise<{ overdue?: string }>
}) {
  const { token } = await params
  const { overdue: overdueParam } = await searchParams
  const overdueOnly = overdueParam === "1"

  const linkCtx = await validateAccessLink(token)
  if (!linkCtx) notFound()

  const scope = scopeFromAccessLink(linkCtx.link)
  const statuses = await getWorkflowStatuses()

  return (
    <ScopedDashboardPageShell
      variant="public"
      scope={scope}
      itemLimit={overdueOnly ? undefined : 50}
      title={linkCtx.organization.name}
      description={
        linkCtx.subdivision?.name
          ? `Подразделение: ${linkCtx.subdivision.name}`
          : "Все меры организации"
      }
      baseHref={`/p/${token}`}
      overdueOnly={overdueOnly}
      statuses={serializePublicStatuses(statuses)}
      token={token}
      publicScope={scope.type === "subdivision" ? "subdivision" : "organization"}
      showSubdivisionColumn={scope.type === "organization"}
      emptyMessage="Нет мер для отображения."
    />
  )
}
