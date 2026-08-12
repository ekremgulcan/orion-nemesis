import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchAccountBalances } from "@/api/balances"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-colors"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { DetailAside } from "@/components/layout/DetailAside"

function formatMoney(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
}

export function NakitYonetimiPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Nakit Yonetimi")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ["account-balances", query],
    queryFn: () => fetchAccountBalances(query || undefined),
  })

  const selected = balances.find((b) => b.id === selectedId) ?? null

  // KPI / chart data - derived client-side from the already-fetched list,
  // no extra API calls (see data-visualization.md).
  const toplamBakiye = useMemo(
    () => balances.reduce((sum, b) => sum + b.bakiye, 0),
    [balances]
  )
  const toplamBlokeli = useMemo(
    () => balances.reduce((sum, b) => sum + b.blokeliBakiye, 0),
    [balances]
  )
  const topAccounts = useMemo(
    () =>
      [...balances]
        .sort((a, b) => b.bakiye - a.bakiye)
        .slice(0, 6)
        .map((b) => ({ hesapNo: b.hesapNo, bakiye: b.bakiye }))
        .reverse(),
    [balances]
  )

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: search + balances table */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            <div className="grid flex-1 grid-cols-3 gap-3">
              <KpiCard label="Hesap Sayisi" value={balances.length.toString()} />
              <KpiCard
                label="Toplam Bakiye"
                value={toplamBakiye.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                tone="success"
              />
              <KpiCard
                label="Toplam Blokeli"
                value={toplamBlokeli.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                tone="warning"
              />
            </div>
            {topAccounts.length > 2 && (
              <div className="h-24 min-w-[220px] shrink-0 rounded-lg border border-border bg-surface p-2 lg:w-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAccounts} layout="vertical" margin={{ left: 0, right: 12, top: 2, bottom: 2 }}>
                    <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="hesapNo"
                      tick={{ fill: CHART_COLORS.foregroundMuted, fontSize: 10 }}
                      width={52}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="bakiye" fill={CHART_COLORS.accent} radius={[0, 3, 3, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <p className="text-xs text-foreground-faint">
            Para giris/cikis ve virman islemleri Faz 4+ kapsaminda eklenecektir. Asagida hesap
            bazli bakiye durumu gosterilmektedir.
          </p>
          <Input
            placeholder="Hesap No / Musteri ile ara..."
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
                  <TableHead className="w-36 text-right">Bakiye</TableHead>
                  <TableHead className="w-36 text-right">Blokeli Bakiye</TableHead>
                  <TableHead className="w-44">Guncelleme Tarihi</TableHead>
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
                {!isLoading && balances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {balances.map((row) => (
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
                    <TableCell className="text-right font-mono tnum">
                      {formatMoney(row.bakiye)}
                    </TableCell>
                    <TableCell className="text-right font-mono tnum">
                      {formatMoney(row.blokeliBakiye)}
                    </TableCell>
                    <TableCell className="text-xs text-foreground-muted">
                      {new Date(row.guncellemeTarihi).toLocaleString("tr-TR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right column: selected account detail */}
      <DetailAside>
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir hesap secin</p>
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
                Bakiye Durumu
              </p>
              <DetailRow label="Bakiye" value={formatMoney(selected.bakiye)} mono />
              <DetailRow label="Blokeli Bakiye" value={formatMoney(selected.blokeliBakiye)} mono />
              <DetailRow
                label="Kullanilabilir Bakiye"
                value={formatMoney(selected.bakiye - selected.blokeliBakiye)}
                mono
                highlight
              />
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
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span
        className={
          highlight
            ? "font-mono text-base font-semibold text-accent tnum"
            : mono
            ? "font-mono text-sm font-medium tnum"
            : "text-sm font-medium"
        }
      >
        {value}
      </span>
    </div>
  )
}
