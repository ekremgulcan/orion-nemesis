import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchCollateralHoldings } from "@/api/collateralHoldings"
import { createCollateralTransfer, type CreateCollateralTransferDto } from "@/api/collateral"
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
import { DetailAside } from "@/components/layout/DetailAside"

const TEMINAT_TIPI_OPTIONS = ["NAKIT_DOVIZ", "PAY_SENEDI", "BORCLANMA_ARACI", "FON"]
const DEPO_OPTIONS = ["SERBEST", "TEMINAT"]
const PARA_BIRIMI_OPTIONS = ["TRY", "USD", "EUR"]

// Not a status vocabulary, so it uses a small dedicated palette rather
// than STATUS_CHART_COLOR - still pulled from the same design tokens.
const VARLIK_TIPI_COLORS: Record<string, string> = {
  NAKIT: CHART_COLORS.success,
  DOVIZ: CHART_COLORS.info,
  PAY_SENEDI: CHART_COLORS.accent,
  BORCLANMA_ARACI: CHART_COLORS.danger,
  FON: CHART_COLORS.muted,
}

const EMPTY_FORM: CreateCollateralTransferDto = {
  hesapNo: "",
  piyasa: "BIST",
  saklamaci: "MKK",
  teminatTipi: "NAKIT_DOVIZ",
  kaynakDepo: "SERBEST",
  hedefDepo: "TEMINAT",
  paraBirimi: "TRY",
  miktar: 0,
  aciklama: "",
}

function formatMoney(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
}

export function TeminatIslemleriPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Teminat Islemleri")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateCollateralTransferDto>(EMPTY_FORM)

  const queryClient = useQueryClient()

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["collateral-holdings", query],
    queryFn: () => fetchCollateralHoldings(query || undefined),
  })

  const selected = useMemo(
    () => holdings.find((h) => h.id === selectedId) ?? null,
    [holdings, selectedId]
  )

  // KPI / donut data - derived client-side from the already-fetched list,
  // no extra API calls (see data-visualization.md).
  const serbestSayisi = holdings.filter((h) => h.depoTipi === "SERBEST").length
  const teminatSayisi = holdings.filter((h) => h.depoTipi === "TEMINAT").length
  const varlikBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const h of holdings) {
      counts.set(h.varlikTipi, (counts.get(h.varlikTipi) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([varlikTipi, count]) => ({ varlikTipi, count }))
      .sort((a, b) => b.count - a.count)
  }, [holdings])

  const createMutation = useMutation({
    mutationFn: (body: CreateCollateralTransferDto) => createCollateralTransfer(body),
    onSuccess: (created) => {
      toast.success(
        `Transfer talebi olusturuldu (Hesap: ${created.hesapNo}, Miktar: ${formatMoney(created.miktar)})`
      )
      queryClient.invalidateQueries({ queryKey: ["collateral-holdings"] })
      queryClient.invalidateQueries({ queryKey: ["collateral-transfers"] })
      setCreateOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Talep olusturulurken hata olustu"))
    },
  })

  function handleCreateSubmit() {
    createMutation.mutate({ ...form, miktar: Number(form.miktar) })
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: search + holdings table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground-muted">
              Serbest Depo / Teminat Deposu Kalemleri ({holdings.length})
            </p>
            <Button onClick={() => setCreateOpen(true)}>Yeni Transfer Talebi</Button>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            <div className="grid flex-1 grid-cols-2 gap-3">
              <KpiCard label="Serbest Depo Kalemi" value={serbestSayisi.toString()} tone="info" />
              <KpiCard label="Teminat Depo Kalemi" value={teminatSayisi.toString()} tone="warning" />
            </div>
            {varlikBreakdown.length > 1 && (
              <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                <div className="h-20 w-20 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={varlikBreakdown}
                        dataKey="count"
                        nameKey="varlikTipi"
                        innerRadius="62%"
                        outerRadius="100%"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {varlikBreakdown.map((entry) => (
                          <Cell
                            key={entry.varlikTipi}
                            fill={VARLIK_TIPI_COLORS[entry.varlikTipi] ?? CHART_COLORS.muted}
                          />
                        ))}
                      </Pie>
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex flex-col gap-1">
                  {varlikBreakdown.slice(0, 4).map((entry) => (
                    <li key={entry.varlikTipi} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: VARLIK_TIPI_COLORS[entry.varlikTipi] ?? CHART_COLORS.muted }}
                      />
                      <span className="whitespace-nowrap">{entry.varlikTipi}</span>
                      <span className="font-mono tnum text-foreground">{entry.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Input
            placeholder="Hesap No / Musteri / Enstruman ile ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Hesap No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead className="w-28">Depo Tipi</TableHead>
                  <TableHead className="w-36">Varlik Tipi</TableHead>
                  <TableHead className="w-24">Enstruman</TableHead>
                  <TableHead className="w-24">Para Birimi</TableHead>
                  <TableHead className="w-32 text-right">Miktar</TableHead>
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
                {!isLoading && holdings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {holdings.map((row) => (
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
                    <TableCell className="font-mono tnum">{row.hesapNo}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.depoTipi}</TableCell>
                    <TableCell>{row.varlikTipi}</TableCell>
                    <TableCell className="font-mono">{row.instrumentSymbol ?? "-"}</TableCell>
                    <TableCell>{row.paraBirimi ?? "-"}</TableCell>
                    <TableCell className="text-right font-mono tnum">
                      {formatMoney(row.miktar)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right column: selected holding detail */}
      <DetailAside>
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir kayit secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Hesap No</p>
              <p className="font-mono text-lg font-semibold tnum">{selected.hesapNo}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.customerName}</p>
            </div>

            <div className="flex flex-col gap-2 px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Depo Kalemi
              </p>
              <DetailRow label="Depo Tipi" value={selected.depoTipi} />
              <DetailRow label="Varlik Tipi" value={selected.varlikTipi} />
              {selected.instrumentSymbol && (
                <DetailRow label="Enstruman" value={selected.instrumentSymbol} mono />
              )}
              {selected.paraBirimi && <DetailRow label="Para Birimi" value={selected.paraBirimi} />}
              <DetailRow label="Miktar" value={formatMoney(selected.miktar)} mono />
              <div className="mt-2 border-t border-border pt-2">
                <DetailRow
                  label="Guncelleme Tarihi"
                  value={new Date(selected.guncellemeTarihi).toLocaleString("tr-TR")}
                />
              </div>
            </div>
          </div>
        )}
      </DetailAside>

      {/* New transfer request dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Transfer Talebi</DialogTitle>
            <DialogDescription>
              Serbest Depo ile Teminat Deposu arasinda virman talebi olusturun. Talep BEKLEMEDE
              durumunda olusturulur, Teminat Onay Ekrani'ndan onaylanabilir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hesap No">
              <Input
                value={form.hesapNo}
                onChange={(e) => setForm({ ...form, hesapNo: e.target.value })}
              />
            </Field>
            <Field label="Piyasa">
              <Input
                value={form.piyasa}
                onChange={(e) => setForm({ ...form, piyasa: e.target.value })}
              />
            </Field>
            <Field label="Saklamaci">
              <Input
                value={form.saklamaci}
                onChange={(e) => setForm({ ...form, saklamaci: e.target.value })}
              />
            </Field>
            <Field label="Teminat Tipi">
              <Select
                value={form.teminatTipi}
                onValueChange={(v) => setForm({ ...form, teminatTipi: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMINAT_TIPI_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Kaynak Depo">
              <Select
                value={form.kaynakDepo}
                onValueChange={(v) => setForm({ ...form, kaynakDepo: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPO_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Hedef Depo">
              <Select
                value={form.hedefDepo}
                onValueChange={(v) => setForm({ ...form, hedefDepo: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPO_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Para Birimi">
              <Select
                value={form.paraBirimi}
                onValueChange={(v) => setForm({ ...form, paraBirimi: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PARA_BIRIMI_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Miktar">
              <Input
                type="number"
                step="0.01"
                value={form.miktar}
                onChange={(e) => setForm({ ...form, miktar: Number(e.target.value) })}
              />
            </Field>
            <Field label="Aciklama" span2>
              <Input
                value={form.aciklama ?? ""}
                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Vazgec
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              Transfer Talebi Olustur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
