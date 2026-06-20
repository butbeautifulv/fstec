"use client"

import type { AuthProviderStatus } from "@/lib/auth/providers/types"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

type AuthProvidersPayload = {
  activeProvider: string
  activeStatus: AuthProviderStatus
  providers: AuthProviderStatus[]
}

export function AuthProviderCard({ data }: { data: AuthProvidersPayload }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Аутентификация</CardTitle>
        <CardDescription>
          Текущий провайдер и заготовки для Active Directory / Keycloak
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Активный провайдер:</span>
          <Badge variant="secondary">{data.activeStatus.label}</Badge>
          <Badge variant={data.activeStatus.configured ? "default" : "outline"}>
            {data.activeStatus.configured ? "Настроен" : "Stub"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{data.activeStatus.message}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {data.providers
            .filter((p) => p.id !== "local")
            .map((provider) => (
              <div key={provider.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-medium">{provider.label}</span>
                  <Badge variant="outline">Stub</Badge>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{provider.message}</p>
                {provider.requiredEnv.length > 0 && (
                  <p className="mb-3 font-mono text-xs text-muted-foreground">
                    {provider.requiredEnv.join(", ")}
                  </p>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" disabled>
                      Настроить
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Будет доступно в следующей версии</TooltipContent>
                </Tooltip>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
