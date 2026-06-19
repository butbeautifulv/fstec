import { NextResponse } from "next/server"
import { labels } from "@/lib/ui/branding"

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401)
    }
    if (error.message === "NOT_FOUND") {
      return jsonError("Not found", 404)
    }
    if (error.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403)
    }
    if (error.message === "MEASURE_IN_USE") {
      return jsonError("Мера используется в поручениях и не может быть удалена", 409)
    }
    if (error.message === "ORG_HAS_ORDERS") {
      return jsonError(`У ${labels.orgGenitive} есть поручения — сначала удалите их`, 409)
    }
  }
  console.error(error)
  return jsonError("Internal server error", 500)
}
