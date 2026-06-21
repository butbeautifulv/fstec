export function queueNotification(fn: () => Promise<void>) {
  void fn().catch((error) => {
    console.error("Notification failed:", error)
  })
}
