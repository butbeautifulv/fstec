"use client"

import { useState } from "react"
import { ShareLinkField } from "@/components/shared/share-link-field"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { reportSharePath } from "@/lib/report-links/scoped-path"
import type { DashboardScope } from "@/lib/dashboard/stats"
import { notify } from "@/lib/ui/feedback"
import { BarChart3, Share2, Trash2 } from "lucide-react"

const SCOPE_LABELS: Record<DashboardScope["type"], string> = {
  global: "Общая сводка",
  organization: "Организация",
  subdivision: "Подразделение",
}

type ActiveLink = {
  id: number
  token: string
}

export function ReportScopedShareButton({
  scope,
  initialActive,
  canManage = false,
}: {
  scope: DashboardScope
  initialActive: ActiveLink | null
  canManage?: boolean
}) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  const path = active ? reportSharePath(active.token) : null
  const scopeLabel = SCOPE_LABELS[scope.type]

  async function generate() {
    setLoading(true)
    const res = await fetch("/api/report-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    })
    setLoading(false)
    if (res.ok) {
      const link = await res.json()
      setActive({ id: link.id, token: link.token })
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
        <Button size="sm" variant="outline" disabled={loading} aria-label="Поделиться отчётом">
          <BarChart3 data-icon="inline-start" />
          <span className="hidden sm:inline">Отчёт</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,90vw)]">
        {!path ? (
          <>
            <DropdownMenuLabel>Отчёт · {scopeLabel}</DropdownMenuLabel>
            <p className="px-2 pb-2 text-xs text-muted-foreground">
              Отдельная ссылка только для среза «{scopeLabel.toLowerCase()}» — без доступа к
              остальной сводке.
            </p>
            {canManage ? (
              <DropdownMenuItem disabled={loading} onClick={() => void generate()}>
                <Share2 />
                Создать ссылку
              </DropdownMenuItem>
            ) : (
              <p className="px-2 pb-2 text-xs text-muted-foreground">
                Обратитесь к администратору для создания ссылки.
              </p>
            )}
          </>
        ) : (
          <>
            <DropdownMenuLabel>Отчёт · {scopeLabel}</DropdownMenuLabel>
            <p className="px-2 pb-1 text-xs text-muted-foreground">
              Только просмотр. Открывает сводку с выбранным срезом.
            </p>
            <div className="px-2 pb-2">
              <ShareLinkField
                path={path}
                copySuccessMessage="Ссылка на отчёт скопирована"
              />
            </div>
            {canManage ? (
              <>
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
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
