"use client"

import Link from "next/link"
import { MotionFadeIn } from "@/components/motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function PublicReportsRevisionBanner({
  token,
  count,
}: {
  token: string
  count: number
}) {
  if (count <= 0) return null

  const title =
    count === 1
      ? "1 отчёт возвращён на доработку"
      : `${count} отчётов возвращены на доработку`

  return (
    <MotionFadeIn>
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-2">
          <span>Исправьте замечания ревьюера и отправьте отчёты повторно.</span>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/p/${token}/reports?status=REJECTED`}>
              Показать требующие доработки
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    </MotionFadeIn>
  )
}
