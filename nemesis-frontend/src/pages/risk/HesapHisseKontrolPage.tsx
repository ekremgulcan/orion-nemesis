import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createAccountInstrumentControl,
  deleteAccountInstrumentControl,
  fetchAccountInstrumentControls,
  updateAccountInstrumentControl,
  type AccountInstrumentControlDto,
  type AccountInstrumentControlFormDto,
} from "@/api/accountInstrumentControls"
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

function emptyForm(): AccountInstrumentControlFormDto {
  return {
    kullaniciAdi: "",
    hesapNo: "",
    enstrumanSembol: "",
    alisIzni: true,
    satisIzni: true,
    acikSatisIzni: false,
  }
}

/**
 * "Kullanici/Hesap/Hisse Bazinda Kontrol" (hesap-hisse-kontrol.zul /
 * HesapHisseKontrolViewModel). AccountInstrumentControl CRUD. Lookup is
 * free-text (kullaniciAdi / hesapNo / enstrumanSembol), matching the ZK
 * screen exactly - no dropdown/autocomplete. Backend already returns an
 * "bulunamadi" IllegalArgumentException for bad lookups, surfaced here
 * via toast.
 */
export function HesapHisseKontrolPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Hesap/Hisse Bazinda Kontrol")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AccountInstrumentControlFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<AccountInstrumentControlDto | null>(null)

  const queryClient = useQueryClient()

  const { data: controls = [], isLoading } = useQuery({
    queryKey: ["account-instrument-controls", query],
    queryFn: () => fetchAccountInstrumentControls(query || undefined),
  })

  const selected = controls.find((c) => c.id === selectedId) ?? null

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(control: AccountInstrumentControlDto) {
    setEditingId(control.id)
    setForm({
      kullaniciAdi: control.kullaniciAdi,
      hesapNo: control.hesapNo,
      enstrumanSembol: control.instrumentSymbol,
      alisIzni: control.alisIzni,
      satisIzni: control.satisIzni,
      acikSatisIzni: control.acikSatisIzni,
    })
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (body: AccountInstrumentControlFormDto) =>
      editingId != null
        ? updateAccountInstrumentControl(editingId, body)
        : createAccountInstrumentControl(body),
    onSuccess: () => {
      toast.success("Kontrol kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["account-instrument-controls"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAccountInstrumentControl(id),
    onSuccess: () => {
      toast.success("Kontrol silindi.")
      queryClient.invalidateQueries({ queryKey: ["account-instrument-controls"] })
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
      {/* Middle column: search + controls table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
            <KpiCard label="Toplam Kontrol" value={controls.length.toString()} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Input
              placeholder="Kullanici / Hesap No / Sembol ile ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={openCreate}>Yeni Kontrol</Button>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanici</TableHead>
                  <TableHead className="w-28">Hesap No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead className="w-24">Enstruman</TableHead>
                  <TableHead className="w-16 text-center">Alis</TableHead>
                  <TableHead className="w-16 text-center">Satis</TableHead>
                  <TableHead className="w-20 text-center">Acik Satis</TableHead>
                  <TableHead className="w-40 text-right">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-foreground-muted">
                      Yukleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && controls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {controls.map((row) => (
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
                    <TableCell>{row.userName}</TableCell>
                    <TableCell className="font-mono">{row.hesapNo}</TableCell>
                    <TableCell className="text-foreground-muted">{row.customerName}</TableCell>
                    <TableCell className="font-mono font-medium">{row.instrumentSymbol}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          row.alisIzni
                            ? "inline-block h-2.5 w-2.5 rounded-full bg-success"
                            : "inline-block h-2.5 w-2.5 rounded-full bg-foreground-faint"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          row.satisIzni
                            ? "inline-block h-2.5 w-2.5 rounded-full bg-success"
                            : "inline-block h-2.5 w-2.5 rounded-full bg-foreground-faint"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          row.acikSatisIzni
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

      {/* Right column: selected control detail */}
      <aside className="hidden w-96 shrink-0 flex-col bg-surface lg:flex">
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir kontrol secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Enstruman</p>
              <p className="font-mono text-lg font-semibold">{selected.instrumentSymbol}</p>
              <p className="mt-1 text-sm text-foreground-muted">
                {selected.userName} / {selected.hesapNo}
              </p>
            </div>

            <div className="flex flex-col gap-2 px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Hesap Bilgisi
              </p>
              <DetailRow label="Musteri" value={selected.customerName} />
              <DetailRow label="Hesap No" value={selected.hesapNo} mono />
            </div>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Izinler
              </p>
              <DetailRow label="Alis Izni" value={selected.alisIzni ? "Var" : "Yok"} />
              <DetailRow label="Satis Izni" value={selected.satisIzni ? "Var" : "Yok"} />
              <DetailRow label="Acik Satis Izni" value={selected.acikSatisIzni ? "Var" : "Yok"} />
            </div>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Kayit Bilgisi
              </p>
              <DetailRow
                label="Guncelleme Tarihi"
                value={new Date(selected.guncellemeTarihi).toLocaleString("tr-TR")}
              />
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
            <DialogTitle>{editingId != null ? "Kontrolu Duzenle" : "Yeni Kontrol"}</DialogTitle>
            <DialogDescription>
              Kullanici Adi, Hesap No ve Enstruman Sembolunu girin - mevcut kayitlarla
              eslesmelidir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kullanici Adi">
              <Input
                value={form.kullaniciAdi}
                onChange={(e) => setForm({ ...form, kullaniciAdi: e.target.value })}
              />
            </Field>
            <Field label="Hesap No">
              <Input
                value={form.hesapNo}
                onChange={(e) => setForm({ ...form, hesapNo: e.target.value })}
              />
            </Field>
            <Field label="Enstruman Sembolu" span2>
              <Input
                value={form.enstrumanSembol}
                onChange={(e) => setForm({ ...form, enstrumanSembol: e.target.value })}
              />
            </Field>
            <Field label="Izinler" span2>
              <div className="flex flex-col gap-1.5 rounded-md border border-border p-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.alisIzni}
                    onChange={(e) => setForm({ ...form, alisIzni: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  Alis Izni
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.satisIzni}
                    onChange={(e) => setForm({ ...form, satisIzni: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  Satis Izni
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.acikSatisIzni}
                    onChange={(e) => setForm({ ...form, acikSatisIzni: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  Acik Satis Izni
                </label>
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
            <AlertDialogTitle>Kontrol Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.userName} / ${deleteTarget.hesapNo} / ${deleteTarget.instrumentSymbol} kontrolunu silmek istediginize emin misiniz?`
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

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className={mono ? "font-mono text-sm font-medium tnum" : "text-sm font-medium"}>
        {value}
      </span>
    </div>
  )
}
