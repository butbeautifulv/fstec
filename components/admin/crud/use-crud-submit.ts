"use client"

import { useCallback, useState } from "react"

type SubmitResult = { ok: true } | { ok: false; error: string }

export function useCrudSubmit(submitFn: () => Promise<SubmitResult>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = useCallback(async () => {
    setLoading(true)
    setError("")
    const result = await submitFn()
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
    }
  }, [submitFn])

  return { loading, error, submit, setError }
}

export async function parseApiError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null)
  return data?.error ?? fallback
}
