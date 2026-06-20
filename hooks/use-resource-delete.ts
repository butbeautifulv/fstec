"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { notify } from "@/lib/ui/feedback"

type UseResourceDeleteOptions = {
  url: (id: number) => string
  onRemoved: (id: number) => void
  successMessage: string
  errorMessage?: string
}

export function useResourceDelete({
  url,
  onRemoved,
  successMessage,
  errorMessage = "Ошибка удаления",
}: UseResourceDeleteOptions<T>) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const requestDelete = useCallback((id: number) => {
    setDeleteId(id)
  }, [])

  const cancelDelete = useCallback(() => {
    setDeleteId(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (deleteId == null) return
    setDeleting(true)
    const res = await fetch(url(deleteId), { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      onRemoved(deleteId)
      setDeleteId(null)
      router.refresh()
      notify.success(successMessage)
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? errorMessage)
    }
  }, [deleteId, url, onRemoved, router, successMessage, errorMessage])

  return {
    deleteId,
    deleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
