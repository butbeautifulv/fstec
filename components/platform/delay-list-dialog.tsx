"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { notify } from "@/lib/ui/feedback"

type DelayRequest = {
  id: number
  status: string
  requestedDueAt: string
  justification: string | null
  createdAt: string
}

export function DelayListDialog({
  open,
  onOpenChange,
  measureName,
  delayRequests,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Запросы переноса — {measureName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="flex flex-col gap-3 pb-2">
            {delayRequests.map((d) => (
              <div key={d.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{d.status}</Badge>
                  <span>Новый срок: {format(new Date(d.requestedDueAt), "dd.MM.yyyy")}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Запрошено {format(new Date(d.createdAt), "dd.MM.yyyy HH:mm")}
                </div>
                {d.justification && (
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap">{d.justification}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/panel/delay-requests/${d.id}`}>Подробнее</Link>
                  </Button>
                  {d.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => reviewDelay(d.id, "approve")}>
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewDelay(d.id, "reject")}
                      >
                        Отклонить
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
