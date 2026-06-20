import Link from "next/link"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { ClipboardListIcon } from "lucide-react"

export function ItemDetailHeaderActions({
  code,
  orderTitle,
  orderHref,
}: {
  code: string | null
  orderTitle: string
  orderHref?: string
}) {
  const orderBadge: ReactNode = orderHref ? (
    <Badge variant="outline" asChild>
      <Link href={orderHref}>
        <ClipboardListIcon data-icon="inline-start" />
        {orderTitle}
      </Link>
    </Badge>
  ) : (
    <Badge variant="outline">
      <ClipboardListIcon data-icon="inline-start" />
      {orderTitle}
    </Badge>
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      {code && (
        <Badge variant="secondary" className="font-mono">
          {code}
        </Badge>
      )}
      {orderBadge}
    </div>
  )
}
