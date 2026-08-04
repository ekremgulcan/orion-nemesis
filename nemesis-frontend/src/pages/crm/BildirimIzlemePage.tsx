import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  exportNotificationEvents,
  fetchNotificationEvents,
  type NotificationEventDto,
} from "@/api/notificationEvents"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { StatusBadge } from "@/components/status-badge"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type TabKey = "bugun" | "gecmis"

interface GecmisFilterForm {
  dateFrom: string
  dateTo: string
  hesapNo: string
  kullaniciAdi: string
  status: string // "" | SUCCESS | FAIL
  notifHeader: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function emptyGecmisFilters(): GecmisFilterForm {
  return { dateFrom: "", dateTo: yesterdayIso(), hesapNo: "", kullaniciAdi: "", status: "", notifHeader: "" }
}

/**
 * Converts the form state into API query params, omitting blank fields
 * entirely (rather than sending empty strings) - dateFrom/dateTo in
 * particular must be omitted when blank since the backend's LocalDate
 * param can't parse an empty string.
 */
function toApiFilters(form: GecmisFilterForm) {
  return {
    status: form.status || undefined,
    dateFrom: form.dateFrom || undefined,
    dateTo: form.dateTo || undefined,
    hesapNo: form.hesapNo || undefined,
    kullaniciAdi: form.kullaniciAdi || undefined,
    notifHeader: form.notifHeader || undefined,
  }
}

/**
 * "Bildirim Izleme Ekrani" (notification/bildirim-izleme.zul /
 * BildirimIzlemeViewModel). Two tabs backed by the same paginated
 * GET /notification/events endpoint - "Bugunku Bildirimler" fixes the
 * date range to today with no other filters, "Gecmis Bildirimler"
 * defaults to no start date / end date = yesterday (shows everything
 * through yesterday - "gecmis" = the past, so today's events belong on
 * the other tab, and this also avoids looking empty right after a seed
 * whose most recent rows are dated in the past rather than today) and
 * exposes the full filter set (date range in the toolbar, per-column
 * filters for the fields the backend actually supports: Yatirimci No,
 * Kullanici Adi, Bildirim Tipi, Durum - message/id/uuid columns have no
 * backend filter, so they intentionally get no filter input rather than
 * a decorative one that wouldn't work). Filters only apply on "Listele",
 * matching every other search screen in this app (no live-as-you-type
 * filtering anywhere else either).
 */
export function BildirimIzlemePage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Bildirim Izleme")
  }, [setTitle])

  const today = useMemo(() => todayIso(), [])
  const [activeTab, setActiveTab] = useState<TabKey>("bugun")
  const [pageSize, setPageSize] = useState(20)
  const [bugunPage, setBugunPage] = useState(0)
  const [gecmisPage, setGecmisPage] = useState(0)
  const [gecmisForm, setGecmisForm] = useState<GecmisFilterForm>(emptyGecmisFilters)
  const [gecmisFilters, setGecmisFilters] = useState<GecmisFilterForm>(gecmisForm)
  const [selected, setSelected] = useState<NotificationEventDto | null>(null)
  const [exporting, setExporting] = useState(false)

  const bugunQuery = useQuery({
    queryKey: ["notification-events", "bugun", today, bugunPage, pageSize],
    queryFn: () => fetchNotificationEvents({ dateFrom: today, dateTo: today }, bugunPage, pageSize),
  })

  const gecmisQuery = useQuery({
    queryKey: ["notification-events", "gecmis", gecmisFilters, gecmisPage, pageSize],
    queryFn: () => fetchNotificationEvents(toApiFilters(gecmisFilters), gecmisPage, pageSize),
  })

  const activeQuery = activeTab === "bugun" ? bugunQuery : gecmisQuery
  const rows = activeQuery.data?.content ?? []
  const totalElements = activeQuery.data?.totalElements ?? 0
  const activePage = activeTab === "bugun" ? bugunPage : gecmisPage
  const totalPages = activeQuery.data?.totalPages ?? 0

  function setActivePage(page: number) {
    if (activeTab === "bugun") setBugunPage(page)
    else setGecmisPage(page)
  }

  function handleListele() {
    setGecmisFilters(gecmisForm)
    setGecmisPage(0)
  }

  function handleTemizle() {
    const cleared = emptyGecmisFilters()
    setGecmisForm(cleared)
    setGecmisFilters(cleared)
    setGecmisPage(0)
  }

  async function handleRaporOlustur() {
    setExporting(true)
    try {
      const filters = activeTab === "bugun" ? { dateFrom: today, dateTo: today } : toApiFilters(gecmisFilters)
      await exportNotificationEvents(filters)
      toast.success("Rapor olusturuldu.")
    } catch (error) {
      toast.error(extractErrorMessage(error, "Rapor olusturulurken hata olustu"))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: tabs + filters + table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-1 border-b border-border px-6 py-4">
          <p className="text-sm font-medium text-foreground">Bildirim Izleme Ekrani</p>
          <p className="text-xs text-foreground-faint">
            Hesap/kullanici bazinda gonderilen emir bildirimlerinin gonderim log kaydi.
          </p>
        </div>

        <div className="border-b border-border px-6 py-3">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as TabKey)
              setSelected(null)
            }}
          >
            <TabsList>
              <TabsTrigger value="bugun">Bugunku Bildirimler</TabsTrigger>
              <TabsTrigger value="gecmis">
                Gecmis Bildirimler {activeTab === "gecmis" ? `(${totalElements})` : ""}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "gecmis" && (
          <div className="flex flex-wrap items-end gap-3 border-b border-border px-6 py-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-foreground-muted">Baslangic</Label>
              <Input
                type="date"
                value={gecmisForm.dateFrom}
                onChange={(e) => setGecmisForm({ ...gecmisForm, dateFrom: e.target.value })}
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-foreground-muted">Bitis</Label>
              <Input
                type="date"
                value={gecmisForm.dateTo}
                onChange={(e) => setGecmisForm({ ...gecmisForm, dateTo: e.target.value })}
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-foreground-muted">Sayfa Basina Satir</Label>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setGecmisPage(0) }}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleListele}>Listele</Button>
            <Button variant="outline" onClick={handleTemizle}>Temizle</Button>
            <Button
              className="ml-auto bg-success text-white hover:bg-success/90"
              onClick={handleRaporOlustur}
              disabled={exporting}
            >
              {exporting ? "Rapor Olusturuluyor..." : "Rapor Olustur"}
            </Button>
          </div>
        )}
        {activeTab === "bugun" && (
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <p className="text-xs text-foreground-muted">{totalElements} bildirim bulundu</p>
            <Button
              className="bg-success text-white hover:bg-success/90"
              onClick={handleRaporOlustur}
              disabled={exporting}
            >
              {exporting ? "Rapor Olusturuluyor..." : "Rapor Olustur"}
            </Button>
          </div>
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Tarih</TableHead>
                  <TableHead className="w-28">Saat</TableHead>
                  <TableHead className="w-20">Yatirimci No</TableHead>
                  <TableHead className="w-32">Kullanici Adi</TableHead>
                  <TableHead className="w-56">Bildirim Tipi</TableHead>
                  <TableHead className="min-w-72 w-full">Mesaj</TableHead>
                  <TableHead className="w-24 text-center">Durum</TableHead>
                  <TableHead className="w-16 text-right">Deneme</TableHead>
                  <TableHead className="w-20 text-right">Bildirim Id</TableHead>
                  <TableHead className="w-16 text-right">Sablon Id</TableHead>
                </TableRow>
                {activeTab === "gecmis" && (
                  <TableRow>
                    <TableHead />
                    <TableHead />
                    <TableHead>
                      <Input
                        placeholder="Kriter Giriniz.."
                        className="h-7 text-xs"
                        value={gecmisForm.hesapNo}
                        onChange={(e) => setGecmisForm({ ...gecmisForm, hesapNo: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleListele()}
                      />
                    </TableHead>
                    <TableHead>
                      <Input
                        placeholder="Kriter Giriniz.."
                        className="h-7 text-xs"
                        value={gecmisForm.kullaniciAdi}
                        onChange={(e) => setGecmisForm({ ...gecmisForm, kullaniciAdi: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleListele()}
                      />
                    </TableHead>
                    <TableHead>
                      <Input
                        placeholder="Kriter Giriniz.."
                        className="h-7 text-xs"
                        value={gecmisForm.notifHeader}
                        onChange={(e) => setGecmisForm({ ...gecmisForm, notifHeader: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleListele()}
                      />
                    </TableHead>
                    <TableHead />
                    <TableHead>
                      <Select
                        value={gecmisForm.status || "HEPSI"}
                        onValueChange={(v) => setGecmisForm({ ...gecmisForm, status: !v || v === "HEPSI" ? "" : v })}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HEPSI">Hepsi</SelectItem>
                          <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                          <SelectItem value="FAIL">FAIL</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead />
                    <TableHead />
                    <TableHead />
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {activeQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-foreground-muted">
                      Yukleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!activeQuery.isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow
                    key={row.eventId}
                    onClick={() => setSelected(row)}
                    data-state={row.eventId === selected?.eventId ? "selected" : undefined}
                    className={
                      row.eventId === selected?.eventId
                        ? "cursor-pointer bg-accent-muted/60"
                        : "cursor-pointer"
                    }
                  >
                    <TableCell className="font-mono tnum">{row.logDate}</TableCell>
                    <TableCell className="font-mono tnum">
                      {new Date(row.created).toLocaleTimeString("tr-TR")}
                    </TableCell>
                    <TableCell className="font-mono tnum">{row.investorNo}</TableCell>
                    <TableCell>{row.target}</TableCell>
                    <TableCell>{row.notifHeader}</TableCell>
                    <TableCell className="max-w-96 truncate text-foreground-muted" title={row.notifMessage}>
                      {row.notifMessage}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge durum={row.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono tnum">{row.retryCount}</TableCell>
                    <TableCell className="text-right font-mono tnum">{row.eventId}</TableCell>
                    <TableCell className="text-right font-mono tnum">{row.templateId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-3">
              <p className="text-xs text-foreground-muted">
                Sayfa {activePage + 1} / {totalPages} - Toplam {totalElements} kayit
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage === 0}
                  onClick={() => setActivePage(activePage - 1)}
                >
                  Onceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage + 1 >= totalPages}
                  onClick={() => setActivePage(activePage + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column: selected notification detail */}
      <aside className="hidden w-96 shrink-0 flex-col bg-surface lg:flex">
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir bildirim secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Bildirim Id</p>
              <p className="font-mono text-lg font-semibold tnum">{selected.eventId}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.notifHeader}</p>
              <div className="mt-3">
                <StatusBadge durum={selected.status} />
              </div>
            </div>

            <div className="flex flex-col gap-6 px-6 py-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Hesap / Kullanici
                </p>
                <DetailRow label="Yatirimci No" value={selected.investorNo} mono />
                <DetailRow label="Kullanici Adi" value={selected.target} />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Mesaj
                </p>
                <p className="text-sm">{selected.notifMessage}</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Gonderim Bilgisi
                </p>
                <DetailRow label="Tarih" value={selected.logDate} mono />
                <DetailRow label="Saat" value={new Date(selected.created).toLocaleTimeString("tr-TR")} mono />
                <DetailRow label="Deneme Adedi" value={String(selected.retryCount)} mono />
                {selected.errorDescription && (
                  <DetailRow label="Hata Mesaji" value={selected.errorDescription} />
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Kimlik Bilgileri
                </p>
                <DetailRow label="Sablon Id" value={String(selected.templateId)} mono />
                <DetailRow label="Bildirim Log ID (UUID)" value={selected.uuid} mono />
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs text-foreground-muted">{label}</span>
      <span className={mono ? "break-all text-right font-mono text-sm font-medium tnum" : "text-right text-sm font-medium"}>
        {value}
      </span>
    </div>
  )
}
