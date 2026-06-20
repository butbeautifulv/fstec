"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import {
  useAdminBreadcrumbLabel,
  useAdminBreadcrumbMiddle,
} from "@/components/admin/admin-breadcrumb"
import { PageHeader } from "@/components/admin/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TypographyMuted } from "@/components/ui/typography"
import { labels } from "@/lib/ui/branding"

export type ResponseDetail = {
  id: number
  result: string
  commentary: string | null
  submittedByLabel: string | null
  submittedAt: string
  orderItem: {
    id: number
    measure: { id: number; name: string }
    subdivision: { id: number; name: string } | null
    order: {
      id: number
      title: string
      organization: { id: number; name: string }
    }
  }
}

export function ResponseDetailClient({ response }: { response: ResponseDetail }) {
  const middleCrumbs = useMemo(
    () => [
      { label: "Поручения", href: "/admin/orders" },
      {
        label: response.orderItem.order.title,
        href: `/admin/orders/${response.orderItem.order.id}`,
      },
      { label: response.orderItem.measure.name },
    ],
    [response]
  )

  useAdminBreadcrumbMiddle(middleCrumbs)
  useAdminBreadcrumbLabel("Отчёт")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Отчёт о выполнении"
        description={response.orderItem.measure.name}
        backHref={`/admin/orders/${response.orderItem.order.id}`}
        backLabel={response.orderItem.order.title}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {response.submittedByLabel ?? "Исполнитель не указан"}
          </CardTitle>
          <CardDescription>
            {format(new Date(response.submittedAt), "dd.MM.yyyy HH:mm")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <TypographyMuted>{labels.org}: {response.orderItem.order.organization.name}</TypographyMuted>
          {response.orderItem.subdivision && (
            <TypographyMuted>
              Подразделение: {response.orderItem.subdivision.name}
            </TypographyMuted>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Результат</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{response.result}</p>
        </CardContent>
      </Card>

      {response.commentary && (
        <Card>
          <CardHeader>
            <CardTitle>Комментарий</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {response.commentary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
