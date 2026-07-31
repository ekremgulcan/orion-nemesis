import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createReportDefinition,
  deleteReportDefinition,
  fetchReportDefinitions,
  updateReportDefinition,
  ZAMANLAMA_OPTIONS,
  type ReportDefinitionDto,
  type ReportDefinitionFormDto,
} from "@/api/reportDefinitions"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

function emptyForm(): ReportDefinitionFormDto {
  return { raporAdi: "", raporSinifi: "", zamanlama: "MANUEL", mailGonder: false, icerik: "" }
}

function formFromReport(report: ReportDefinitionDto): ReportDefinitionFormDto {
  return {
    raporAdi: report.raporAdi,
    raporSinifi: report.raporSinifi,
    zamanlama: report.zamanlama,
    mailGonder: report.mailGonder,
    icerik: report.icerik ?? "",
  }
}

/**
 * "Rapor Tanimlari" (report/rapor-tanimlari.zul /
 * RaporTanimlariViewModel). Same-page create/edit form (not a modal in
 * the original ZK screen, but promoted to a Dialog here for layout
 * consistency with the rest of the app) plus a searchable list with
 * Duzenle/Sil actions per row.
 */
export function RaporTanimlariPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Rapor Yonetimi")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ReportDefinitionFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<ReportDefinitionDto | null>(null)

  const queryClient = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["report-definitions", query],
    queryFn: () => fetchReportDefinitions(query || undefined),
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(report: ReportDefinitionDto) {
    setEditingId(report.id)
    setForm(formFromReport(report))
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (body: ReportDefinitionFormDto) =>
      editingId != null ? updateReportDefinition(editingId, body) : createReportDefinition(body),
    onSuccess: (saved) => {
      toast.success(`Rapor kaydedildi: ${saved.raporAdi}`)
      queryClient.invalidateQueries({ queryKey: ["report-definitions"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteReportDefinition(id),
    onSuccess: () => {
      toast.success("Rapor silindi.")
      queryClient.invalidateQueries({ queryKey: ["report-definitions"] })
      setDeleteTarget(null)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Silme sirasinda hata olustu"))
      setDeleteTarget(null)
    },
  })

  const mailliSayisi = reports.filter((r) => r.mailGonder).length
  const otomatikSayisi = reports.filter((r) => r.zamanlama !== "MANUEL").length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <section className="flex flex-col gap-3 px-6 py-4">
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <KpiCard label="Toplam Rapor" value={reports.length.toString()} />
          <KpiCard label="Mail Gonderilen" value={mailliSayisi.toString()} tone="success" />
          <KpiCard label="Otomatik Zamanlamali" value={otomatikSayisi.toString()} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Input
            placeholder="Rapor Adi / Rapor Sinifi ile ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openCreate}>Yeni Rapor</Button>
        </div>

        <div className="min-w-max rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rapor Adi</TableHead>
                <TableHead>Rapor Sinifi</TableHead>
                <TableHead className="w-28">Zamanlama</TableHead>
                <TableHead className="w-24 text-center">Mail Gonder</TableHead>
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
              {!isLoading && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                    No Rows To Show
                  </TableCell>
                </TableRow>
              )}
              {reports.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.raporAdi}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground-muted">
                    {row.raporSinifi}
                  </TableCell>
                  <TableCell>{row.zamanlama}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        row.mailGonder
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
            <DialogTitle>{editingId != null ? "Raporu Duzenle" : "Yeni Rapor"}</DialogTitle>
            <DialogDescription>Rapor tanimi bilgilerini girin.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Rapor Adi" span2>
              <Input
                value={form.raporAdi}
                onChange={(e) => setForm({ ...form, raporAdi: e.target.value })}
              />
            </Field>
            <Field label="Rapor Sinifi" span2>
              <Input
                placeholder="com.orion.report.OrnekRaporu"
                value={form.raporSinifi}
                onChange={(e) => setForm({ ...form, raporSinifi: e.target.value })}
                className="font-mono"
              />
            </Field>
            <Field label="Zamanlama">
              <Select
                value={form.zamanlama}
                onValueChange={(v) => setForm({ ...form, zamanlama: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ZAMANLAMA_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mail Gonder">
              <label className="flex h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.mailGonder}
                  onChange={(e) => setForm({ ...form, mailGonder: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                Mail ile gonder
              </label>
            </Field>
            <Field label="Icerik" span2>
              <Textarea
                rows={6}
                value={form.icerik}
                onChange={(e) => setForm({ ...form, icerik: e.target.value })}
              />
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
            <AlertDialogTitle>Rapor Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `${deleteTarget.raporAdi} raporunu silmek istediginize emin misiniz?` : ""}
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
