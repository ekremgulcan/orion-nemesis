import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  startGunbasi,
  startGunici,
  surecBaslat,
  type CreditOptimizationResultDto,
  type OptimizationRunResponse,
} from "@/api/creditOptimization"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

const nf = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pf = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type TabKey = "uygun" | "uygunDegil"

function resultRows(rows: CreditOptimizationResultDto[]) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Hesap No</TableHead>
          <TableHead>Hesap Adi</TableHead>
          <TableHead className="w-32 text-right">Ser. Bakiye</TableHead>
          <TableHead className="w-28 text-right">Ozk. Orani</TableHead>
          <TableHead className="w-32 text-right">Yeni Ozk. Orani</TableHead>
          <TableHead className="w-24 text-center">Uygulandi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-foreground-muted">
              No Rows To Show
            </TableCell>
          </TableRow>
        )}
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono">{row.hesapNo}</TableCell>
            <TableCell>{row.hesapAdi}</TableCell>
            <TableCell className="text-right font-mono tnum">{nf.format(row.serbestBakiye)}</TableCell>
            <TableCell className="text-right font-mono tnum">
              %{pf.format(row.mevcutOzkaynakOrani)}
            </TableCell>
            <TableCell className="text-right font-mono tnum">
              %{pf.format(row.yeniOzkaynakOrani)}
            </TableCell>
            <TableCell className="text-center">
              <span
                className={
                  row.uygulandi
                    ? "inline-block h-2.5 w-2.5 rounded-full bg-success"
                    : "inline-block h-2.5 w-2.5 rounded-full bg-foreground-faint"
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani"
 * (kredi-optimizasyon.zul / KrediOptimizasyonViewModel). Not a CRUD
 * screen - a batch workflow: user enters a target equity ratio, runs
 * GUNBASI/GUNICI optimization over all credit accounts, reviews the
 * UYGUN / UYGUN_DEGIL split, then triggers "Surec Baslat" to auto-adjust
 * credit balances for accounts below target. State (run id + result
 * lists) lives in local React state rather than react-query cache,
 * since it's a one-shot action-triggered workflow, not a fetchable
 * resource.
 */
export function KrediOptimizasyonPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Kredi Islemleri")
  }, [setTitle])

  const [ozkaynakOrani, setOzkaynakOrani] = useState("35")
  const [activeTab, setActiveTab] = useState<TabKey>("uygun")
  const [runResult, setRunResult] = useState<OptimizationRunResponse | null>(null)
  const [confirmSurec, setConfirmSurec] = useState(false)

  const gunbasiMutation = useMutation({
    mutationFn: (oran: number) => startGunbasi(oran),
    onSuccess: (data) => {
      setRunResult(data)
      toast.success(
        `Gunbasi optimizasyonu tamamlandi (${data.uygunHaleGelenler.length} hesap uygun hale geldi)`
      )
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Islem sirasinda hata olustu"))
    },
  })

  const guniciMutation = useMutation({
    mutationFn: (oran: number) => startGunici(oran),
    onSuccess: (data) => {
      setRunResult(data)
      toast.success(
        `Gunici optimizasyonu tamamlandi (${data.uygunHaleGelenler.length} hesap uygun hale geldi)`
      )
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Islem sirasinda hata olustu"))
    },
  })

  const surecMutation = useMutation({
    mutationFn: (runId: number) => surecBaslat(runId),
    onSuccess: (data) => {
      setRunResult((prev) => (prev ? { ...data, run: prev.run } : data))
      setConfirmSurec(false)
      toast.success(
        `${data.uygulananSayisi ?? 0} kredi hesabi icin kredi bakiyesi hedef ozkaynak oranina gore guncellendi`
      )
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Islem sirasinda hata olustu"))
      setConfirmSurec(false)
    },
  })

  function handleStart(kind: "gunbasi" | "gunici") {
    const oran = Number(ozkaynakOrani)
    if (Number.isNaN(oran)) {
      toast.error("Ozkaynak orani sayisal bir deger olmalidir")
      return
    }
    if (kind === "gunbasi") gunbasiMutation.mutate(oran)
    else guniciMutation.mutate(oran)
  }

  function handleTemizle() {
    setRunResult(null)
  }

  const uygunHaleGelenler = runResult?.uygunHaleGelenler ?? []
  const uygunHaleGelmeyenler = runResult?.uygunHaleGelmeyenler ?? []
  const isBusy = gunbasiMutation.isPending || guniciMutation.isPending || surecMutation.isPending

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4">
        <p className="text-xs text-foreground-faint">
          Hedef ozkaynak oranina gore tum kredi hesaplarini tarayip UYGUN / UYGUN_DEGIL olarak
          siniflandirir. Uygun olmayan hesaplar icin "Surec Baslat" kredi bakiyesini hedefe gore
          otomatik duzeltir.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-foreground-muted">Ozkaynak Orani (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={ozkaynakOrani}
              onChange={(e) => setOzkaynakOrani(e.target.value)}
              className="w-32"
            />
          </div>
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            onClick={() => handleStart("gunbasi")}
            disabled={isBusy}
          >
            Gunbasi Islemlerini Baslat ve Listeyi Getir
          </Button>
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            onClick={() => handleStart("gunici")}
            disabled={isBusy}
          >
            Gunici Islemlerini Baslat ve Listeyi Getir
          </Button>
          <Button variant="outline" onClick={handleTemizle} disabled={isBusy}>
            Secimi Temizle
          </Button>
          <Button
            className="ml-auto bg-success text-white hover:bg-success/90"
            onClick={() => setConfirmSurec(true)}
            disabled={!runResult || uygunHaleGelmeyenler.length === 0 || isBusy}
          >
            Secilenler icin Surec Baslat ({uygunHaleGelmeyenler.length})
          </Button>
        </div>

        {runResult?.run && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Gun Tipi" value={runResult.run.gunTipi} />
            <KpiCard label="Hedef Oran" value={`%${pf.format(runResult.run.hedefOzkaynakOrani)}`} />
            <KpiCard
              label="Uygun"
              value={uygunHaleGelenler.length.toString()}
              tone="success"
            />
            <KpiCard
              label="Uygun Degil"
              value={uygunHaleGelmeyenler.length.toString()}
              tone="warning"
            />
          </div>
        )}
      </div>

      <div className="border-b border-border px-6 py-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="uygun">
              Uygun Hale Gelenler ({uygunHaleGelenler.length})
            </TabsTrigger>
            <TabsTrigger value="uygunDegil">
              Uygun Hale Gelmeyenler ({uygunHaleGelmeyenler.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="min-w-max rounded-lg border border-border bg-surface">
          {activeTab === "uygun" ? resultRows(uygunHaleGelenler) : resultRows(uygunHaleGelmeyenler)}
        </div>
      </div>

      <AlertDialog open={confirmSurec} onOpenChange={(open) => !open && setConfirmSurec(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Surec Baslat</AlertDialogTitle>
            <AlertDialogDescription>
              {uygunHaleGelmeyenler.length} hesap icin kredi bakiyesi, hedef ozkaynak oranina gore
              otomatik olarak guncellenecektir. Devam etmek istediginize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmSurec(false)}>Vazgec</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runResult?.run && surecMutation.mutate(runResult.run.id)}
              disabled={surecMutation.isPending || !runResult?.run}
            >
              Evet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
