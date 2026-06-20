import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Field, FieldGroup } from "@/components/ui/field"
import {
  FormCardGrid,
  FormCardLayout,
} from "@/components/shared/form-card-grid"
import { FormActionsSkeleton } from "@/components/shared/skeletons/primitives"

function CardSkeleton({ fields }: { fields: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32 max-w-full" />
        <Skeleton className="h-4 w-48 max-w-full" />
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {Array.from({ length: fields }).map((_, i) => (
            <Field key={i}>
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </Field>
          ))}
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export function FormSkeleton({
  fields = 4,
  singleCard = false,
  showActions = true,
}: {
  fields?: number
  singleCard?: boolean
  showActions?: boolean
}) {
  const leftFields = singleCard ? fields : Math.ceil(fields / 2)
  const rightFields = singleCard ? 0 : Math.floor(fields / 2)

  const grid = (
    <FormCardGrid singleCard={singleCard}>
      <CardSkeleton fields={leftFields} />
      {rightFields > 0 ? <CardSkeleton fields={rightFields} /> : null}
    </FormCardGrid>
  )

  const actions = showActions ? <FormActionsSkeleton /> : null

  if (singleCard) {
    return (
      <FormCardLayout singleCard actions={actions}>
        <CardSkeleton fields={leftFields} />
      </FormCardLayout>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {grid}
      {actions}
    </div>
  )
}
