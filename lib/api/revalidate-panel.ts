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
