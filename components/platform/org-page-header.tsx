"use client"

import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { labels } from "@/lib/ui/branding"
import { LayoutDashboard, Pencil } from "lucide-react"

export function OrgPageHeader({
  organizationId,
  organizationName,
  description,
  backHref,
  backLabel,
}: {
  organizationId: number
  organizationName: string
  description: string
  backHref?: string
  backLabel?: string
}) {
  return (
    <PageHeader
      title={organizationName}
      description={description}
      backHref={backHref ?? "/panel/organizations"}
      backLabel={backLabel ?? labels.orgs}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/panel/organizations/${organizationId}/dashboard`}>
              <LayoutDashboard data-icon="inline-start" />
              Сводка
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/panel/organizations/${organizationId}/edit`}>
              <Pencil data-icon="inline-start" />
              Изменить
            </Link>
          </Button>
        </div>
      }
    />
  )
}
