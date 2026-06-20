import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ResponseRevisionAlert({
  reviewNote,
  title = "Отчёт не принят",
}: {
  reviewNote: string
  title?: string
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="whitespace-pre-wrap">{reviewNote}</AlertDescription>
    </Alert>
  )
}
