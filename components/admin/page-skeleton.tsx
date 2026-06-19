import { DataTableShell } from "@/components/admin/data-table-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function PageSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-[72px] flex-col gap-3 border-b pb-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <DataTableShell
        toolbar={
          <div className="flex gap-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
        }
      >
        <TableSkeleton columns={columns} rows={10} />
      </DataTableShell>
    </div>
  )
}
