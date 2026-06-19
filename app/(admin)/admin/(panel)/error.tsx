"use client"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <p className="text-sm text-destructive">{error.message}</p>
      <button className="text-sm underline" onClick={reset}>
        Повторить
      </button>
    </div>
  )
}
