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
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <TypographyH2>{title}</TypographyH2>
          {description && <TypographyMuted>{description}</TypographyMuted>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
