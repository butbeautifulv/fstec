import { redirect } from "next/navigation"

type Props = { searchParams: Promise<{ next?: string }> }

export default async function AdminLoginRedirectPage({ searchParams }: Props) {
  const params = await searchParams
  if (params.next) {
    redirect(`/login?next=${encodeURIComponent(params.next)}`)
  }
  redirect("/login")
}
