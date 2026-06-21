"use client"

import { OrgBreadcrumb } from "@/components/platform/org-breadcrumb"
import { OrgContactsPanel } from "@/components/platform/org-contacts-panel"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Subdivision = { id: number; name: string }

type ContactRow = {
  id: number
  fullName: string
  position: string | null
  email: string
  role: "PRIMARY" | "RESPONSIBLE" | "NOTIFY"
  subdivisionId: number | null
  subdivision: Subdivision | null
}

export function OrgContactsClient({
  organizationId,
  organizationName,
  initialSubdivisions,
  initialContacts,
}: {
  organizationId: number
  organizationName: string
  initialSubdivisions: Subdivision[]
  initialContacts: ContactRow[]
}) {
  const hubHref = `/panel/organizations/${organizationId}`

  return (
    <div className="flex flex-col gap-6">
      <OrgBreadcrumb organizationId={organizationId} organizationName={organizationName} />
      <PageHeader
        title="Контакты для оповещений"
        description="Получатели email-оповещений по организации и подразделениям"
        backHref={hubHref}
        backLabel={organizationName}
      />
      <Card>
        <CardHeader>
          <CardTitle>Контакты</CardTitle>
          <CardDescription>
            Получатели email-оповещений. Для меры с подразделением используются контакты
            подразделения; если их нет — контакты «Вся организация».
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgContactsPanel
            organizationId={organizationId}
            subdivisions={initialSubdivisions}
            initialContacts={initialContacts}
          />
        </CardContent>
      </Card>
    </div>
  )
}
