import { Skeleton } from "@/components/ui/skeleton"
import { Field, FieldGroup } from "@/components/ui/field"

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <FieldGroup className="max-w-lg">
      {Array.from({ length: fields }).map((_, i) => (
        <Field key={i}>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </Field>
      ))}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
    </FieldGroup>
  )
}
