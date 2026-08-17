import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createInstrumentGroup,
  deleteInstrumentGroup,
  fetchInstrumentGroups,
  updateInstrumentGroup,
  type InstrumentGroupDto,
  type InstrumentGroupFormDto,
} from "@/api/instrumentGroups"
import { fetchInstruments } from "@/api/instruments"
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
import { DetailAside } from "@/components/layout/DetailAside"

function emptyForm(): InstrumentGroupFormDto {
  return { grupKodu: "", aciklama: "", aktif: true, instrumentIds: [] }
}

function formFromGroup(group: InstrumentGroupDto): InstrumentGroupFormDto {
  return {
    grupKodu: group.grupKodu,
    aciklama: group.aciklama ?? "",
    aktif: group.aktif,
    instrumentIds: group.uyeler.map((u) => u.id),
  }
}

/**
 * "Hisse Grubu Tanimlama" (hisse-grubu-tanimlama.zul / HisseGrubuViewModel).
 * InstrumentGroup CRUD with a many-to-many instrument member picker
 * (checkbox list, matching YonetimPaneliPage's role-selection pattern -
 * shadcn Checkbox is not installed yet, so native inputs are used).
 */
export function HisseGrubuTanimlamaPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Hisse Grubu Tanimlama")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<InstrumentGroupFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<InstrumentGroupDto | null>(null)
  const [memberQuery, setMemberQuery] = useState("")

  const queryClient = useQueryClient()

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["instrument-groups", query],
    queryFn: () => fetchInstrumentGroups(query || undefined),
  })

  const { data: allInstruments = [] } = useQuery({
    queryKey: ["instruments", undefined, undefined],
    queryFn: () => fetchInstruments(),
  })

  const selected = groups.find((g) => g.id === selectedId) ?? null

  const aktifSayisi = useMemo(() => groups.filter((g) => g.aktif).length, [groups])

  const filteredInstruments = useMemo(() => {
    if (!memberQuery.trim()) return allInstruments
    const q = memberQuery.trim().toLowerCase()
    return allInstruments.filter(
      (i) => i.sembol.toLowerCase().includes(q) || i.ad.toLowerCase().includes(q)
    )
  }, [allInstruments, memberQuery])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setMemberQuery("")
    setFormOpen(true)
  }

  function openEdit(group: InstrumentGroupDto) {
    setEditingId(group.id)
    setForm(formFromGroup(group))
    setMemberQuery("")
    setFormOpen(true)
  }

  function toggleInstrument(id: number) {
    setForm((prev) => ({
      ...prev,
      instrumentIds: prev.instrumentIds.includes(id)
        ? prev.instrumentIds.filter((i) => i !== id)
        : [...prev.instrumentIds, id],
    }))
  }

  const saveMutation = useMutation({
    mutationFn: (body: InstrumentGroupFormDto) =>
      editingId != null ? updateInstrumentGroup(editingId, body) : createInstrumentGroup(body),
    onSuccess: () => {
      toast.success("Grup kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["instrument-groups"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteInstrumentGroup(id),
    onSuccess: () => {
      toast.success("Grup silindi.")
      queryClient.invalidateQueries({ queryKey: ["instrument-groups"] })
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
      {/* Middle column: search + groups table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
            <KpiCard label="Toplam Grup" value={groups.length.toString()} />
            <KpiCard label="Aktif" value={aktifSayisi.toString()} tone="success" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Input
              placeholder="Grup Kodu / Aciklama ile ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={openCreate}>Yeni Grup</Button>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Grup Kodu</TableHead>
                  <TableHead>Aciklama</TableHead>
                  <TableHead>Uyeler</TableHead>
                  <TableHead className="w-20 text-center">Aktif</TableHead>
                  <TableHead className="w-40 text-right">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                      Yukleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {groups.map((row) => (
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
                    <TableCell className="font-mono font-medium">{row.grupKodu}</TableCell>
                    <TableCell className="text-foreground-muted">{row.aciklama ?? "-"}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-foreground-muted">
                      {row.uyeler.map((u) => u.sembol).join(", ") || "-"}
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

      {/* Right column: selected group detail */}
      <DetailAside>
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir grup secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Grup Kodu</p>
              <p className="font-mono text-lg font-semibold">{selected.grupKodu}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.aciklama ?? "-"}</p>
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

            <div className="flex flex-col gap-2 px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Uye Enstrumanlar ({selected.uyeler.length})
              </p>
              {selected.uyeler.length === 0 && (
                <p className="text-sm text-foreground-muted">Uye enstruman yok</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {selected.uyeler.map((u) => (
                  <span
                    key={u.id}
                    className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs"
                  >
                    {u.sembol}
                  </span>
                ))}
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
      </DetailAside>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Grubu Duzenle" : "Yeni Grup"}</DialogTitle>
            <DialogDescription>
              Grup bilgilerini ve uye enstrumanlari secin. Grup Kodu benzersiz olmalidir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Grup Kodu">
              <Input
                value={form.grupKodu}
                onChange={(e) => setForm({ ...form, grupKodu: e.target.value })}
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
            <Field label="Aciklama" span2>
              <Input
                value={form.aciklama}
                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              />
            </Field>
            <Field label={`Uye Enstrumanlar (${form.instrumentIds.length} secili)`} span2>
              <Input
                placeholder="Sembol / Ad ile filtrele..."
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                className="mb-1"
              />
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
                {filteredInstruments.length === 0 && (
                  <p className="py-4 text-center text-sm text-foreground-muted">
                    Enstruman bulunamadi
                  </p>
                )}
                {filteredInstruments.map((instrument) => (
                  <label key={instrument.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.instrumentIds.includes(instrument.id)}
                      onChange={() => toggleInstrument(instrument.id)}
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                    <span className="font-mono">{instrument.sembol}</span>
                    <span className="text-xs text-foreground-muted">- {instrument.ad}</span>
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
            <AlertDialogTitle>Grup Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.grupKodu} grubunu silmek istediginize emin misiniz?`
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
