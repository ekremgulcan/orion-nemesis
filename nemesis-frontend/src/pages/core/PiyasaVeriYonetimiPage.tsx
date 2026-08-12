import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createInstrument,
  deleteInstrument,
  fetchInstruments,
  updateInstrument,
  type InstrumentDto,
  type InstrumentFormDto,
} from "@/api/instruments"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-colors"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const TIP_OPTIONS = ["HISSE", "VIOP", "SGMK", "EUROBOND"]

// Not a status vocabulary, so it uses a small dedicated palette rather
// than STATUS_CHART_COLOR - still pulled from the same design tokens.
const TIP_COLORS: Record<string, string> = {
  HISSE: CHART_COLORS.info,
  VIOP: CHART_COLORS.accent,
  SGMK: CHART_COLORS.success,
  EUROBOND: CHART_COLORS.danger,
}

function emptyForm(): InstrumentFormDto {
  return {
    isin: "",
    sembol: "",
    ad: "",
    tip: "HISSE",
    borsa: "BIST",
    aktif: true,
  }
}

function formFromInstrument(instrument: InstrumentDto): InstrumentFormDto {
  return {
    isin: instrument.isin,
    sembol: instrument.sembol,
    ad: instrument.ad,
    tip: instrument.tip,
    borsa: instrument.borsa,
    aktif: instrument.aktif,
  }
}

/**
 * "Piyasa Veri Yonetimi" (piyasa-veri-yonetimi.zul /
 * PiyasaVeriYonetimiViewModel). Master-data CRUD for the same Instrument
 * entity that VIOP Kotasyon Izleme / Hisse Kotasyon Izleme consume
 * read-only via tip filtering.
 */
export function PiyasaVeriYonetimiPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Piyasa Veri Yonetimi")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<InstrumentFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<InstrumentDto | null>(null)

  const queryClient = useQueryClient()

  const { data: instruments = [], isLoading } = useQuery({
    queryKey: ["instruments", undefined, query],
    queryFn: () => fetchInstruments(undefined, query || undefined),
  })

  const selected = instruments.find((i) => i.id === selectedId) ?? null

  // KPI strip + tip breakdown donut - derived client-side from the
  // already-fetched list, no extra API calls (see data-visualization.md).
  const aktifSayisi = useMemo(() => instruments.filter((i) => i.aktif).length, [instruments])
  const tipBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of instruments) {
      counts.set(i.tip, (counts.get(i.tip) ?? 0) + 1)
    }
    return TIP_OPTIONS.map((tip) => ({ tip, count: counts.get(tip) ?? 0 })).filter(
      (t) => t.count > 0
    )
  }, [instruments])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(instrument: InstrumentDto) {
    setEditingId(instrument.id)
    setForm(formFromInstrument(instrument))
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (body: InstrumentFormDto) =>
      editingId != null ? updateInstrument(editingId, body) : createInstrument(body),
    onSuccess: () => {
      toast.success("Enstruman kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["instruments"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteInstrument(id),
    onSuccess: () => {
      toast.success("Enstruman silindi.")
      queryClient.invalidateQueries({ queryKey: ["instruments"] })
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
      {/* Middle column: search + instruments table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-2 border-b border-border px-6 py-4">
          <p className="text-xs text-foreground-faint">
            Fiyat besleme/entegrasyon yonetimi Faz 4+ kapsaminda eklenecektir. Asagida referans
            enstruman verisi (master data) yonetilmektedir.
          </p>
        </div>
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-xs">
            <KpiCard label="Toplam Enstruman" value={instruments.length.toString()} />
            <KpiCard label="Aktif" value={aktifSayisi.toString()} tone="success" />
          </div>
          {tipBreakdown.length > 1 && (
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
              <div className="h-20 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tipBreakdown}
                      dataKey="count"
                      nameKey="tip"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {tipBreakdown.map((entry) => (
                        <Cell key={entry.tip} fill={TIP_COLORS[entry.tip] ?? CHART_COLORS.muted} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-1">
                {tipBreakdown.map((entry) => (
                  <li key={entry.tip} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: TIP_COLORS[entry.tip] ?? CHART_COLORS.muted }}
                    />
                    <span className="whitespace-nowrap">{entry.tip}</span>
                    <span className="font-mono tnum text-foreground">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <Input
            placeholder="Sembol / Ad / ISIN / Tip ile ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openCreate}>Yeni Enstruman</Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Sembol</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead className="w-40">ISIN</TableHead>
                  <TableHead className="w-24">Tip</TableHead>
                  <TableHead className="w-24">Borsa</TableHead>
                  <TableHead className="w-20 text-center">Aktif</TableHead>
                  <TableHead className="w-40 text-right">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-foreground-muted">
                      Yukleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && instruments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {instruments.map((row) => (
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
                    <TableCell className="font-mono font-medium">{row.sembol}</TableCell>
                    <TableCell>{row.ad}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground-muted">
                      {row.isin}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{ color: TIP_COLORS[row.tip] ?? CHART_COLORS.muted }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: TIP_COLORS[row.tip] ?? CHART_COLORS.muted }}
                        />
                        {row.tip}
                      </span>
                    </TableCell>
                    <TableCell>{row.borsa}</TableCell>
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

      {/* Right column: selected instrument detail */}
      <DetailAside>
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir enstruman secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Sembol</p>
              <p className="font-mono text-lg font-semibold">{selected.sembol}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.ad}</p>
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
                Enstruman Bilgisi
              </p>
              <DetailRow label="ISIN" value={selected.isin} mono />
              <DetailRow label="Tip" value={selected.tip} color={TIP_COLORS[selected.tip]} />
              <DetailRow label="Borsa" value={selected.borsa} />
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
            <DialogTitle>{editingId != null ? "Enstruman Duzenle" : "Yeni Enstruman"}</DialogTitle>
            <DialogDescription>
              Referans enstruman bilgilerini girin. ISIN benzersiz olmalidir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sembol">
              <Input
                value={form.sembol}
                onChange={(e) => setForm({ ...form, sembol: e.target.value })}
              />
            </Field>
            <Field label="ISIN">
              <Input
                value={form.isin}
                onChange={(e) => setForm({ ...form, isin: e.target.value })}
              />
            </Field>
            <Field label="Ad" span2>
              <Input
                value={form.ad}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
              />
            </Field>
            <Field label="Tip">
              <Select
                value={form.tip}
                onValueChange={(v) => setForm({ ...form, tip: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIP_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Borsa">
              <Input
                value={form.borsa}
                onChange={(e) => setForm({ ...form, borsa: e.target.value })}
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
            <AlertDialogTitle>Enstruman Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.sembol} (${deleteTarget.ad}) enstrumanini silmek istediginize emin misiniz?`
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

function DetailRow({
  label,
  value,
  mono,
  color,
}: {
  label: string
  value: string
  mono?: boolean
  color?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span
        className={mono ? "font-mono text-sm font-medium tnum" : "text-sm font-medium"}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  )
}
