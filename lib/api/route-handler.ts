export function parseRouteId(raw: string): number {
  const id = Number(raw)
  if (Number.isNaN(id)) throw new Error("NOT_FOUND")
  return id
}

export function parseOptionalIntParam(
  raw: string | string[] | undefined
): number | undefined {
  if (raw == null || Array.isArray(raw)) return undefined
  const n = Number(raw)
  return Number.isNaN(n) ? undefined : n
}

export function cronRoute(handler: () => Promise<unknown>) {
  return async (request: Request) => {
    const { handleApiError, jsonOk } = await import("@/lib/api/errors")
    const { assertCronSecret } = await import("@/lib/cron/auth")
    try {
      assertCronSecret(request)
      const result = await handler()
      return jsonOk(result)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
