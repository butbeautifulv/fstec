import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function PageContentShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 md:gap-6", className)}>
      {children}
    </div>
  )
}

export function TableToolbarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-3", className)}>
      <Skeleton className="h-9 w-full max-w-sm" />
      <Skeleton className="h-9 w-28 shrink-0" />
      <Skeleton className="h-9 w-24 shrink-0" />
    </div>
  )
}

export function StatCardsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2 @4xl/main:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24 max-w-full" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function ChartsGridSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className={cn(
            i === 2 && "min-w-0 @2xl/main:col-span-2 @5xl/main:col-span-1"
          )}
        >
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FormActionsSkeleton() {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="hidden min-h-5 sm:block" aria-hidden />
      <div className="flex flex-wrap gap-2 sm:ml-auto">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}
