import {
  DASHBOARD_CARD_CHART_HEIGHT_CLASS,
  DASHBOARD_CARD_LEGEND_HEIGHT_CLASS,
} from "@/components/dashboard/chart-card-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const BAR_HEIGHTS = ["h-[45%]", "h-[70%]", "h-[55%]", "h-[85%]", "h-[40%]", "h-[62%]"]

export function DashboardChartBodySkeleton({
  className,
  variant = "bar",
}: {
  className?: string
  variant?: "bar" | "block"
}) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div
        className={cn(
          "flex shrink-0 items-end justify-center gap-2 overflow-hidden px-4",
          DASHBOARD_CARD_CHART_HEIGHT_CLASS
        )}
      >
        {variant === "bar" ? (
          BAR_HEIGHTS.map((heightClass, index) => (
            <Skeleton
              key={index}
              className={cn("w-full max-w-8 flex-1 rounded-t-sm", heightClass)}
            />
          ))
        ) : (
          <Skeleton
            className={cn(
              "w-full shrink-0 rounded-md",
              DASHBOARD_CARD_CHART_HEIGHT_CLASS
            )}
          />
        )}
      </div>
      <div
        className={cn(
          "shrink-0 overflow-hidden border-t pt-2",
          DASHBOARD_CARD_LEGEND_HEIGHT_CLASS
        )}
      >
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-full max-w-[6.5rem]" />
          ))}
        </div>
      </div>
    </div>
  )
}
