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
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold">Musteri Bilgileri</h3>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-between gap-8 px-6 py-6">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{field.label}</p>
            <p className="mt-1.5 text-lg font-semibold">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
