import { randomBytes } from "crypto"

export function generateLinkToken(): string {
  return randomBytes(32).toString("base64url")
}
