import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import { PageContentShell } from "@/components/shared/skeletons/primitives"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DetailCardsSkeleton({ showActions = true }: { showActions?: boolean }) {
  return (
    <PageContentShell>
      <PageHeaderSkeleton showBack showActions={showActions} />
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32 max-w-full" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-28 max-w-[45%]" />
                <Skeleton className="h-4 w-24 max-w-[45%]" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28 max-w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </PageContentShell>
  )
}
