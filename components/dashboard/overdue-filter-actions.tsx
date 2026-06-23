"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { preservePeriodSearchParams } from "@/lib/dashboard/period-range"

export function OverdueFilterActions({
  baseHref,
  overdueOnly,
}: {
  baseHref: string
  overdueOnly: boolean
}) {
  const searchParams = useSearchParams()

  function href(overdue: boolean) {
    const params = preservePeriodSearchParams(searchParams)
    if (overdue) params.set("overdue", "1")
    else params.delete("overdue")
    const qs = params.toString()
    return qs ? `${baseHref}?${qs}` : baseHref
  }

  return (
    <>
      <Button size="sm" variant={overdueOnly ? "outline" : "default"} asChild>
        <Link href={href(false)}>Все</Link>
      </Button>
      <Button size="sm" variant={overdueOnly ? "default" : "outline"} asChild>
        <Link href={href(true)}>Просроченные</Link>
      </Button>
    </>
  )
}
