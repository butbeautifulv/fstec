import { FormSkeleton } from "@/components/shared/form-skeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import { PageContentShell } from "@/components/shared/skeletons/primitives"

export function FormPageSkeleton({
  fields = 4,
  singleCard = false,
  showBack = true,
  showActions = true,
}: {
  fields?: number
  singleCard?: boolean
  showBack?: boolean
  showActions?: boolean
}) {
  return (
    <PageContentShell>
      <PageHeaderSkeleton showBack={showBack} />
      <FormSkeleton
        fields={fields}
        singleCard={singleCard}
        showActions={showActions}
      />
    </PageContentShell>
  )
}
