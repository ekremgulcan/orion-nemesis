import { useEffect, useRef, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  confirmTopluGuncelleme,
  createHisseRiskParametresi,
  deleteHisseRiskParametresi,
  downloadTopluGuncellemeSablonu,
  exportHisseRiskParametreleri,
  fetchHisseRiskParametreleri,
  lookupAccount,
  previewTopluGuncelleme,
  updateHisseRiskParametresi,
  type HisseRiskParametresiDto,
  type HisseRiskParametreleriFilters,
  type NetVarlikCarpaniTopluSatirDto,
} from "@/api/hisseRiskParametreleri"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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

const KULLANICI_TIPI_OPTIONS = ["Musteri", "Yatirim Danismani"]
const HESAP_TIPI_OPTIONS = ["Musteri", "Portfoy"]
const KONTROL_TIPI_OPTIONS = ["SPK Kontrollu", "Nakit Kontrolu", "Kontrolsuz"]
const CARPAN_OPTIONS = [1, 2, 3, 4, 5]

interface FormState {
  id: number | null
  hesapNo: string
  musteriNo: string
  musteriAdi: string
  // Legacy ZK screen shows this combobox unlocked in "Yeni Ekle" mode but
  // never actually persists it (hesap tipi is always read live off
  // account.hesapMusteriTipi) - kept here purely for display parity, not
  // sent in HisseRiskParametresiFormDto.
  hesapTipi: string
  kullaniciTipi: string
  alisKontrolTipi: string
  satisKontrolTipi: string
  acikSatisKontrolTipi: string
  acikTakasLimiti: number
  acigaSatisLimiti: number
  netVarlikLimitCarpani: number
  kredisizGrupAAlisYapabilir: boolean
  grupBAlisYapabilir: boolean
  grupCAlisYapabilir: boolean
  grupDAlisYapabilir: boolean
  kredisizGrupANakitKontrol: boolean
  grupBNakitKontrol: boolean
  grupCNakitKontrol: boolean
  grupDNakitKontrol: boolean
  kredisizPaylardaKontrolsuzSatis: boolean
}

function emptyForm(): FormState {
  return {
    id: null,
    hesapNo: "",
    musteriNo: "",
    musteriAdi: "",
    hesapTipi: "",
    kullaniciTipi: "",
    alisKontrolTipi: "",
    satisKontrolTipi: "",
    acikSatisKontrolTipi: "",
    acikTakasLimiti: 0,
    acigaSatisLimiti: 0,
    netVarlikLimitCarpani: 1,
    kredisizGrupAAlisYapabilir: false,
    grupBAlisYapabilir: false,
    grupCAlisYapabilir: false,
    grupDAlisYapabilir: false,
    kredisizGrupANakitKontrol: false,
    grupBNakitKontrol: false,
    grupCNakitKontrol: false,
    grupDNakitKontrol: false,
    kredisizPaylardaKontrolsuzSatis: false,
  }
}

function formToRow(row: HisseRiskParametresiDto): FormState {
  return {
    id: row.id,
    hesapNo: row.hesapNo,
    musteriNo: row.musteriNo,
    musteriAdi: row.musteriAdi,
    hesapTipi: row.hesapTipi,
    kullaniciTipi: row.kullaniciTipi,
    alisKontrolTipi: row.alisKontrolTipi,
    satisKontrolTipi: row.satisKontrolTipi,
    acikSatisKontrolTipi: row.acikSatisKontrolTipi,
    acikTakasLimiti: row.acikTakasLimiti,
    acigaSatisLimiti: row.acigaSatisLimiti,
    netVarlikLimitCarpani: row.netVarlikLimitCarpani,
    kredisizGrupAAlisYapabilir: row.kredisizGrupAAlisYapabilir,
    grupBAlisYapabilir: row.grupBAlisYapabilir,
    grupCAlisYapabilir: row.grupCAlisYapabilir,
    grupDAlisYapabilir: row.grupDAlisYapabilir,
    kredisizGrupANakitKontrol: row.kredisizGrupANakitKontrol,
    grupBNakitKontrol: row.grupBNakitKontrol,
    grupCNakitKontrol: row.grupCNakitKontrol,
    grupDNakitKontrol: row.grupDNakitKontrol,
    kredisizPaylardaKontrolsuzSatis: row.kredisizPaylardaKontrolsuzSatis,
  }
}

function BoolDot({ value }: { value: boolean }) {
  return (
    <span
      className={
        value
          ? "inline-block h-2.5 w-2.5 rounded-full bg-success"
          : "inline-block h-2.5 w-2.5 rounded-full bg-foreground-faint"
      }
    />
  )
}

/**
 * "Hisse Risk Parametreleri" (risk/hisse-risk-parametreleri.zul /
 * HisseRiskParametreleriViewModel). Middle column: search + 17-column
 * risk-profile table (horizontally scrollable, matching every field the
 * ZK listbox shows). Right column: create/edit form - identity fields
 * (Kullanici Tipi/Hesap Tipi/Musteri No/Hesap No/Musteri Adi) are
 * read-only when editing an existing row, fully unlocked in "Yeni Ekle"
 * mode (exact ZK behavior). "Net Varlik Limit Carpani Toplu Guncelleme"
 * (Excel upload -> preview -> confirm) is its own dialog, triggered from
 * the toolbar - a genuinely separate multi-step workflow, not a detail
 * view of one record.
 */
export function HisseRiskParametreleriPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Hisse Risk Parametreleri")
  }, [setTitle])

  const queryClient = useQueryClient()

  // --- Arama / liste ---
  const [draftFilters, setDraftFilters] = useState<HisseRiskParametreleriFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<HisseRiskParametreleriFilters>({})
  const [exporting, setExporting] = useState(false)

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["hisse-risk-parametreleri", appliedFilters],
    queryFn: () => fetchHisseRiskParametreleri(appliedFilters),
  })

  function sorgula() {
    setAppliedFilters(draftFilters)
  }

  function temizle() {
    setDraftFilters({})
    setAppliedFilters({})
  }

  // --- Detay formu (Yeni Ekle / Duzenle) ---
  const [formOpen, setFormOpen] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<HisseRiskParametresiDto | null>(null)

  function openCreate() {
    setIsCreate(true)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(row: HisseRiskParametresiDto) {
    setIsCreate(false)
    setForm(formToRow(row))
    setFormOpen(true)
  }

  const lookupMutation = useMutation({
    mutationFn: (hesapNo: string) => lookupAccount(hesapNo),
    onSuccess: (data) => {
      setForm((prev) => ({ ...prev, musteriNo: data.musteriNo, musteriAdi: data.musteriAdi, hesapTipi: data.hesapTipi }))
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Hesap bulunamadi"))
    },
  })

  const saveMutation = useMutation({
    mutationFn: (state: FormState) => {
      const body = {
        hesapNo: state.hesapNo,
        kullaniciTipi: state.kullaniciTipi,
        alisKontrolTipi: state.alisKontrolTipi,
        satisKontrolTipi: state.satisKontrolTipi,
        acikSatisKontrolTipi: state.acikSatisKontrolTipi,
        acikTakasLimiti: state.acikTakasLimiti,
        acigaSatisLimiti: state.acigaSatisLimiti,
        netVarlikLimitCarpani: state.netVarlikLimitCarpani,
        kredisizGrupAAlisYapabilir: state.kredisizGrupAAlisYapabilir,
        grupBAlisYapabilir: state.grupBAlisYapabilir,
        grupCAlisYapabilir: state.grupCAlisYapabilir,
        grupDAlisYapabilir: state.grupDAlisYapabilir,
        kredisizGrupANakitKontrol: state.kredisizGrupANakitKontrol,
        grupBNakitKontrol: state.grupBNakitKontrol,
        grupCNakitKontrol: state.grupCNakitKontrol,
        grupDNakitKontrol: state.grupDNakitKontrol,
        kredisizPaylardaKontrolsuzSatis: state.kredisizPaylardaKontrolsuzSatis,
      }
      return state.id != null
        ? updateHisseRiskParametresi(state.id, body)
        : createHisseRiskParametresi(body)
    },
    onSuccess: () => {
      toast.success("Risk profili kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["hisse-risk-parametreleri"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteHisseRiskParametresi(id),
    onSuccess: () => {
      toast.success("Risk profili silindi.")
      queryClient.invalidateQueries({ queryKey: ["hisse-risk-parametreleri"] })
      setDeleteTarget(null)
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Silme sirasinda hata olustu"))
      setDeleteTarget(null)
    },
  })

  async function indir() {
    setExporting(true)
    try {
      await exportHisseRiskParametreleri(appliedFilters)
      toast.success("Rapor olusturuldu.")
    } catch (error) {
      toast.error(extractErrorMessage(error, "Rapor olusturulurken hata olustu"))
    } finally {
      setExporting(false)
    }
  }

  // --- Net Varlik Limit Carpani Toplu Guncelleme (dialog) ---
  const [topluOpen, setTopluOpen] = useState(false)
  const [previewRows, setPreviewRows] = useState<NetVarlikCarpaniTopluSatirDto[]>([])
  const [previewDone, setPreviewDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function openToplu() {
    setPreviewRows([])
    setPreviewDone(false)
    setTopluOpen(true)
  }

  const previewMutation = useMutation({
    mutationFn: (file: File) => previewTopluGuncelleme(file),
    onSuccess: (data) => {
      setPreviewRows(data)
      setPreviewDone(true)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Dosya okunamadi"))
    },
  })

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      previewMutation.mutate(file)
    }
    e.target.value = ""
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmTopluGuncelleme(previewRows),
    onSuccess: (data) => {
      toast.success(`${data.guncellenen} risk profili guncellendi.`)
      queryClient.invalidateQueries({ queryKey: ["hisse-risk-parametreleri"] })
      setTopluOpen(false)
      setPreviewRows([])
      setPreviewDone(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Guncelleme sirasinda hata olustu"))
    },
  })

  const onizlemeTumuGecerli = previewRows.length > 0 && previewRows.every((r) => r.gecerli)

  const musteriSayisi = rows.filter((r) => r.kullaniciTipi === "Musteri").length
  const danismanSayisi = rows.filter((r) => r.kullaniciTipi === "Yatirim Danismani").length

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: search + risk profile table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid grid-cols-3 gap-3 sm:max-w-md">
              <KpiCard label="Toplam" value={rows.length.toString()} />
              <KpiCard label="Musteri" value={musteriSayisi.toString()} tone="info" />
              <KpiCard label="Y. Danismani" value={danismanSayisi.toString()} tone="warning" />
            </div>
            <div className="flex gap-2">
              <Button onClick={openCreate}>+ Yeni Ekle</Button>
              <Button variant="secondary" onClick={() => refetch()}>
                Yenile
              </Button>
              <Button variant="secondary" onClick={indir} disabled={exporting}>
                {exporting ? "Indiriliyor..." : "Indir"}
              </Button>
              <Button variant="outline" onClick={openToplu}>
                Toplu Net Varlik Limit Carpani Guncelleme
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-foreground-muted">Musteri No</Label>
              <Input
                value={draftFilters.musteriNo ?? ""}
                onChange={(e) => setDraftFilters({ ...draftFilters, musteriNo: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-foreground-muted">Hesap No</Label>
              <Input
                value={draftFilters.hesapNo ?? ""}
                onChange={(e) => setDraftFilters({ ...draftFilters, hesapNo: e.target.value })}
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-foreground-muted">Kullanici Tipi</Label>
              <Select
                value={draftFilters.kullaniciTipi ?? "TUMU"}
                onValueChange={(v) =>
                  setDraftFilters({ ...draftFilters, kullaniciTipi: v && v !== "TUMU" ? v : undefined })
                }
              >
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUMU">Tumu</SelectItem>
                  {KULLANICI_TIPI_OPTIONS.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sorgula}>Sorgula</Button>
            <Button variant="destructive" onClick={temizle}>Temizle</Button>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Kullanici Tipi</TableHead>
                  <TableHead className="w-20">Hesap Tipi</TableHead>
                  <TableHead className="w-24">Hesap No</TableHead>
                  <TableHead className="w-24">Musteri No</TableHead>
                  <TableHead>Musteri Adi</TableHead>
                  <TableHead className="w-28">Alis Kontrol</TableHead>
                  <TableHead className="w-28">Satis Kontrol</TableHead>
                  <TableHead className="w-28">Acik Satis Kontrol</TableHead>
                  <TableHead className="w-20 text-center">Kredisiz A</TableHead>
                  <TableHead className="w-12 text-center">B</TableHead>
                  <TableHead className="w-12 text-center">C</TableHead>
                  <TableHead className="w-12 text-center">D</TableHead>
                  <TableHead className="w-24 text-center">Kredisiz A Nakit</TableHead>
                  <TableHead className="w-16 text-center">B Nakit</TableHead>
                  <TableHead className="w-16 text-center">C Nakit</TableHead>
                  <TableHead className="w-16 text-center">D Nakit</TableHead>
                  <TableHead className="w-24 text-center">Kontrolsuz Satis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={17} className="py-10 text-center text-foreground-muted">
                      Yukleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={17} className="py-10 text-center text-foreground-muted">
                      No Rows To Show
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => openEdit(row)}
                    className={
                      form.id === row.id && formOpen
                        ? "cursor-pointer bg-accent-muted/60"
                        : "cursor-pointer"
                    }
                  >
                    <TableCell>{row.kullaniciTipi}</TableCell>
                    <TableCell>{row.hesapTipi}</TableCell>
                    <TableCell className="font-mono">{row.hesapNo}</TableCell>
                    <TableCell className="font-mono">{row.musteriNo}</TableCell>
                    <TableCell className="text-foreground-muted">{row.musteriAdi}</TableCell>
                    <TableCell>{row.alisKontrolTipi}</TableCell>
                    <TableCell>{row.satisKontrolTipi}</TableCell>
                    <TableCell>{row.acikSatisKontrolTipi}</TableCell>
                    <TableCell className="text-center"><BoolDot value={row.kredisizGrupAAlisYapabilir} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.grupBAlisYapabilir} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.grupCAlisYapabilir} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.grupDAlisYapabilir} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.kredisizGrupANakitKontrol} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.grupBNakitKontrol} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.grupCNakitKontrol} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.grupDNakitKontrol} /></TableCell>
                    <TableCell className="text-center"><BoolDot value={row.kredisizPaylardaKontrolsuzSatis} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right column: Risk Profili Guncelleme (Yeni Ekle / Duzenle) */}
      <DetailAside title="Risk Profili">
        {!formOpen && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir kayit secin veya Yeni Ekle ile olusturun</p>
          </div>
        )}

        {formOpen && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">
                {isCreate ? "Yeni Kayit" : "Duzenleniyor"}
              </p>
              <p className="font-mono text-lg font-semibold">
                {form.hesapNo || "Hesap No girin"}
              </p>
              {!isCreate && (
                <p className="mt-1 text-sm text-foreground-muted">
                  {form.musteriAdi} / {form.musteriNo}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Hesap Bilgisi
              </p>
              <Field label="Kullanici Tipi">
                <Select
                  value={form.kullaniciTipi || undefined}
                  onValueChange={(v) => setForm({ ...form, kullaniciTipi: v ?? "" })}
                  disabled={!isCreate}
                >
                  <SelectTrigger><SelectValue placeholder="Seciniz" /></SelectTrigger>
                  <SelectContent>
                    {KULLANICI_TIPI_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Hesap Tipi">
                <Select
                  value={form.hesapTipi || undefined}
                  onValueChange={(v) => setForm({ ...form, hesapTipi: v ?? "" })}
                  disabled={!isCreate}
                >
                  <SelectTrigger><SelectValue placeholder="Seciniz" /></SelectTrigger>
                  <SelectContent>
                    {HESAP_TIPI_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Hesap No">
                <div className="flex gap-2">
                  <Input
                    value={form.hesapNo}
                    onChange={(e) => setForm({ ...form, hesapNo: e.target.value })}
                    disabled={!isCreate}
                  />
                  {isCreate && (
                    <Button
                      variant="secondary"
                      onClick={() => lookupMutation.mutate(form.hesapNo)}
                      disabled={!form.hesapNo || lookupMutation.isPending}
                    >
                      Bul
                    </Button>
                  )}
                </div>
              </Field>
              <Field label="Musteri No">
                <Input value={form.musteriNo} disabled className="font-mono" />
              </Field>
              <Field label="Musteri Adi">
                <Input value={form.musteriAdi} disabled />
              </Field>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Kontrol Tipleri
              </p>
              <Field label="Alis Kontrol">
                <Select value={form.alisKontrolTipi || undefined} onValueChange={(v) => setForm({ ...form, alisKontrolTipi: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Seciniz" /></SelectTrigger>
                  <SelectContent>
                    {KONTROL_TIPI_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Satis Kontrol">
                <Select value={form.satisKontrolTipi || undefined} onValueChange={(v) => setForm({ ...form, satisKontrolTipi: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Seciniz" /></SelectTrigger>
                  <SelectContent>
                    {KONTROL_TIPI_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Acik Satis Kontrol">
                <Select value={form.acikSatisKontrolTipi || undefined} onValueChange={(v) => setForm({ ...form, acikSatisKontrolTipi: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Seciniz" /></SelectTrigger>
                  <SelectContent>
                    {KONTROL_TIPI_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Limitler
              </p>
              <Field label="Acik Takas Limiti">
                <Input
                  type="number"
                  step="0.01"
                  className="text-right tnum"
                  value={form.acikTakasLimiti}
                  onChange={(e) => setForm({ ...form, acikTakasLimiti: Number(e.target.value) })}
                  onBlur={(e) => setForm({ ...form, acikTakasLimiti: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Aciga Satis Limiti">
                <Input
                  type="number"
                  step="0.01"
                  className="text-right tnum"
                  value={form.acigaSatisLimiti}
                  onChange={(e) => setForm({ ...form, acigaSatisLimiti: Number(e.target.value) })}
                  onBlur={(e) => setForm({ ...form, acigaSatisLimiti: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Net Varlik Limit Carpani">
                <Select
                  value={String(form.netVarlikLimitCarpani)}
                  onValueChange={(v) => setForm({ ...form, netVarlikLimitCarpani: Number(v ?? 1) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARPAN_OPTIONS.map((v) => (
                      <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Grup Bazinda Alis / Nakit Kontrol
              </p>
              <ToggleRow
                label="Kredisiz A Grubu Alis Yapabilir"
                checked={form.kredisizGrupAAlisYapabilir}
                onChange={(v) => setForm({ ...form, kredisizGrupAAlisYapabilir: v })}
              />
              <ToggleRow
                label="B Grubu Alis Yapabilir"
                checked={form.grupBAlisYapabilir}
                onChange={(v) => setForm({ ...form, grupBAlisYapabilir: v })}
              />
              <ToggleRow
                label="C Grubu Alis Yapabilir"
                checked={form.grupCAlisYapabilir}
                onChange={(v) => setForm({ ...form, grupCAlisYapabilir: v })}
              />
              <ToggleRow
                label="D Grubu Alis Yapabilir"
                checked={form.grupDAlisYapabilir}
                onChange={(v) => setForm({ ...form, grupDAlisYapabilir: v })}
              />
              <div className="my-1 border-t border-border" />
              <ToggleRow
                label="Kredisiz A Grubu Nakit Kontrol"
                checked={form.kredisizGrupANakitKontrol}
                onChange={(v) => setForm({ ...form, kredisizGrupANakitKontrol: v })}
              />
              <ToggleRow
                label="B Grubu Nakit Kontrol"
                checked={form.grupBNakitKontrol}
                onChange={(v) => setForm({ ...form, grupBNakitKontrol: v })}
              />
              <ToggleRow
                label="C Grubu Nakit Kontrol"
                checked={form.grupCNakitKontrol}
                onChange={(v) => setForm({ ...form, grupCNakitKontrol: v })}
              />
              <ToggleRow
                label="D Grubu Nakit Kontrol"
                checked={form.grupDNakitKontrol}
                onChange={(v) => setForm({ ...form, grupDNakitKontrol: v })}
              />
              <div className="my-1 border-t border-border" />
              <ToggleRow
                label="Kredisiz Paylarda Kontrolsuz Satis"
                checked={form.kredisizPaylardaKontrolsuzSatis}
                onChange={(v) => setForm({ ...form, kredisizPaylardaKontrolsuzSatis: v })}
              />
            </div>

            <div className="mt-auto flex gap-2 border-t border-border px-6 py-4">
              {!isCreate && (
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    const current = rows.find((r) => r.id === form.id)
                    if (current) setDeleteTarget(current)
                  }}
                >
                  Sil
                </Button>
              )}
              <Button className="flex-1" variant="outline" onClick={() => setFormOpen(false)}>
                Kapat
              </Button>
              <Button
                className="flex-1"
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending}
              >
                Kaydet
              </Button>
            </div>
          </div>
        )}
      </DetailAside>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu risk profili silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `${deleteTarget.hesapNo} / ${deleteTarget.musteriAdi} kaydi silinecek.` : ""}
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

      {/* Net Varlik Limit Carpani Toplu Guncelleme dialog */}
      <Dialog open={topluOpen} onOpenChange={setTopluOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Net Varlik Limit Carpani Toplu Guncelleme</DialogTitle>
            <DialogDescription>
              Excel&apos;de 2 sutun beklenir: Hesap No (A) ve Net Varlik Limit Carpani (B, 1-5
              arasi). Bir Hesap No&apos;ya bagli Musteri VE Yatirim Danismani kaydi varsa ikisi de
              guncellenir.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadTopluGuncellemeSablonu()}>
              Sablon Indir
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={onFileSelected}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={previewMutation.isPending}>
              {previewMutation.isPending ? "Yukleniyor..." : "Excel Yukle"}
            </Button>
            {previewDone && (
              <Button
                variant="destructive"
                onClick={() => {
                  setPreviewRows([])
                  setPreviewDone(false)
                }}
              >
                Onizlemeyi Temizle
              </Button>
            )}
          </div>

          {previewDone && (
            <div className="rounded-lg border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hesap No</TableHead>
                    <TableHead>Eski Net Varlik Limit Carpani</TableHead>
                    <TableHead>Yeni Net Varlik Limit Carpani</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-foreground-muted">
                        Henuz bir Excel yuklenmedi
                      </TableCell>
                    </TableRow>
                  )}
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{row.hesapNo}</TableCell>
                      <TableCell>{row.eskiDeger ?? "-"}</TableCell>
                      <TableCell>{row.yeniDeger ?? "-"}</TableCell>
                      <TableCell className={row.gecerli ? "text-success" : "font-medium text-danger"}>
                        {row.durum}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {previewDone && !onizlemeTumuGecerli && (
            <p className="text-sm font-medium text-danger">
              Onizlemede gecersiz satirlar var (kirmizi) - Onaya Gonder icin oncelikle Excel
              dosyasini duzeltip tekrar yukleyin.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTopluOpen(false)}>
              Kapat
            </Button>
            {previewDone && (
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={!onizlemeTumuGecerli || confirmMutation.isPending}
              >
                Onaya Gonder
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-foreground-muted">{label}</Label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
