import { PlatformShell } from "@/components/platform/platform-shell"

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>
}
