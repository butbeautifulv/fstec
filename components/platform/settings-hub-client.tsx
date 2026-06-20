"use client"

import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "@/components/platform/settings-nav"

export function SettingsHubClient() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Настройки"
        description="Системные параметры, учётная запись и интеграции"
      />
      <SettingsNav />
    </div>
  )
}
