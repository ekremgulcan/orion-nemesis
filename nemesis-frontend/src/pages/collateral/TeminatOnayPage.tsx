import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  approveCollateralTransfer,
  cancelCollateralTransfer,
  fetchCollateralTransfers,
  poolCollateralTransfer,
  reviseCollateralTransfer,
  type CollateralTransferDto,
} from "@/api/collateral"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { StatusBadge } from "@/components/status-badge"
import { KpiCard } from "@/components/kpi-card"
import { CHART_TOOLTIP_STYLE, STATUS_CHART_COLOR, CHART_COLORS } from "@/lib/chart-colors"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { DetailAside } from "@/components/layout/DetailAside"

type TabKey = "bekleyen" | "dosyali" | "takasHatali" | "tamamlanan" | "problemli"

const TABS: { key: TabKey; label: string }[] = [
  { key: "bekleyen", label: "Transfer Talepleri" },
  { key: "dosyali", label: "Dosyali/Dosyasiz Islemler" },
  { key: "takasHatali", label: "Takas WebServis Hatali Talepler" },
  { key: "tamamlanan", label: "Tamamlanmis/Iptal Edilmis Transferler" },
  { key: "problemli", label: "Problem Yonetimindeki Transferler" },
]

type ActionKind = "approve" | "cancel" | "revise" | "pool"

const ACTION_LABELS: Record<ActionKind, string> = {
  approve: "Onayla",
  cancel: "Iptal",
  revise: "Revizyon",
  pool: "Havuz",
}

const ACTION_CONFIRM_TEXT: Record<ActionKind, string> = {
  approve: "Bu transfer talebini onaylamak istediginize emin misiniz? Kaynak depodan varlik dusulup hedef depoya eklenecektir.",
  cancel: "Bu transfer talebini iptal etmek istediginize emin misiniz?",
  revise: "Bu talebi revizyona gondermek istediginize emin misiniz?",
  pool: "Bu talebi havuza gondermek istediginize emin misiniz?",
}

export function TeminatOnayPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Teminat Onay Ekrani")
  }, [setTitle])

  const [activeTab, setActiveTab] = useState<TabKey>("bekleyen")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null)

  const queryClient = useQueryClient()

  const { data: allTransfers = [], isLoading } = useQuery({
    queryKey: ["collateral-transfers"],
    queryFn: () => fetchCollateralTransfers(),
  })

  const grouped = useMemo(() => {
    return {
      bekleyen: allTransfers.filter((t) => t.durum === "BEKLEMEDE"),
      dosyali: allTransfers.filter((t) => t.dosyaliMi),
      takasHatali: allTransfers.filter((t) => t.durum === "TAKAS_HATALI"),
      tamamlanan: allTransfers.filter((t) => t.durum === "TAMAMLANDI" || t.durum === "IPTAL"),
      problemli: allTransfers.filter(
        (t) => t.durum === "PROBLEM" || t.durum === "REVIZYONDA" || t.durum === "HAVUZDA"
      ),
    } satisfies Record<TabKey, CollateralTransferDto[]>
  }, [allTransfers])

  const rows = grouped[activeTab]
  const selected = allTransfers.find((t) => t.id === selectedId) ?? null

  // KPI / donut data - derived client-side from the already-fetched list,
  // no extra API calls (see data-visualization.md).
  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of allTransfers) {
      counts.set(t.durum, (counts.get(t.durum) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([durum, count]) => ({ durum, count }))
      .sort((a, b) => b.count - a.count)
  }, [allTransfers])

  const toplamMiktar = useMemo(
    () => allTransfers.reduce((sum, t) => sum + t.miktar, 0),
    [allTransfers]
  )
  const dosyaliSayisi = allTransfers.filter((t) => t.dosyaliMi).length

  const mutation = useMutation({
    mutationFn: async (action: ActionKind) => {
      if (!selected) return
      if (action === "approve") await approveCollateralTransfer(selected.id)
      if (action === "cancel") await cancelCollateralTransfer(selected.id)
      if (action === "revise") await reviseCollateralTransfer(selected.id)
      if (action === "pool") await poolCollateralTransfer(selected.id)
    },
    onSuccess: () => {
      toast.success("Islem tamamlandi.")
      queryClient.invalidateQueries({ queryKey: ["collateral-transfers"] })
      setPendingAction(null)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Islem sirasinda hata olustu"))
      setPendingAction(null)
    },
  })

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: tabs + data table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Toplam Talep" value={allTransfers.length.toString()} />
            <KpiCard label="Bekleyen" value={grouped.bekleyen.length.toString()} tone="warning" />
            <KpiCard label="Dosyali Islem" value={dosyaliSayisi.toString()} tone="info" />
            <KpiCard
              label="Toplam Miktar"
              value={toplamMiktar.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
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

        <div className="border-b border-border px-6 py-3">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TabKey); setSelectedId(null) }}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 data-active:bg-accent-muted data-active:text-accent"
                >
                  {tab.label} ({grouped[tab.key].length})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Hesap No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead className="w-36">Teminat Tipi</TableHead>
                  <TableHead className="w-24">Kaynak</TableHead>
                  <TableHead className="w-24">Hedef</TableHead>
                  <TableHead className="w-28 text-right">Miktar</TableHead>
                  <TableHead className="w-28 text-center">Durum</TableHead>
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
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
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
                    <TableCell>{row.teminatTipi}</TableCell>
                    <TableCell>{row.kaynakDepo}</TableCell>
                    <TableCell>{row.hedefDepo}</TableCell>
                    <TableCell className="text-right font-mono tnum">
                      {row.miktar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </TableCell>
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
                <DetailRow label="Teminat Tipi" value={selected.teminatTipi} />
                <DetailRow label="Kaynak Depo" value={selected.kaynakDepo} />
                <DetailRow label="Hedef Depo" value={selected.hedefDepo} />
                {selected.instrumentSymbol && (
                  <DetailRow label="Enstruman" value={selected.instrumentSymbol} mono />
                )}
                {selected.paraBirimi && <DetailRow label="Para Birimi" value={selected.paraBirimi} />}
                <DetailRow
                  label="Miktar"
                  value={selected.miktar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  mono
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Piyasa / Saklama
                </p>
                <DetailRow label="Piyasa" value={selected.piyasa} />
                <DetailRow label="Saklamaci" value={selected.saklamaci} />
                <DetailRow label="Dosyali mi" value={selected.dosyaliMi ? "Evet" : "Hayir"} />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Talep / Onay
                </p>
                <DetailRow label="Talep Eden" value={selected.talepEdenKullaniciAdi ?? "-"} />
                <DetailRow
                  label="Talep Tarihi"
                  value={new Date(selected.talepTarihi).toLocaleString("tr-TR")}
                />
                {selected.onaylayanKullaniciAdi && (
                  <DetailRow label="Onaylayan" value={selected.onaylayanKullaniciAdi} />
                )}
                {selected.onayTarihi && (
                  <DetailRow
                    label="Onay Tarihi"
                    value={new Date(selected.onayTarihi).toLocaleString("tr-TR")}
                  />
                )}
                {selected.aciklama && <DetailRow label="Aciklama" value={selected.aciklama} />}
              </div>
            </div>

            {selected.durum === "BEKLEMEDE" && (
              <div className="mt-auto flex flex-wrap gap-2 border-t border-border px-6 py-4">
                <Button
                  className="flex-1 bg-success text-white hover:bg-success/90"
                  onClick={() => setPendingAction("approve")}
                >
                  Onayla
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setPendingAction("cancel")}>
                  Iptal
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-warning/40 text-warning hover:bg-warning-muted"
                  onClick={() => setPendingAction("revise")}
                >
                  Revizyon
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-info/40 text-info hover:bg-info-muted"
                  onClick={() => setPendingAction("pool")}
                >
                  Havuz
                </Button>
              </div>
            )}
          </div>
        )}
      </DetailAside>

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction ? ACTION_LABELS[pendingAction] : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction ? ACTION_CONFIRM_TEXT[pendingAction] : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Vazgec</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAction && mutation.mutate(pendingAction)}
              disabled={mutation.isPending}
            >
              Evet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
