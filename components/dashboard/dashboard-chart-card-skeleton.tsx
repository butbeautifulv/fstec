import {
  DASHBOARD_CARD_CHART_HEIGHT_CLASS,
  DASHBOARD_CARD_LEGEND_HEIGHT_CLASS,
} from "@/components/dashboard/chart-card-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function DashboardChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <Skeleton className="h-5 w-36 max-w-full" />
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        <div className="flex h-full flex-col">
          <Skeleton
            className={cn(
              "w-full shrink-0 rounded-md",
              DASHBOARD_CARD_CHART_HEIGHT_CLASS
            )}
          />
          <div
            className={cn(
              "shrink-0 overflow-hidden border-t pt-2",
              DASHBOARD_CARD_LEGEND_HEIGHT_CLASS
            )}
          >
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-3 w-full max-w-[6.5rem]"
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardChartsGridSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <DashboardChartCardSkeleton
          key={index}
          className={cn(
            index === 2 && "min-w-0 @2xl/main:col-span-2 @5xl/main:col-span-1"
          )}
        />
      ))}
    </div>
  )
}
