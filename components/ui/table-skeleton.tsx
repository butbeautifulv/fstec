import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

function TableSkeletonRow({ columns }: { columns: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i} className="h-10">
          <Skeleton className="h-3 w-full max-w-[120px]" />
        </TableCell>
      ))}
    </TableRow>
  )
}

export function TableSkeleton({
  columns = 5,
  rows = 10,
  headers,
}: {
  columns?: number
  rows?: number
  headers?: string[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers
            ? headers.map((h) => <TableHead key={h}>{h}</TableHead>)
            : Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-3 w-16" />
                </TableHead>
              ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, idx) => (
          <TableSkeletonRow key={idx} columns={headers?.length ?? columns} />
        ))}
      </TableBody>
    </Table>
  )
}
