import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { format } from "date-fns"

export function ItemDueStatusCard({
  dueAt,
  displayStatus,
  isOverdue,
  statusVariant,
  footer,
  children,
}: {
  dueAt: string
  displayStatus: string
  isOverdue: boolean
  statusVariant: "default" | "secondary" | "destructive"
  footer?: ReactNode
  children?: ReactNode
}) {
  return (
    <Card className={isOverdue ? "border-destructive/40 bg-destructive/5" : ""}>
      <CardHeader>
        <CardTitle className="text-base">Срок и статус</CardTitle>
        <CardDescription>Текущее состояние исполнения</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-3xl font-medium tabular-nums">
            {format(new Date(dueAt), "dd.MM.yyyy")}
          </span>
          <Badge variant={statusVariant}>{displayStatus}</Badge>
        </div>
        {children}
      </CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  )
}
