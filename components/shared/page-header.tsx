import Link from "next/link"
import type { ReactNode } from "react"
import { TypographyH2, TypographyMuted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Назад",
  className,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {backHref && (
        <Link href={backHref} className="text-sm text-muted-foreground hover:underline">
          ← {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <TypographyH2>{title}</TypographyH2>
          {description && <TypographyMuted>{description}</TypographyMuted>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
