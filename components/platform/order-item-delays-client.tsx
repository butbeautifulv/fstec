"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { OrderItemBreadcrumbEffect } from "@/components/platform/order-item-breadcrumb-effect"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { notify } from "@/lib/ui/feedback"

type DelayRequest = {
  id: number
  status: string
  requestedDueAt: string
  justification: string | null
  createdAt: string
}

export function OrderItemDelaysClient({
  orderId,
  orderTitle,
  measureName,
  delayRequests,
}: {
  orderId: number
  orderTitle: string
  measureName: string
  delayRequests: DelayRequest[]
}) {
  const router = useRouter()

  async function reviewDelay(id: number, action: "approve" | "reject") {
    const res = await fetch("/api/delay-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    })
    if (res.ok) {
      notify.success(action === "approve" ? "Перенос одобрен" : "Перенос отклонён")
      router.refresh()
    } else {
      notify.error("Не удалось обработать запрос")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <OrderItemBreadcrumbEffect
        orderId={orderId}
        orderTitle={orderTitle}
        measureName={measureName}
        pageLabel="Переносы"
      />
      <PageHeader
        title="Запросы переноса"
        description={measureName}
        backHref={`/panel/orders/${orderId}`}
        backLabel={orderTitle}
      />

      {delayRequests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Нет запросов переноса по этой позиции
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {delayRequests.map((delay) => (
            <Card key={delay.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{delay.status}</Badge>
                  <span className="font-normal text-muted-foreground">
                    Новый срок: {format(new Date(delay.requestedDueAt), "dd.MM.yyyy")}
                  </span>
                </CardTitle>
                <CardDescription>
                  Запрошено {format(new Date(delay.createdAt), "dd.MM.yyyy HH:mm")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {delay.justification && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {delay.justification}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/panel/delay-requests/${delay.id}`}>Подробнее</Link>
                  </Button>
                  {delay.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => reviewDelay(delay.id, "approve")}>
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewDelay(delay.id, "reject")}
                      >
                        Отклонить
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
