import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import { PageContentShell } from "@/components/shared/skeletons/primitives"
import { Skeleton } from "@/components/ui/skeleton"

export function SettingsHubSkeleton() {
  return (
    <PageContentShell>
      <PageHeaderSkeleton />
      <div className="flex min-w-0 flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex min-w-0 items-center justify-between gap-3 rounded-md border p-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="size-5 shrink-0 rounded" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32 max-w-full" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
            </div>
            <Skeleton className="size-4 shrink-0" />
          </div>
        ))}
      </div>
    </PageContentShell>
  )
}
