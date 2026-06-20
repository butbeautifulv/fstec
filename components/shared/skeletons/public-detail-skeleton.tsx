import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import { PageContentShell } from "@/components/shared/skeletons/primitives"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PublicDetailSkeleton() {
  return (
    <PageContentShell>
      <PageHeaderSkeleton showBack />
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24 max-w-full" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28 max-w-full" />
            <Skeleton className="h-4 w-36 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    </PageContentShell>
  )
}
