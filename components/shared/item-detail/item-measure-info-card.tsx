import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ItemMeasureInfoCard({
  description,
  organizationName,
  subdivisionName,
  className,
}: {
  description: string | null
  organizationName: string
  subdivisionName: string | null
  className?: string
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">О мере</CardTitle>
        <CardDescription>Описание и контекст поручения</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {description ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Описание меры не указано администратором.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{organizationName}</Badge>
          {subdivisionName && <Badge variant="outline">{subdivisionName}</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}
