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
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {toolbar && <div className="min-h-10 min-w-0">{toolbar}</div>}
      <div className="min-w-0 overflow-x-auto rounded-md border">{children}</div>
    </div>
  )
}
