import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchInstruments } from "@/api/instruments"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ViopKotasyonPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("VIOP Kotasyon Izleme")
  }, [setTitle])

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: instruments = [], isLoading } = useQuery({
    queryKey: ["instruments", "VIOP", query],
    queryFn: () => fetchInstruments("VIOP", query || undefined),
  })

  const selected = instruments.find((i) => i.id === selectedId) ?? null

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: search + static contract list */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-col gap-2 border-b border-border px-6 py-4">
          <p className="text-xs text-foreground-faint">
            Canli fiyat akisi Faz 4+ kapsaminda eklenecektir. Asagida statik sozlesme listesi
            gosterilmektedir.
          </p>
          <Input
            placeholder="Sembol / Ad / ISIN ile ara..."
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
                  <TableHead className="w-32">Sembol</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead className="w-40">ISIN</TableHead>
                  <TableHead className="w-24">Borsa</TableHead>
                  <TableHead className="w-20 text-center">Aktif</TableHead>
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
                {!isLoading && instruments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {instruments.map((row) => (
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
                    <TableCell className="font-mono font-medium">{row.sembol}</TableCell>
                    <TableCell>{row.ad}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground-muted">
                      {row.isin}
                    </TableCell>
                    <TableCell>{row.borsa}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          row.aktif
                            ? "inline-block h-2.5 w-2.5 rounded-full bg-success"
                            : "inline-block h-2.5 w-2.5 rounded-full bg-foreground-faint"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right column: selected contract detail */}
      <aside className="hidden w-96 shrink-0 flex-col bg-surface lg:flex">
        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir sozlesme secin</p>
          </div>
        )}

        {selected && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-foreground-muted">Sembol</p>
              <p className="font-mono text-lg font-semibold">{selected.sembol}</p>
              <p className="mt-1 text-sm text-foreground-muted">{selected.ad}</p>
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

            <div className="flex flex-col gap-2 px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Sozlesme Bilgisi
              </p>
              <DetailRow label="ISIN" value={selected.isin} mono />
              <DetailRow label="Tip" value={selected.tip} />
              <DetailRow label="Borsa" value={selected.borsa} />
            </div>
          </div>
        )}
      </aside>
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
