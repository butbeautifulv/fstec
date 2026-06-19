import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarClockIcon } from "lucide-react"

export function PendingDelaysCard({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <Link href="/admin/delay-requests" className="block">
      <Card className="shadow-xs transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardDescription>Заявки на перенос</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">{count}</CardTitle>
          <CardAction>
            <Badge variant="destructive">Ожидают решения</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            <CalendarClockIcon className="size-4 text-muted-foreground" />
            Перейти к обработке переносов
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
