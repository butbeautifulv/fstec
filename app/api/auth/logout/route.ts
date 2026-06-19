import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { handleApiError } from "@/lib/api/errors"

export async function POST() {
  try {
    const session = await getSession()
    session.destroy()
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
