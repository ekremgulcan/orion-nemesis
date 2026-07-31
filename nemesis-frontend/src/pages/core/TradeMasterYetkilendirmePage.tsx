import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createChannelAuthorization,
  deleteChannelAuthorization,
  fetchChannelAuthorizations,
  updateChannelAuthorization,
  type ChannelAuthorizationDto,
  type ChannelAuthorizationFormDto,
} from "@/api/channelAuthorizations"
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

const KANAL_OPTIONS = ["TRADEMASTER", "INTERNET_SUBESI", "MOBIL", "CAGRI_MERKEZI"]
const YETKI_DURUMU_OPTIONS = ["AKTIF", "PASIF"]

// Not a status vocabulary in the shared sense, so it uses a small
// dedicated palette rather than STATUS_CHART_COLOR - still pulled from
// the same design tokens.
const KANAL_COLORS: Record<string, string> = {
  TRADEMASTER: CHART_COLORS.accent,
  INTERNET_SUBESI: CHART_COLORS.info,
  MOBIL: CHART_COLORS.success,
  CAGRI_MERKEZI: CHART_COLORS.muted,
}

function emptyForm(): ChannelAuthorizationFormDto {
  return {
    kullaniciAdi: "",
    hesapNo: "",
    kanal: "TRADEMASTER",
    yetkiDurumu: "AKTIF",
  }
}

function formFromAuth(auth: ChannelAuthorizationDto): ChannelAuthorizationFormDto {
  return {
    kullaniciAdi: auth.kullaniciAdi,
    hesapNo: auth.hesapNo,
    kanal: auth.kanal,
    yetkiDurumu: auth.yetkiDurumu,
  }
}

export function TradeMasterYetkilendirmePage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("TradeMaster Yetkilendirme")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ChannelAuthorizationFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<ChannelAuthorizationDto | null>(null)

  const queryClient = useQueryClient()

  const { data: authorizations = [], isLoading } = useQuery({
    queryKey: ["channel-authorizations", query],
    queryFn: () => fetchChannelAuthorizations(query || undefined),
  })

  const selected = authorizations.find((a) => a.id === selectedId) ?? null

  // KPI strip + channel breakdown donut - derived client-side from the
  // already-fetched list, no extra API calls (see data-visualization.md).
  const aktifSayisi = useMemo(
    () => authorizations.filter((a) => a.yetkiDurumu === "AKTIF").length,
    [authorizations]
  )
  const kanalBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of authorizations) {
      counts.set(a.kanal, (counts.get(a.kanal) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([kanal, count]) => ({ kanal, count }))
      .sort((a, b) => b.count - a.count)
  }, [authorizations])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(auth: ChannelAuthorizationDto) {
    setEditingId(auth.id)
    setForm(formFromAuth(auth))
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (body: ChannelAuthorizationFormDto) =>
      editingId != null ? updateChannelAuthorization(editingId, body) : createChannelAuthorization(body),
    onSuccess: () => {
      toast.success("Yetki kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["channel-authorizations"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChannelAuthorization(id),
    onSuccess: () => {
      toast.success("Yetki silindi.")
      queryClient.invalidateQueries({ queryKey: ["channel-authorizations"] })
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
      {/* Middle column: search + authorizations table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-xs">
            <KpiCard label="Toplam Yetki" value={authorizations.length.toString()} />
            <KpiCard label="Aktif" value={aktifSayisi.toString()} tone="success" />
          </div>
          {kanalBreakdown.length > 1 && (
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
              <div className="h-20 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kanalBreakdown}
                      dataKey="count"
                      nameKey="kanal"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {kanalBreakdown.map((entry) => (
                        <Cell key={entry.kanal} fill={KANAL_COLORS[entry.kanal] ?? CHART_COLORS.muted} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-1">
                {kanalBreakdown.map((entry) => (
                  <li key={entry.kanal} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: KANAL_COLORS[entry.kanal] ?? CHART_COLORS.muted }}
                    />
                    <span className="whitespace-nowrap">{entry.kanal}</span>
                    <span className="font-mono tnum text-foreground">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <Input
            placeholder="Kullanici Adi / Hesap No / Kanal ile ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openCreate}>Yeni Yetki</Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanici</TableHead>
                  <TableHead className="w-24">Hesap No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead className="w-36">Kanal</TableHead>
                  <TableHead className="w-24">Yetki Durumu</TableHead>
                  <TableHead className="w-40">Tanimlama Tarihi</TableHead>
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
                {!isLoading && authorizations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {authorizations.map((row) => (
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
                    <TableCell className="font-mono">{row.kullaniciAdi}</TableCell>
                    <TableCell className="font-mono tnum">{row.hesapNo}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{ color: KANAL_COLORS[row.kanal] ?? CHART_COLORS.muted }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: KANAL_COLORS[row.kanal] ?? CHART_COLORS.muted }}
                        />
                        {row.kanal}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          row.yetkiDurumu === "AKTIF"
                            ? "text-xs font-medium text-success"
                            : "text-xs font-medium text-foreground-faint"
                        }
                      >
                        {row.yetkiDurumu}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-foreground-muted">
                      {new Date(row.tanimlamaTarihi).toLocaleString("tr-TR")}
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

      {/* Right column: selected authorization detail */}
      <aside className="hidden w-96 shrink-0 flex-col bg-surface lg:flex">
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir yetki secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Kullanici</p>
              <p className="font-mono text-lg font-semibold">{selected.kullaniciAdi}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.adSoyad}</p>
              <div className="mt-3">
                <span
                  className={
                    selected.yetkiDurumu === "AKTIF"
                      ? "text-xs font-medium text-success"
                      : "text-xs font-medium text-foreground-faint"
                  }
                >
                  {selected.yetkiDurumu}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6 px-6 py-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Hesap Bilgisi
                </p>
                <DetailRow label="Hesap No" value={selected.hesapNo} mono />
                <DetailRow label="Musteri" value={selected.customerName} />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Yetki Bilgisi
                </p>
                <DetailRow
                  label="Kanal"
                  value={selected.kanal}
                  color={KANAL_COLORS[selected.kanal]}
                />
                <DetailRow
                  label="Tanimlama Tarihi"
                  value={new Date(selected.tanimlamaTarihi).toLocaleString("tr-TR")}
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
      </aside>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Yetkiyi Duzenle" : "Yeni Yetki"}</DialogTitle>
            <DialogDescription>
              Kullanici adi ve hesap no ile eslesen bir yetki tanimlayin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kullanici Adi">
              <Input
                value={form.kullaniciAdi}
                onChange={(e) => setForm({ ...form, kullaniciAdi: e.target.value })}
              />
            </Field>
            <Field label="Hesap No">
              <Input
                value={form.hesapNo}
                onChange={(e) => setForm({ ...form, hesapNo: e.target.value })}
              />
            </Field>
            <Field label="Kanal">
              <Select
                value={form.kanal}
                onValueChange={(v) => setForm({ ...form, kanal: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KANAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Yetki Durumu">
              <Select
                value={form.yetkiDurumu}
                onValueChange={(v) => setForm({ ...form, yetkiDurumu: v as string })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YETKI_DURUMU_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Yetki Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.adSoyad} / ${deleteTarget.hesapNo} yetkisini silmek istediginize emin misiniz?`
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
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
