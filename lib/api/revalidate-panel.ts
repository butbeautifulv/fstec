import { revalidatePath } from "next/cache"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"

export async function revalidatePanelDashboard() {
  await invalidateDashboardOnMutation()
  revalidatePath("/panel")
}

export async function revalidatePanelOrder(orderId?: number) {
  await revalidatePanelDashboard()
  revalidatePath("/panel/orders")
  if (orderId != null) {
    revalidatePath(`/panel/orders/${orderId}`)
  }
}

export type RevalidatePanelOrderMutationOptions = {
  responses?: boolean
  delays?: boolean
  responseId?: number
}

export async function revalidatePanelOrderMutation(
  orderId?: number,
  options?: RevalidatePanelOrderMutationOptions
) {
  await revalidatePanelOrder(orderId)
  if (options?.responses) {
    revalidatePanelResponses()
    if (options.responseId != null) {
      revalidatePath(`/panel/responses/${options.responseId}`)
    }
  }
  if (options?.delays) {
    revalidatePanelDelayRequests()
  }
}

export async function revalidatePanelUsers(userId?: number) {
  revalidatePath("/panel/settings/users")
  if (userId != null) {
    revalidatePath(`/panel/settings/users/${userId}/edit`)
  }
}

export function revalidatePanelSettings() {
  revalidatePath("/panel/settings")
  revalidatePath("/panel/settings/general")
}

export function revalidatePanelResponses() {
  revalidatePath("/panel/responses")
}

export function revalidatePanelDelayRequests() {
  revalidatePath("/panel/delay-requests")
}

export function revalidatePanelMeasures(measureId?: number) {
  revalidatePath("/panel/measures")
  if (measureId != null) {
    revalidatePath(`/panel/measures/${measureId}/edit`)
  }
}

export function revalidatePanelOrganizations(organizationId?: number) {
  revalidatePath("/panel/organizations")
  if (organizationId != null) {
    revalidatePath(`/panel/organizations/${organizationId}`)
  }
}
