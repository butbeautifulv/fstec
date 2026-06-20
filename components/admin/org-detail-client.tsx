"use client"

import Link from "next/link"
import { useAdminBreadcrumbLabel } from "@/components/admin/admin-breadcrumb"
import { OrgLinksPanel } from "@/components/admin/org-links-panel"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { labels } from "@/lib/ui/branding"
import { Pencil } from "lucide-react"

type Subdivision = { id: number; name: string }

type LinkRow = {
  id: number
  token: string
  revokedAt: string | null
  subdivisionId: number | null
  subdivision: { id: number; name: string } | null
}

export function OrgDetailClient({
  organizationId,
  organizationName,
  initialSubdivisions,
  initialLinks,
}: {
  organizationId: number
  organizationName: string
  initialSubdivisions: Subdivision[]
  initialLinks: LinkRow[]
}) {
  useAdminBreadcrumbLabel(organizationName)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={organizationName}
        description="Подразделения и ссылки для исполнителей"
        backHref="/admin/organizations"
        backLabel={labels.orgs}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/organizations/${organizationId}/edit`}>
              <Pencil data-icon="inline-start" />
              Изменить
            </Link>
          </Button>
        }
      />

      <OrgLinksPanel
        organizationId={organizationId}
        initialSubdivisions={initialSubdivisions}
        initialLinks={initialLinks}
      />
    </div>
  )
}
