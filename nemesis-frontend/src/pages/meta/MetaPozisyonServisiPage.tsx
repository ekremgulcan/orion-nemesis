import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createShockScenario,
  deleteShockScenario,
  fetchPositionSnapshots,
  fetchShockScenarios,
  updateShockScenario,
  type PositionShockScenarioDto,
  type PositionShockScenarioFormDto,
} from "@/api/metaPositions"
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

const nf = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })

function emptyForm(): PositionShockScenarioFormDto {
  return { senaryoAdi: "", currencyPair: "", sokYuzdesi: 0, aktif: true }
}

function formFromScenario(scenario: PositionShockScenarioDto): PositionShockScenarioFormDto {
  return {
    senaryoAdi: scenario.senaryoAdi,
    currencyPair: scenario.currencyPair,
    sokYuzdesi: scenario.sokYuzdesi,
    aktif: scenario.aktif,
  }
}

/**
 * "Meta Pozisyon Servisi" (meta-pozisyon-servisi.zul /
 * MetaPozisyonServisiViewModel). Two independent sections stacked
 * vertically (no shared master-detail relationship, matching the ZK
 * layout): read-only position snapshots (search only, derived data - no
 * CRUD) and PositionShockScenario CRUD (currency-pair based shock
 * percentage definitions).
 */
export function MetaPozisyonServisiPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Meta Pozisyon Servisi")
  }, [setTitle])

  const [positionQuery, setPositionQuery] = useState("")
  const [scenarioQuery, setScenarioQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<PositionShockScenarioFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<PositionShockScenarioDto | null>(null)

  const queryClient = useQueryClient()

  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ["position-snapshots", positionQuery],
    queryFn: () => fetchPositionSnapshots(positionQuery || undefined),
  })

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery({
    queryKey: ["shock-scenarios", scenarioQuery],
    queryFn: () => fetchShockScenarios(scenarioQuery || undefined),
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(scenario: PositionShockScenarioDto) {
    setEditingId(scenario.id)
    setForm(formFromScenario(scenario))
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (body: PositionShockScenarioFormDto) =>
      editingId != null ? updateShockScenario(editingId, body) : createShockScenario(body),
    onSuccess: () => {
      toast.success("Sok senaryosu kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["shock-scenarios"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteShockScenario(id),
    onSuccess: () => {
      toast.success("Senaryo silindi.")
      queryClient.invalidateQueries({ queryKey: ["shock-scenarios"] })
      setDeleteTarget(null)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Silme sirasinda hata olustu"))
      setDeleteTarget(null)
    },
  })

  const aktifSenaryoSayisi = scenarios.filter((s) => s.aktif).length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      {/* Position snapshots - read-only */}
      <section className="flex flex-col gap-3 border-b border-border px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold">Pozisyon Kayitlari</h3>
          <p className="text-xs text-foreground-faint">
            Pozisyonlar islemlerden turetilir, salt-okunurdur.
          </p>
        </div>
        <Input
          placeholder="Hesap No / Musteri / Enstruman ile ara..."
          value={positionQuery}
          onChange={(e) => setPositionQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="min-w-max rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Hesap No</TableHead>
                <TableHead>Musteri</TableHead>
                <TableHead className="w-24">Enstruman</TableHead>
                <TableHead className="w-32 text-right">Miktar</TableHead>
                <TableHead className="w-32 text-right">Referans Fiyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionsLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                    Yukleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!positionsLoading && positions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                    No Rows To Show
                  </TableCell>
                </TableRow>
              )}
              {positions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono">{row.hesapNo}</TableCell>
                  <TableCell>{row.customerName}</TableCell>
                  <TableCell className="font-mono font-medium">
                    {row.instrumentSymbol ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono tnum">{nf.format(row.miktar)}</TableCell>
                  <TableCell className="text-right font-mono tnum">
                    {nf.format(row.referansFiyat)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Shock scenarios - CRUD */}
      <section className="flex flex-col gap-3 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold">Sok Senaryolari</h3>
          <p className="text-xs text-foreground-faint">
            Currency pair bazinda sok yuzdesi tanimlari.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
          <KpiCard label="Toplam Senaryo" value={scenarios.length.toString()} />
          <KpiCard label="Aktif" value={aktifSenaryoSayisi.toString()} tone="success" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Input
            placeholder="Senaryo Adi / Currency Pair ile ara..."
            value={scenarioQuery}
            onChange={(e) => setScenarioQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openCreate}>Yeni Senaryo</Button>
        </div>

        <div className="min-w-max rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Senaryo Adi</TableHead>
                <TableHead className="w-32">Currency Pair</TableHead>
                <TableHead className="w-28 text-right">Sok Yuzdesi</TableHead>
                <TableHead className="w-20 text-center">Aktif</TableHead>
                <TableHead className="w-40 text-right">Aksiyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenariosLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                    Yukleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!scenariosLoading && scenarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                    No Rows To Show
                  </TableCell>
                </TableRow>
              )}
              {scenarios.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.senaryoAdi}</TableCell>
                  <TableCell className="font-mono">{row.currencyPair}</TableCell>
                  <TableCell className="text-right font-mono tnum">
                    {row.sokYuzdesi > 0 ? "+" : ""}
                    {nf.format(row.sokYuzdesi)}%
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
                    <div className="flex justify-end gap-2">
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
      </section>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Senaryoyu Duzenle" : "Yeni Senaryo"}</DialogTitle>
            <DialogDescription>
              Currency pair bazinda sok senaryosu tanimlayin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Senaryo Adi" span2>
              <Input
                value={form.senaryoAdi}
                onChange={(e) => setForm({ ...form, senaryoAdi: e.target.value })}
              />
            </Field>
            <Field label="Currency Pair">
              <Input
                placeholder="USD/TRY"
                value={form.currencyPair}
                onChange={(e) => setForm({ ...form, currencyPair: e.target.value })}
              />
            </Field>
            <Field label="Sok Yuzdesi">
              <Input
                type="number"
                step="0.01"
                value={form.sokYuzdesi}
                onChange={(e) => setForm({ ...form, sokYuzdesi: Number(e.target.value) })}
              />
            </Field>
            <Field label="Durum" span2>
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
            <AlertDialogTitle>Senaryo Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `${deleteTarget.senaryoAdi} senaryosunu silmek istediginize emin misiniz?` : ""}
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
