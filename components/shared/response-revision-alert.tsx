"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MotionFadeIn } from "@/components/motion"

export function ResponseRevisionAlert({
  reviewNote,
  title = "Отчёт не принят",
}: {
  reviewNote: string
  title?: string
}) {
  return (
    <MotionFadeIn variant="fade">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="whitespace-pre-wrap">{reviewNote}</AlertDescription>
      </Alert>
    </MotionFadeIn>
  )
}
