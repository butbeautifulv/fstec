import { checkRateLimitAsync } from "@/lib/public/rate-limit"
import { jsonError } from "@/lib/api/errors"

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for") ?? "local"
}

export async function assertPublicRateLimit(
  request: Request,
  token: string,
  scope: "read" | "write" = "write"
): Promise<Response | null> {
  const ip = getClientIp(request)
  const key =
    scope === "write"
      ? `public-write:${ip}:${token}`
      : `public:${ip}:${token}`
  if (!(await checkRateLimitAsync(key))) {
    return jsonError("Too many requests", 429)
  }
  return null
}
