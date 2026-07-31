import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createUser,
  deleteUser,
  fetchRoles,
  fetchUsers,
  updateUser,
  type RoleDto,
  type UserDto,
  type UserFormDto,
} from "@/api/users"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function emptyForm(): UserFormDto {
  return {
    kullaniciAdi: "",
    adSoyad: "",
    email: "",
    aktif: true,
    rolIds: [],
  }
}

function formFromUser(user: UserDto): UserFormDto {
  return {
    kullaniciAdi: user.kullaniciAdi,
    adSoyad: user.adSoyad,
    email: user.email ?? "",
    aktif: user.aktif,
    rolIds: user.roller.map((r) => r.id),
  }
}

export function YonetimPaneliPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Yonetim Paneli")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UserFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null)

  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", query],
    queryFn: () => fetchUsers(query || undefined),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  })

  const selected = users.find((u) => u.id === selectedId) ?? null

  // KPI strip - derived client-side from the already-fetched list, no
  // extra API calls (see data-visualization.md). List size is small
  // (dozens of users at most) so no chart is added, just the counts.
  const aktifSayisi = useMemo(() => users.filter((u) => u.aktif).length, [users])
  const pasifSayisi = users.length - aktifSayisi

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(user: UserDto) {
    setEditingId(user.id)
    setForm(formFromUser(user))
    setFormOpen(true)
  }

  function toggleRole(roleId: number) {
    setForm((prev) => ({
      ...prev,
      rolIds: prev.rolIds.includes(roleId)
        ? prev.rolIds.filter((id) => id !== roleId)
        : [...prev.rolIds, roleId],
    }))
  }

  const saveMutation = useMutation({
    mutationFn: (body: UserFormDto) =>
      editingId != null ? updateUser(editingId, body) : createUser(body),
    onSuccess: () => {
      toast.success("Kullanici kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      toast.success("Kullanici silindi.")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setDeleteTarget(null)
      setSelectedId(null)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Silme sirasinda hata olustu"))
      setDeleteTarget(null)
    },
  })

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: search + users table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            <KpiCard label="Toplam Kullanici" value={users.length.toString()} />
            <KpiCard label="Aktif" value={aktifSayisi.toString()} tone="success" />
            <KpiCard label="Pasif" value={pasifSayisi.toString()} tone="warning" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Input
              placeholder="Kullanici Adi / Ad Soyad / E-Posta ile ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={openCreate}>Yeni Kullanici</Button>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanici Adi</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-Posta</TableHead>
                  <TableHead>Roller</TableHead>
                  <TableHead className="w-20 text-center">Aktif</TableHead>
                  <TableHead className="w-40 text-right">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-foreground-muted">
                      Yukleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {users.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    data-state={row.id === selectedId ? "selected" : undefined}
                    className={
                      row.id === selectedId
                        ? "cursor-pointer bg-accent-muted/60"
                        : "cursor-pointer"
                    }
                  >
                    <TableCell className="font-mono">{row.kullaniciAdi}</TableCell>
                    <TableCell>{row.adSoyad}</TableCell>
                    <TableCell className="text-foreground-muted">{row.email ?? "-"}</TableCell>
                    <TableCell className="text-xs text-foreground-muted">
                      {row.roller.map((r) => r.rolAdi).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          row.aktif
                            ? "inline-block h-2.5 w-2.5 rounded-full bg-success"
                            : "inline-block h-2.5 w-2.5 rounded-full bg-foreground-faint"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                          Duzenle
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
                          Sil
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right column: selected user detail */}
      <aside className="hidden w-96 shrink-0 flex-col bg-surface lg:flex">
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir kullanici secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Kullanici Adi</p>
              <p className="font-mono text-lg font-semibold">{selected.kullaniciAdi}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.adSoyad}</p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={
                    selected.aktif
                      ? "inline-block h-2 w-2 rounded-full bg-success"
                      : "inline-block h-2 w-2 rounded-full bg-foreground-faint"
                  }
                />
                <span className="text-xs text-foreground-muted">
                  {selected.aktif ? "Aktif" : "Pasif"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6 px-6 py-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Iletisim
                </p>
                <DetailRow label="E-Posta" value={selected.email ?? "-"} />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Roller
                </p>
                {selected.roller.length === 0 && (
                  <p className="text-sm text-foreground-muted">Rol atanmamis</p>
                )}
                {selected.roller.map((role) => (
                  <div key={role.id} className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{role.rolAdi}</span>
                    {role.aciklama && (
                      <span className="text-xs text-foreground-muted">{role.aciklama}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Kayit Bilgisi
                </p>
                <DetailRow
                  label="Olusturma Tarihi"
                  value={new Date(selected.olusturmaTarihi).toLocaleString("tr-TR")}
                />
              </div>
            </div>

            <div className="mt-auto flex gap-2 border-t border-border px-6 py-4">
              <Button className="flex-1" variant="outline" onClick={() => openEdit(selected)}>
                Duzenle
              </Button>
              <Button className="flex-1" variant="destructive" onClick={() => setDeleteTarget(selected)}>
                Sil
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Kullaniciyi Duzenle" : "Yeni Kullanici"}</DialogTitle>
            <DialogDescription>
              Kullanici bilgilerini ve rollerini girin. Kullanici Adi benzersiz olmalidir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kullanici Adi">
              <Input
                value={form.kullaniciAdi}
                onChange={(e) => setForm({ ...form, kullaniciAdi: e.target.value })}
              />
            </Field>
            <Field label="Ad Soyad">
              <Input
                value={form.adSoyad}
                onChange={(e) => setForm({ ...form, adSoyad: e.target.value })}
              />
            </Field>
            <Field label="E-Posta" span2>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Durum">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.aktif}
                  onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                Aktif
              </label>
            </Field>
            <Field label="Roller" span2>
              <div className="flex flex-col gap-1.5 rounded-md border border-border p-2">
                {roles.map((role: RoleDto) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.rolIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                    <span>{role.rolAdi}</span>
                    {role.aciklama && (
                      <span className="text-xs text-foreground-muted">- {role.aciklama}</span>
                    )}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Vazgec
            </Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanici Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.adSoyad} (${deleteTarget.kullaniciAdi}) kullanicisini silmek istediginize emin misiniz?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Vazgec</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({
  label,
  children,
  span2,
}: {
  label: string
  children: React.ReactNode
  span2?: boolean
}) {
  return (
    <div className={span2 ? "col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
      <Label className="text-xs text-foreground-muted">{label}</Label>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
