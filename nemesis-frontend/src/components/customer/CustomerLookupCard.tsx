import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Reusable "Musteri No arama" kutusu - Musteri Bildirim Tercihleri ekraninin
 * ZK karsiligindaki common/musteri-sorgulama-kutusu.zul macro'suyla ayni
 * fikri React tarafinda saglar. Kasitli olarak tamamen "dumb"/presentational:
 * kendi fetch mantigini icermez, hangi ucnoktayi/ne zaman cagiracagina karar
 * vermek her sayfanin kendi isi - boylece ileride "musteri no girip bir
 * seyler getirme" ihtiyaci olan her yeni ekran, kendi veri katmanini
 * degistirmeden bu ayni bileseni kullanabilir.
 */
export interface CustomerLookupCardProps {
  musteriNo: string
  onMusteriNoChange: (value: string) => void
  onSearch: () => void
  loading?: boolean
  error?: string | null
}

export function CustomerLookupCard({
  musteriNo,
  onMusteriNoChange,
  onSearch,
  loading,
  error,
}: CustomerLookupCardProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Musteri Sorgulama</h3>
      </div>
      {/* justify-center: when paired next to the (taller) Musteri Bilgileri
          card in a stretched flex row, this keeps the search field vertically
          centered in the extra height instead of pinned to the top with
          dead space below. */}
      <div className="flex flex-1 flex-col justify-center gap-2 p-4">
        <Label className="text-xs font-medium text-foreground">Musteri No</Label>
        <div className="flex gap-2">
          <Input
            value={musteriNo}
            onChange={(e) => onMusteriNoChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Musteri numarasini giriniz"
            className="w-64"
          />
          <Button onClick={onSearch} disabled={loading} size="icon">
            <Search />
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  )
}
