import { getCronSecret } from "@/lib/email/config"

export function assertCronSecret(request: Request) {
  const secret = getCronSecret()
  if (!secret) throw new Error("FORBIDDEN")

  const authHeader = request.headers.get("authorization")
  const headerSecret =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : request.headers.get("x-cron-secret")

  if (headerSecret !== secret) throw new Error("FORBIDDEN")
}
