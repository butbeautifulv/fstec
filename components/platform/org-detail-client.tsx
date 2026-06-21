"use client"

import Link from "next/link"
import { useAdminBreadcrumbLabel } from "@/components/platform/platform-breadcrumb"
import { OrgContactsPanel } from "@/components/platform/org-contacts-panel"
import { OrgLinksPanel } from "@/components/platform/org-links-panel"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

type ContactRow = {
  id: number
  fullName: string
  position: string | null
  email: string
  role: "PRIMARY" | "RESPONSIBLE" | "NOTIFY"
}

export function OrgDetailClient({
  organizationId,
  organizationName,
  initialSubdivisions,
  initialLinks,
  initialContacts,
}: {
  organizationId: number
  organizationName: string
  initialSubdivisions: Subdivision[]
  initialLinks: LinkRow[]
  initialContacts: ContactRow[]
}) {
  useAdminBreadcrumbLabel(organizationName)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={organizationName}
        description="Подразделения и ссылки для исполнителей"
        backHref="/panel/organizations"
        backLabel={labels.orgs}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/panel/organizations/${organizationId}/edit`}>
              <Pencil data-icon="inline-start" />
              Изменить
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Контакты для оповещений</CardTitle>
          <CardDescription>ФИО, должность, email и роль ответственного</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgContactsPanel
            organizationId={organizationId}
            initialContacts={initialContacts}
          />
        </CardContent>
      </Card>

      <OrgLinksPanel
        organizationId={organizationId}
        initialSubdivisions={initialSubdivisions}
        initialLinks={initialLinks}
      />
    </div>
  )
}
