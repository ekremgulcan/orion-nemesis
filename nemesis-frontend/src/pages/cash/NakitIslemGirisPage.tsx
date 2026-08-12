import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  approveCashTransactionRequest,
  createCashTransactionRequest,
  fetchCashTransactionRequests,
  rejectCashTransactionRequest,
  type CreateCashTransactionRequestDto,
} from "@/api/cash"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { StatusBadge } from "@/components/status-badge"
import { KpiCard } from "@/components/kpi-card"
import { CHART_TOOLTIP_STYLE, STATUS_CHART_COLOR, CHART_COLORS } from "@/lib/chart-colors"
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

type ActionKind = "approve" | "reject"

const ACTION_LABELS: Record<ActionKind, string> = {
  approve: "Onayla ve Tamamla",
  reject: "Reddet",
}

const ACTION_CONFIRM_TEXT: Record<ActionKind, string> = {
  approve:
    "Bu talebi onaylayip tamamlamak istediginize emin misiniz? Islem yonune gore hesap bakiyesi guncellenecektir.",
  reject: "Bu talebi reddetmek istediginize emin misiniz?",
}

const TALEP_KANALI_OPTIONS = ["SUBE", "INTERNET", "TRADEMASTER", "CAGRI_MERKEZI"]
const PARA_BIRIMI_OPTIONS = ["TRY", "USD", "EUR"]
const ISLEM_YONU_OPTIONS = ["ODEME", "TAHSILAT"]
const YONTEM_OPTIONS = ["IBAN", "HESAP", "YINELE_GVT"]

const EMPTY_FORM: CreateCashTransactionRequestDto = {
  hesapNo: "",
  talepKanali: "SUBE",
  emirVeren: "",
  valorTarihi: new Date().toISOString().slice(0, 10),
  tutar: 0,
  paraBirimi: "TRY",
  islemYonu: "ODEME",
  yontem: "IBAN",
  iban: "",
  karsiHesapNo: "",
  iymBankaHesabi: "",
  aciklama: "",
}

export function NakitIslemGirisPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Nakit Islem Giris")
  }, [setTitle])

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateCashTransactionRequestDto>(EMPTY_FORM)

  const queryClient = useQueryClient()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["cash-transaction-requests"],
    queryFn: () => fetchCashTransactionRequests(),
  })

  const sorted = useMemo(
    () => [...requests].sort((a, b) => b.id - a.id),
    [requests]
  )

  const selected = requests.find((r) => r.id === selectedId) ?? null

  // KPI / donut data - derived client-side from the already-fetched list,
  // no extra API calls (see data-visualization.md).
  const bekleyenSayisi = requests.filter((r) => r.durum === "BEKLEMEDE").length
  const odemeToplami = useMemo(
    () => requests.filter((r) => r.islemYonu === "ODEME").reduce((sum, r) => sum + r.tutar, 0),
    [requests]
  )
  const tahsilatToplami = useMemo(
    () => requests.filter((r) => r.islemYonu === "TAHSILAT").reduce((sum, r) => sum + r.tutar, 0),
    [requests]
  )
  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of requests) {
      counts.set(r.durum, (counts.get(r.durum) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([durum, count]) => ({ durum, count }))
      .sort((a, b) => b.count - a.count)
  }, [requests])

  const actionMutation = useMutation({
    mutationFn: async (action: ActionKind) => {
      if (!selected) return
      if (action === "approve") await approveCashTransactionRequest(selected.id)
      if (action === "reject") await rejectCashTransactionRequest(selected.id)
    },
    onSuccess: () => {
      toast.success("Islem tamamlandi.")
      queryClient.invalidateQueries({ queryKey: ["cash-transaction-requests"] })
      setPendingAction(null)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Islem sirasinda hata olustu"))
      setPendingAction(null)
    },
  })

  const createMutation = useMutation({
    mutationFn: (body: CreateCashTransactionRequestDto) => createCashTransactionRequest(body),
    onSuccess: () => {
      toast.success("Islem talebi olusturuldu.")
      queryClient.invalidateQueries({ queryKey: ["cash-transaction-requests"] })
      setCreateOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Talep olusturulurken hata olustu"))
    },
  })

  function handleCreateSubmit() {
    createMutation.mutate({
      ...form,
      tutar: Number(form.tutar),
      iban: form.yontem === "IBAN" ? form.iban : null,
      karsiHesapNo: form.yontem === "HESAP" ? form.karsiHesapNo : null,
    })
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: request history table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Toplam Talep" value={sorted.length.toString()} />
            <KpiCard label="Bekleyen" value={bekleyenSayisi.toString()} tone="warning" />
            <KpiCard
              label="Odeme Toplami"
              value={odemeToplami.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
              tone="danger"
            />
            <KpiCard
              label="Tahsilat Toplami"
              value={tahsilatToplami.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
              tone="success"
            />
          </div>
          {statusBreakdown.length > 1 && (
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
              <div className="h-20 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="count"
                      nameKey="durum"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.durum} fill={STATUS_CHART_COLOR[entry.durum] ?? CHART_COLORS.muted} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-1">
                {statusBreakdown.slice(0, 4).map((entry) => (
                  <li key={entry.durum} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: STATUS_CHART_COLOR[entry.durum] ?? CHART_COLORS.muted }}
                    />
                    <span className="whitespace-nowrap">{entry.durum}</span>
                    <span className="font-mono tnum text-foreground">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <p className="text-sm font-medium text-foreground-muted">
            Islem Gecmisi ({sorted.length})
          </p>
          <Button onClick={() => setCreateOpen(true)}>Yeni Talep</Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Hesap No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead className="w-32">Kanal</TableHead>
                  <TableHead className="w-24">Yon</TableHead>
                  <TableHead className="w-28 text-right">Tutar</TableHead>
                  <TableHead className="w-20">Para Birimi</TableHead>
                  <TableHead className="w-28">Valor Tarihi</TableHead>
                  <TableHead className="w-28 text-center">Durum</TableHead>
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
                {!isLoading && sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {sorted.map((row) => (
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
                    <TableCell>{row.talepKanali}</TableCell>
                    <TableCell>{row.islemYonu}</TableCell>
                    <TableCell className="text-right font-mono tnum">
                      {row.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{row.paraBirimi}</TableCell>
                    <TableCell className="font-mono tnum">{row.valorTarihi}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge durum={row.durum} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right column: detail / action panel */}
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
              <div className="mt-3">
                <StatusBadge durum={selected.durum} />
              </div>
            </div>

            <div className="flex flex-col gap-6 px-6 py-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Islem Bilgisi
                </p>
                <DetailRow label="Talep Kanali" value={selected.talepKanali} />
                <DetailRow label="Emir Veren" value={selected.emirVeren} />
                <DetailRow label="Islem Yonu" value={selected.islemYonu} />
                <DetailRow label="Yontem" value={selected.yontem} />
                <DetailRow
                  label="Tutar"
                  value={`${selected.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${selected.paraBirimi}`}
                  mono
                />
                <DetailRow label="Valor Tarihi" value={selected.valorTarihi} mono />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Hesap Bilgileri
                </p>
                {selected.iban && <DetailRow label="IBAN" value={selected.iban} mono />}
                {selected.karsiHesapNo && (
                  <DetailRow label="Karsi Hesap No" value={selected.karsiHesapNo} mono />
                )}
                {selected.iymBankaHesabi && (
                  <DetailRow label="IYM Banka Hesabi" value={selected.iymBankaHesabi} mono />
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Talep Bilgisi
                </p>
                <DetailRow
                  label="Olusturma Tarihi"
                  value={new Date(selected.olusturmaTarihi).toLocaleString("tr-TR")}
                />
                {selected.aciklama && <DetailRow label="Aciklama" value={selected.aciklama} />}
              </div>
            </div>

            {selected.durum === "BEKLEMEDE" && (
              <div className="mt-auto flex flex-wrap gap-2 border-t border-border px-6 py-4">
                <Button
                  className="flex-1 bg-success text-white hover:bg-success/90"
                  onClick={() => setPendingAction("approve")}
                >
                  Onayla ve Tamamla
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setPendingAction("reject")}>
                  Reddet
                </Button>
              </div>
            )}
          </div>
        )}
      </DetailAside>

      {/* Approve / reject confirmation */}
      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction ? ACTION_LABELS[pendingAction] : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction ? ACTION_CONFIRM_TEXT[pendingAction] : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Vazgec</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAction && actionMutation.mutate(pendingAction)}
              disabled={actionMutation.isPending}
            >
              Evet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New request dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Islem Talebi</DialogTitle>
            <DialogDescription>
              Nakit islem talebi olusturun. Talep BEKLEMEDE durumunda olusturulur ve onaylandiginda
              hesap bakiyesi guncellenir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hesap No">
              <Input
                value={form.hesapNo}
                onChange={(e) => setForm({ ...form, hesapNo: e.target.value })}
              />
            </Field>
            <Field label="Talep Kanali">
              <Select
                value={form.talepKanali}
                onValueChange={(v) => setForm({ ...form, talepKanali: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TALEP_KANALI_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Emir Veren">
              <Input
                value={form.emirVeren}
                onChange={(e) => setForm({ ...form, emirVeren: e.target.value })}
              />
            </Field>
            <Field label="Valor Tarihi">
              <Input
                type="date"
                value={form.valorTarihi}
                onChange={(e) => setForm({ ...form, valorTarihi: e.target.value })}
              />
            </Field>
            <Field label="Tutar">
              <Input
                type="number"
                step="0.01"
                value={form.tutar}
                onChange={(e) => setForm({ ...form, tutar: Number(e.target.value) })}
              />
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
            <Field label="Islem Yonu">
              <Select
                value={form.islemYonu}
                onValueChange={(v) => setForm({ ...form, islemYonu: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISLEM_YONU_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Yontem">
              <Select
                value={form.yontem}
                onValueChange={(v) => setForm({ ...form, yontem: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YONTEM_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {form.yontem === "IBAN" && (
              <Field label="IBAN" span2>
                <Input
                  value={form.iban ?? ""}
                  onChange={(e) => setForm({ ...form, iban: e.target.value })}
                />
              </Field>
            )}
            {form.yontem === "HESAP" && (
              <Field label="Karsi Hesap No" span2>
                <Input
                  value={form.karsiHesapNo ?? ""}
                  onChange={(e) => setForm({ ...form, karsiHesapNo: e.target.value })}
                />
              </Field>
            )}
            <Field label="IYM Banka Hesabi">
              <Input
                value={form.iymBankaHesabi ?? ""}
                onChange={(e) => setForm({ ...form, iymBankaHesabi: e.target.value })}
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
              Islem Talebi Olustur
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
