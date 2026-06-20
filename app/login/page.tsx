import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ShieldIcon } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession, hydrateSessionRole } from "@/lib/auth/session"
import { APP_NAME } from "@/lib/ui/branding"

export default async function LoginPage() {
  const session = await hydrateSessionRole(await getSession())
  if (session.isLoggedIn) {
    redirect(session.mustChangePassword ? "/panel/change-password" : "/panel")
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldIcon className="size-4" />
          </div>
          <span className="text-center text-sm leading-snug">{APP_NAME}</span>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
