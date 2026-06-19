import Link from "next/link"

export default function PublicNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6">
      <p className="text-muted-foreground">Ссылка не найдена или отозвана</p>
      <Link href="/" className="text-sm underline">
        На главную
      </Link>
    </div>
  )
}
