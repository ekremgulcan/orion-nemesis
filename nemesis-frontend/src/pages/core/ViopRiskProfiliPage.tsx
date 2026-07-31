import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createViopRiskProfile,
  deleteViopRiskProfile,
  fetchViopRiskProfiles,
  updateViopRiskProfile,
  type ViopRiskProfileDto,
  type ViopRiskProfileFormDto,
} from "@/api/viopRiskProfiles"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-colors"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

// Not a fixed vocabulary (profil adi is free text), so colors are
// assigned by first-seen order from a small fixed palette rather than a
// static name->color map.
const PROFIL_COLOR_PALETTE = [
  CHART_COLORS.accent,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.muted,
]

function emptyForm(): ViopRiskProfileFormDto {
  return {
    hesapNo: "",
    profilAdi: "",
    carpan: 1,
  }
}

function formFromProfile(profile: ViopRiskProfileDto): ViopRiskProfileFormDto {
  return {
    hesapNo: profile.hesapNo,
    profilAdi: profile.profilAdi,
    carpan: profile.carpan,
  }
}

export function ViopRiskProfiliPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("VIOP Risk Profili Tanim")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ViopRiskProfileFormDto>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<ViopRiskProfileDto | null>(null)

  const queryClient = useQueryClient()

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["viop-risk-profiles", query],
    queryFn: () => fetchViopRiskProfiles(query || undefined),
  })

  const selected = profiles.find((p) => p.id === selectedId) ?? null

  // KPI strip + profile breakdown donut - derived client-side from the
  // already-fetched list, no extra API calls (see data-visualization.md).
  const ortalamaCarpan = useMemo(() => {
    if (profiles.length === 0) return 0
    return profiles.reduce((sum, p) => sum + p.carpan, 0) / profiles.length
  }, [profiles])

  const profilBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of profiles) {
      counts.set(p.profilAdi, (counts.get(p.profilAdi) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([profilAdi, count]) => ({ profilAdi, count }))
      .sort((a, b) => b.count - a.count)
  }, [profiles])

  const profilColorOf = useMemo(() => {
    const map = new Map<string, string>()
    profilBreakdown.forEach((entry, idx) => {
      map.set(entry.profilAdi, PROFIL_COLOR_PALETTE[idx % PROFIL_COLOR_PALETTE.length])
    })
    return map
  }, [profilBreakdown])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(profile: ViopRiskProfileDto) {
    setEditingId(profile.id)
    setForm(formFromProfile(profile))
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (body: ViopRiskProfileFormDto) =>
      editingId != null ? updateViopRiskProfile(editingId, body) : createViopRiskProfile(body),
    onSuccess: () => {
      toast.success("Profil kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["viop-risk-profiles"] })
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kayit sirasinda hata olustu"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteViopRiskProfile(id),
    onSuccess: () => {
      toast.success("Profil silindi.")
      queryClient.invalidateQueries({ queryKey: ["viop-risk-profiles"] })
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
      {/* Middle column: search + profiles table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-xs">
            <KpiCard label="Toplam Profil" value={profiles.length.toString()} />
            <KpiCard label="Ortalama Carpan" value={ortalamaCarpan.toFixed(2)} tone="info" />
          </div>
          {profilBreakdown.length > 1 && (
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
              <div className="h-20 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profilBreakdown}
                      dataKey="count"
                      nameKey="profilAdi"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {profilBreakdown.map((entry) => (
                        <Cell
                          key={entry.profilAdi}
                          fill={profilColorOf.get(entry.profilAdi) ?? CHART_COLORS.muted}
                        />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-1">
                {profilBreakdown.map((entry) => (
                  <li
                    key={entry.profilAdi}
                    className="flex items-center gap-1.5 text-xs text-foreground-muted"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: profilColorOf.get(entry.profilAdi) ?? CHART_COLORS.muted }}
                    />
                    <span className="whitespace-nowrap">{entry.profilAdi}</span>
                    <span className="font-mono tnum text-foreground">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <Input
            placeholder="Hesap No / Musteri / Profil Adi ile ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openCreate}>Yeni Profil</Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Hesap No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead>Profil Adi</TableHead>
                  <TableHead className="w-24 text-right">Carpan</TableHead>
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
                {!isLoading && profiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {profiles.map((row) => (
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
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{ color: profilColorOf.get(row.profilAdi) ?? CHART_COLORS.muted }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: profilColorOf.get(row.profilAdi) ?? CHART_COLORS.muted }}
                        />
                        {row.profilAdi}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tnum">{row.carpan.toFixed(2)}</TableCell>
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

      {/* Right column: selected profile detail */}
      <aside className="hidden w-96 shrink-0 flex-col bg-surface lg:flex">
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir profil secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Hesap No</p>
              <p className="font-mono text-lg font-semibold tnum">{selected.hesapNo}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.customerName}</p>
            </div>

            <div className="flex flex-col gap-6 px-6 py-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Profil Bilgisi
                </p>
                <DetailRow
                  label="Profil Adi"
                  value={selected.profilAdi}
                  color={profilColorOf.get(selected.profilAdi)}
                />
                <DetailRow label="Carpan" value={selected.carpan.toFixed(2)} mono />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Kayit Bilgisi
                </p>
                <DetailRow
                  label="Guncelleme Tarihi"
                  value={new Date(selected.guncellemeTarihi).toLocaleString("tr-TR")}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Profili Duzenle" : "Yeni Profil"}</DialogTitle>
            <DialogDescription>
              Hesap basina en fazla bir VIOP risk profili tanimlanabilir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hesap No" span2>
              <Input
                value={form.hesapNo}
                onChange={(e) => setForm({ ...form, hesapNo: e.target.value })}
              />
            </Field>
            <Field label="Profil Adi" span2>
              <Input
                value={form.profilAdi}
                onChange={(e) => setForm({ ...form, profilAdi: e.target.value })}
              />
            </Field>
            <Field label="Carpan">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.carpan}
                onChange={(e) => setForm({ ...form, carpan: Number(e.target.value) })}
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
            <AlertDialogTitle>Profil Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.profilAdi} (${deleteTarget.hesapNo}) profilini silmek istediginize emin misiniz?`
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
