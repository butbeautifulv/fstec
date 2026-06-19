import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { APP_NAME } from "@/lib/ui/branding"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin", "cyrillic"], variable: "--font-sans" })

const geistMono = Geist_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: APP_NAME,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn("antialiased", geist.variable, geistMono.variable, "font-sans")}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster closeButton position="bottom-right" toastOptions={{ duration: 4000 }} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
