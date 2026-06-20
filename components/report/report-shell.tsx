"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { OverflowText } from "@/components/shared/overflow-text"
import { Badge } from "@/components/ui/badge"
import { ShieldIcon } from "lucide-react"

export function ReportShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4 md:px-6">
        <ShieldIcon className="size-5 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col">
          <OverflowText className="w-full min-w-0 text-sm font-medium">
            Сводка по организациям
          </OverflowText>
          <OverflowText className="w-full min-w-0 text-xs text-muted-foreground">
            Отчётная ссылка
          </OverflowText>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Только просмотр
        </Badge>
        <ThemeToggle />
      </header>
      <main className="@container/main flex min-w-0 flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {children}
      </main>
    </div>
  )
}
