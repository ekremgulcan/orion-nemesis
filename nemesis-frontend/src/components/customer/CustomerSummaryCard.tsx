/**
 * Reusable "Musteri Bilgileri" ozet paneli - ZK karsiligindaki
 * common/musteri-bilgi-paneli.zul macro'suyla ayni fikir. Musteri Adi/
 * TCKN-VKN/Durum her zaman sabit; `extra` ile ekrana ozgu ek alanlar
 * (orn. bu ekranda "Son Guncelleme") eklenebilir - boylece bilesen
 * notification-preferences'a baglanmadan genel kalir.
 */
export interface CustomerSummaryCardProps {
  musteriAdi: string
  tcknVkn: string
  durum: string
  extra?: { label: string; value: string }[]
}

export function CustomerSummaryCard({ musteriAdi, tcknVkn, durum, extra }: CustomerSummaryCardProps) {
  const fields = [
    { label: "Musteri Adi", value: musteriAdi },
    { label: "TCKN / VKN", value: tcknVkn },
    { label: "Durum", value: durum },
    ...(extra ?? []),
  ]

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="rounded-t-lg bg-info px-4 py-2.5 text-sm font-semibold text-white">
        Musteri Bilgileri
      </div>
      <div className="flex flex-wrap justify-between gap-6 p-4">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs text-foreground-muted">{field.label}</p>
            <p className="text-sm font-semibold">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
