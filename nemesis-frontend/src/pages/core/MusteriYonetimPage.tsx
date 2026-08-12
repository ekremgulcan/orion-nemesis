import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
  type CustomerDto,
  type CustomerFormDto,
} from "@/api/customers"
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

const MUSTERI_TIPI_OPTIONS = ["BIREYSEL", "KURUMSAL"]
const RISK_GRUBU_OPTIONS = ["DUSUK", "ORTA", "YUKSEK"]

// Not a status vocabulary, so it uses a small dedicated palette rather
// than STATUS_CHART_COLOR - still pulled from the same design tokens.
const RISK_GRUBU_COLORS: Record<string, string> = {
  DUSUK: CHART_COLORS.success,
  ORTA: CHART_COLORS.warning,
  YUKSEK: CHART_COLORS.danger,
}

function emptyForm(): CustomerFormDto {
  return {
    musteriNo: "",
    adSoyadUnvan: "",
    musteriTipi: "BIREYSEL",
    tcknVkn: "",
    riskGrubu: "ORTA",
    telefon: "",
    email: "",
    aktif: true,
  }
}

function formFromCustomer(customer: CustomerDto): CustomerFormDto {
  return {
    musteriNo: customer.musteriNo,
    adSoyadUnvan: customer.adSoyadUnvan,
    musteriTipi: customer.musteriTipi,
    tcknVkn: customer.tcknVkn,
    riskGrubu: customer.riskGrubu,
    telefon: customer.telefon ?? "",
    email: customer.email ?? "",
    aktif: customer.aktif,
  }
}

export function MusteriYonetimPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Musteri Yonetim Sistemi")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CustomerFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<CustomerDto | null>(null)

  const queryClient = useQueryClient()

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", query],
    queryFn: () => fetchCustomers(query || undefined),
  })

  const selected = customers.find((c) => c.id === selectedId) ?? null

  // KPI strip + risk breakdown donut - derived client-side from the
  // already-fetched list, no extra API calls (see data-visualization.md).
  const aktifSayisi = useMemo(() => customers.filter((c) => c.aktif).length, [customers])
  const kurumsalSayisi = useMemo(
    () => customers.filter((c) => c.musteriTipi === "KURUMSAL").length,
    [customers]
  )
  const riskBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of customers) {
      counts.set(c.riskGrubu, (counts.get(c.riskGrubu) ?? 0) + 1)
    }
    return RISK_GRUBU_OPTIONS.map((risk) => ({ risk, count: counts.get(risk) ?? 0 })).filter(
      (r) => r.count > 0
    )
  }, [customers])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(customer: CustomerDto) {
    setEditingId(customer.id)
    setForm(formFromCustomer(customer))
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (body: CustomerFormDto) =>
      editingId != null ? updateCustomer(editingId, body) : createCustomer(body),
    onSuccess: () => {
      toast.success("Musteri kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      toast.success("Musteri silindi.")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
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
      {/* Middle column: search + customers table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-3 gap-3 sm:max-w-md">
            <KpiCard label="Toplam Musteri" value={customers.length.toString()} />
            <KpiCard label="Aktif" value={aktifSayisi.toString()} tone="success" />
            <KpiCard label="Kurumsal" value={kurumsalSayisi.toString()} tone="info" />
          </div>
          {riskBreakdown.length > 1 && (
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
              <div className="h-20 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskBreakdown}
                      dataKey="count"
                      nameKey="risk"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {riskBreakdown.map((entry) => (
                        <Cell key={entry.risk} fill={RISK_GRUBU_COLORS[entry.risk] ?? CHART_COLORS.muted} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-1">
                {riskBreakdown.map((entry) => (
                  <li key={entry.risk} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: RISK_GRUBU_COLORS[entry.risk] ?? CHART_COLORS.muted }}
                    />
                    <span className="whitespace-nowrap">Risk: {entry.risk}</span>
                    <span className="font-mono tnum text-foreground">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <Input
            placeholder="Musteri No / Ad Soyad / TCKN-VKN ile ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openCreate}>Yeni Musteri</Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Musteri No</TableHead>
                  <TableHead>Ad Soyad / Unvan</TableHead>
                  <TableHead className="w-24">Tip</TableHead>
                  <TableHead className="w-32">TCKN/VKN</TableHead>
                  <TableHead className="w-24">Risk Grubu</TableHead>
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
                {!isLoading && customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {customers.map((row) => (
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
                    <TableCell className="font-mono">{row.musteriNo}</TableCell>
                    <TableCell>{row.adSoyadUnvan}</TableCell>
                    <TableCell>{row.musteriTipi}</TableCell>
                    <TableCell className="font-mono tnum">{row.tcknVkn}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{ color: RISK_GRUBU_COLORS[row.riskGrubu] ?? CHART_COLORS.muted }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: RISK_GRUBU_COLORS[row.riskGrubu] ?? CHART_COLORS.muted }}
                        />
                        {row.riskGrubu}
                      </span>
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

      {/* Right column: selected customer detail */}
      <DetailAside>
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir musteri secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Musteri No</p>
              <p className="font-mono text-lg font-semibold tnum">{selected.musteriNo}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.adSoyadUnvan}</p>
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
                  Musteri Bilgisi
                </p>
                <DetailRow label="Musteri Tipi" value={selected.musteriTipi} />
                <DetailRow label="TCKN/VKN" value={selected.tcknVkn} mono />
                <DetailRow
                  label="Risk Grubu"
                  value={selected.riskGrubu}
                  color={RISK_GRUBU_COLORS[selected.riskGrubu]}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Iletisim
                </p>
                <DetailRow label="Telefon" value={selected.telefon ?? "-"} mono />
                <DetailRow label="E-Posta" value={selected.email ?? "-"} />
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
      </DetailAside>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Musteriyi Duzenle" : "Yeni Musteri"}</DialogTitle>
            <DialogDescription>
              Musteri bilgilerini girin. Musteri No ve TCKN/VKN benzersiz olmalidir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Musteri No">
              <Input
                value={form.musteriNo}
                onChange={(e) => setForm({ ...form, musteriNo: e.target.value })}
              />
            </Field>
            <Field label="Musteri Tipi">
              <Select
                value={form.musteriTipi}
                onValueChange={(v) => setForm({ ...form, musteriTipi: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MUSTERI_TIPI_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ad Soyad/Unvan" span2>
              <Input
                value={form.adSoyadUnvan}
                onChange={(e) => setForm({ ...form, adSoyadUnvan: e.target.value })}
              />
            </Field>
            <Field label="TCKN/VKN">
              <Input
                value={form.tcknVkn}
                onChange={(e) => setForm({ ...form, tcknVkn: e.target.value })}
              />
            </Field>
            <Field label="Risk Grubu">
              <Select
                value={form.riskGrubu}
                onValueChange={(v) => setForm({ ...form, riskGrubu: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_GRUBU_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Telefon">
              <Input
                value={form.telefon ?? ""}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              />
            </Field>
            <Field label="E-Posta">
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
            <AlertDialogTitle>Musteri Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.adSoyadUnvan} (${deleteTarget.musteriNo}) musterisini silmek istediginize emin misiniz?`
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
