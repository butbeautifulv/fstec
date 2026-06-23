"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { preservePeriodSearchParams } from "@/lib/dashboard/period-range"
import { ResponseReviewStatus } from "@prisma/client"

export function PublicReportsStatusFilters({
  token,
  statusFilter,
}: {
  token: string
  statusFilter?: ResponseReviewStatus
}) {
  const searchParams = useSearchParams()
  const baseHref = `/p/${token}/reports`

  function href(status?: ResponseReviewStatus) {
    const params = preservePeriodSearchParams(searchParams)
    if (status) params.set("status", status)
    else params.delete("status")
    const qs = params.toString()
    return qs ? `${baseHref}?${qs}` : baseHref
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant={!statusFilter ? "default" : "outline"} asChild>
        <Link href={href()}>Все</Link>
      </Button>
      <Button
        size="sm"
        variant={statusFilter === ResponseReviewStatus.PENDING ? "default" : "outline"}
        asChild
      >
        <Link href={href(ResponseReviewStatus.PENDING)}>На проверке</Link>
      </Button>
      <Button
        size="sm"
        variant={statusFilter === ResponseReviewStatus.REJECTED ? "default" : "outline"}
        asChild
      >
        <Link href={href(ResponseReviewStatus.REJECTED)}>Требуют доработки</Link>
      </Button>
      <Button
        size="sm"
        variant={statusFilter === ResponseReviewStatus.ACCEPTED ? "default" : "outline"}
        asChild
      >
        <Link href={href(ResponseReviewStatus.ACCEPTED)}>Приняты</Link>
      </Button>
    </div>
  )
}
