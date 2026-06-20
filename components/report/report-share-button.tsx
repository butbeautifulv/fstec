"use client"

import { useState } from "react"
import { ShareLinkActions } from "@/components/shared/share-link-actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { notify } from "@/lib/ui/feedback"
import { Share2, Trash2 } from "lucide-react"

type LinkRow = {
  id: number
  token: string
  revokedAt: string | null
}

export function ReportShareButton({
  initialActive,
}: {
  initialActive: LinkRow | null
}) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  const path = active ? `/report/${active.token}` : null

  async function generate() {
    setLoading(true)
    const res = await fetch("/api/report-links", { method: "POST" })
    setLoading(false)
    if (res.ok) {
      const link = await res.json()
      setActive(link)
      notify.success("Ссылка на отчёт создана")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось создать ссылку")
    }
  }

  async function revoke() {
    if (!active) return
    setLoading(true)
    const res = await fetch(`/api/report-links?linkId=${active.id}`, { method: "DELETE" })
    setLoading(false)
    if (res.ok) {
      setActive(null)
      notify.success("Ссылка на отчёт отозвана")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось отозвать ссылку")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={loading} aria-label="Поделиться">
          <Share2 data-icon="inline-start" />
          <span className="hidden sm:inline">Поделиться</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {!active ? (
          <>
            <DropdownMenuLabel>Ссылка на отчёт</DropdownMenuLabel>
            <DropdownMenuItem disabled={loading} onClick={() => void generate()}>
              <Share2 />
              Создать ссылку
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Ссылка на отчёт</DropdownMenuLabel>
            <p className="px-2 pb-1 text-xs text-muted-foreground">
              Публичная сводка для руководителя
            </p>
            <p className="truncate px-2 pb-2 font-mono text-xs text-muted-foreground">
              /report/{active.token.slice(0, 16)}…
            </p>
            <div className="px-2 pb-2">
              <ShareLinkActions
                path={path!}
                copySuccessMessage="Ссылка на отчёт скопирована"
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={loading} onClick={() => void generate()}>
              <Share2 />
              Новая ссылка
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={loading}
              onClick={() => void revoke()}
            >
              <Trash2 />
              Отозвать
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
