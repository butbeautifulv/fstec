"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAdminBreadcrumbLabel } from "@/components/admin/admin-breadcrumb"
import { ConfirmDeleteAlert } from "@/components/admin/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/admin/crud/empty-table-state"
import { SubdivisionDialog } from "@/components/admin/crud/subdivision-dialog"
import { TableRowActions } from "@/components/admin/crud/table-row-actions"
import { DataTableShell } from "@/components/admin/data-table-shell"
import { OrgLinksPanel } from "@/components/admin/org-links-panel"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import { Pencil, Plus, Trash2 } from "lucide-react"

type Subdivision = { id: number; name: string }

type LinkRow = {
  id: number
  token: string
  revokedAt: string | null
  subdivisionId: number | null
  subdivision: { id: number; name: string } | null
}

export function OrgDetailClient({
  organizationId,
  organizationName,
  initialSubdivisions,
  initialLinks,
  defaultTab = "subdivisions",
}: {
  organizationId: number
  organizationName: string
  initialSubdivisions: Subdivision[]
  initialLinks: LinkRow[]
  defaultTab?: "subdivisions" | "links"
}) {
  const router = useRouter()
  const [subdivisions, setSubdivisions] = useState(initialSubdivisions)
  const [dialogSub, setDialogSub] = useState<Subdivision | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const dialogOpen = dialogSub !== undefined

  useAdminBreadcrumbLabel(organizationName)

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/subdivisions/${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      setSubdivisions((prev) => prev.filter((s) => s.id !== deleteId))
      setDeleteId(null)
      router.refresh()
      notify.success("Подразделение удалено")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось удалить подразделение")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={organizationName}
        description="Подразделения и ссылки для исполнителей"
        backHref="/admin/organizations"
        backLabel={labels.orgs}
      />

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="subdivisions">Подразделения</TabsTrigger>
          <TabsTrigger value="links">Ссылки</TabsTrigger>
        </TabsList>

        <TabsContent value="subdivisions" className="mt-6 flex flex-col gap-6">
          <div className="flex justify-end">
            <Button onClick={() => setDialogSub(null)}>
              <Plus data-icon="inline-start" />
              Добавить подразделение
            </Button>
          </div>

          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {subdivisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <EmptyTableState
                        title="Нет подразделений"
                        description="Добавьте подразделения для разграничения доступа"
                      >
                        <Button size="sm" onClick={() => setDialogSub(null)}>
                          <Plus data-icon="inline-start" />
                          Добавить подразделение
                        </Button>
                      </EmptyTableState>
                    </TableCell>
                  </TableRow>
                ) : (
                  subdivisions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>
                        <TableRowActions
                          actions={[
                            {
                              label: "Изменить",
                              icon: <Pencil data-icon="inline-start" />,
                              onClick: () => setDialogSub(s),
                            },
                            {
                              label: "Удалить",
                              icon: <Trash2 data-icon="inline-start" />,
                              destructive: true,
                              onClick: () => setDeleteId(s.id),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <OrgLinksPanel
            organizationId={organizationId}
            organizationName={organizationName}
            subdivisions={subdivisions}
            initialLinks={initialLinks}
            embedded
          />
        </TabsContent>
      </Tabs>

      <SubdivisionDialog
        organizationId={organizationId}
        subdivision={dialogSub}
        open={dialogOpen}
        onOpenChange={(o) => !o && setDialogSub(undefined)}
        onSaved={(saved) => {
          if (dialogSub) {
            setSubdivisions((prev) =>
              prev.map((s) => (s.id === saved.id ? saved : s))
            )
          } else {
            setSubdivisions((prev) => [...prev, saved])
          }
          setDialogSub(undefined)
          router.refresh()
        }}
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить подразделение?"
        description={`Подразделение будет удалено из ${labels.orgGenitive}.`}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
