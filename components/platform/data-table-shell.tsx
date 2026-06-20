import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function DataTableShell({
  toolbar,
  children,
  className,
}: {
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {toolbar && <div className="min-h-10">{toolbar}</div>}
      <div className="rounded-md border">{children}</div>
    </div>
  )
}
