import type { ZodType } from "zod"
import { handleApiError } from "@/lib/api/errors"

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { error: Response }> {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return {
      error: handleApiError(new Error(parsed.error.issues[0]?.message ?? "Invalid input")),
    }
  }
  return { data: parsed.data }
}
