import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function PageHeaderSkeleton({
  showBack = false,
  showActions = false,
  className,
}: {
  showBack?: boolean
  showActions?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex min-h-[72px] flex-col gap-3 border-b pb-4", className)}>
      {showBack && <Skeleton className="h-4 w-24" />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        {showActions && (
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        )}
      </div>
    </div>
  )
}
