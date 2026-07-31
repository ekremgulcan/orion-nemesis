import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  fetchRiskProfiles,
  fetchUserLimits,
  type RiskProfileDto,
  type UserLimitDto,
} from "@/api/riskProfiles"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const nf = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
 * "Yeni Hisse Emir Yonetimi" / "Sabit Getiri Risk Tanimlama"
 * (risk-parametreleri.zul / RiskParametreleriViewModel). Read-only:
 * shows RiskProfile (alis/satis/acik satis + 4 group cash controls) and
 * UserLimit (daily total + single-order limit) side by side, filtered
 * by enstruman tipi (HISSE/SGMK) via tabs.
 */
export function RiskParametreleriPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Yeni Hisse Emir Yonetimi")
  }, [setTitle])

  const [tip, setTip] = useState<"HISSE" | "SGMK">("HISSE")
  const [query, setQuery] = useState("")

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["risk-profiles", tip, query],
    queryFn: () => fetchRiskProfiles(tip, query || undefined),
  })

  const { data: limits = [] } = useQuery({
    queryKey: ["user-limits", tip, query],
    queryFn: () => fetchUserLimits(tip, query || undefined),
  })

  // KPI strip derived client-side from the already-fetched list, no
  // extra API calls (see data-visualization.md). Boolean-heavy data,
  // no chart needed.
  const aktifSayisi = useMemo(() => profiles.filter((p) => p.aktif).length, [profiles])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
        <p className="text-xs text-foreground-faint">
          Bu ekran salt-okunurdur. Risk profili ve kullanici limiti tanimlari, ilgili
          kaydin ait oldugu hesap/kullanici uzerinden yonetilir.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tip} onValueChange={(v) => setTip(v as "HISSE" | "SGMK")}>
            <TabsList>
              <TabsTrigger value="HISSE">Hisse</TabsTrigger>
              <TabsTrigger value="SGMK">Sabit Getiri (SGMK)</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
            <KpiCard label="Risk Profili" value={profiles.length.toString()} />
            <KpiCard label="Aktif" value={aktifSayisi.toString()} tone="success" />
          </div>
        </div>
        <Input
          placeholder="Kullanici / Hesap No ile ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Risk Profilleri
            </h3>
            <div className="min-w-max rounded-lg border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanici</TableHead>
                    <TableHead className="w-28">Hesap No</TableHead>
                    <TableHead className="w-16 text-center">Alis</TableHead>
                    <TableHead className="w-16 text-center">Satis</TableHead>
                    <TableHead className="w-20 text-center">Acik Satis</TableHead>
                    <TableHead className="w-16 text-center">Grup A</TableHead>
                    <TableHead className="w-16 text-center">Grup B</TableHead>
                    <TableHead className="w-16 text-center">Grup C</TableHead>
                    <TableHead className="w-16 text-center">Grup D</TableHead>
                    <TableHead className="w-16 text-center">Aktif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profilesLoading && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-foreground-muted">
                        Yukleniyor...
                      </TableCell>
                    </TableRow>
                  )}
                  {!profilesLoading && profiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-foreground-muted">
                        Kayit bulunamadi
                      </TableCell>
                    </TableRow>
                  )}
                  {profiles.map((row: RiskProfileDto) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.userName}</TableCell>
                      <TableCell className="font-mono">{row.hesapNo}</TableCell>
                      <TableCell className="text-center"><BoolDot value={row.alisKontrol} /></TableCell>
                      <TableCell className="text-center"><BoolDot value={row.satisKontrol} /></TableCell>
                      <TableCell className="text-center"><BoolDot value={row.acikSatisKontrol} /></TableCell>
                      <TableCell className="text-center"><BoolDot value={row.grupANakitKontrol} /></TableCell>
                      <TableCell className="text-center"><BoolDot value={row.grupBNakitKontrol} /></TableCell>
                      <TableCell className="text-center"><BoolDot value={row.grupCNakitKontrol} /></TableCell>
                      <TableCell className="text-center"><BoolDot value={row.grupDNakitKontrol} /></TableCell>
                      <TableCell className="text-center"><BoolDot value={row.aktif} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Kullanici Limitleri
            </h3>
            <div className="min-w-max rounded-lg border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanici</TableHead>
                    <TableHead className="text-right">Gunluk Toplam Limit</TableHead>
                    <TableHead className="text-right">Anlik Islem Limiti</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-foreground-muted">
                        Kayit bulunamadi
                      </TableCell>
                    </TableRow>
                  )}
                  {limits.map((row: UserLimitDto) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.userName}</TableCell>
                      <TableCell className="text-right font-mono tnum">
                        {nf.format(row.gunlukToplamLimit)}
                      </TableCell>
                      <TableCell className="text-right font-mono tnum">
                        {nf.format(row.anlikIslemLimiti)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
