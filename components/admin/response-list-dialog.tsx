"use client"

import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TypographyMuted } from "@/components/ui/typography"

type Response = {
  id: number
  result: string
  commentary: string | null
  submittedByLabel: string | null
  submittedAt: string
}

export function ResponseListDialog({
  open,
  onOpenChange,
  measureName,
  subdivisionName,
  responses,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  measureName: string
  subdivisionName?: string | null
  responses: Response[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Отчёты о выполнении — {measureName}</DialogTitle>
          {subdivisionName && (
            <TypographyMuted>Подразделение: {subdivisionName}</TypographyMuted>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="flex flex-col gap-3 pb-2">
            {responses.map((r) => (
              <div key={r.id} className="rounded-lg border p-4 text-sm">
                <div className="font-medium">
                  {r.submittedByLabel ?? "Исполнитель не указан"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(r.submittedAt), "dd.MM.yyyy HH:mm")}
                </div>
                <p className="mt-2 whitespace-pre-wrap">{r.result}</p>
                {r.commentary && (
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {r.commentary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
