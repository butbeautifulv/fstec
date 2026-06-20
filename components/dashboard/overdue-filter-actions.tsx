import Link from "next/link"
import { Button } from "@/components/ui/button"

export function OverdueFilterActions({
  baseHref,
  overdueOnly,
}: {
  baseHref: string
  overdueOnly: boolean
}) {
  return (
    <>
      <Button size="sm" variant={overdueOnly ? "outline" : "default"} asChild>
        <Link href={baseHref}>Все</Link>
      </Button>
      <Button size="sm" variant={overdueOnly ? "default" : "outline"} asChild>
        <Link href={`${baseHref}?overdue=1`}>Просроченные</Link>
      </Button>
    </>
  )
}
