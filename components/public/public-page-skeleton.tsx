import { DataTableShell } from "@/components/admin/data-table-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function PublicPageSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 border-b pb-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <DataTableShell
        toolbar={
          <div className="flex gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-40" />
          </div>
        }
      >
        <TableSkeleton columns={5} rows={8} />
      </DataTableShell>
    </div>
  )
}
