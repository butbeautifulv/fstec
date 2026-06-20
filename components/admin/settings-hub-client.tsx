"use client"

import { PageHeader } from "@/components/admin/page-header"
import { SettingsNav } from "@/components/admin/settings-nav"

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
