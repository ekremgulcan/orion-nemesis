import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchCampaigns } from "@/api/campaigns"
import {
  sendBulkMessage,
  type AliciGrubu,
  type BulkMessageRequestDto,
  type BulkMessageResultDto,
  type MesajIcerigiTipi,
  type MesajYontemi,
} from "@/api/bulkMessages"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DetailAside } from "@/components/layout/DetailAside"

const ALICI_GRUBU_OPTIONS: { value: AliciGrubu; label: string }[] = [
  { value: "HEPSI", label: "Hepsi" },
  { value: "ONAYLAYANLAR", label: "Onaylayanlar" },
  { value: "ONAYLAMAYANLAR", label: "Onaylamayanlar" },
  { value: "AKSIYON_ALMAYANLAR", label: "Aksiyon Almayanlar" },
]

const YONTEM_OPTIONS: { value: MesajYontemi; label: string }[] = [
  { value: "EMAIL", label: "E-Mail" },
  { value: "SMS", label: "SMS" },
]

function emptyForm(): BulkMessageRequestDto {
  return {
    campaignId: null,
    aliciGrubu: "BELIRLI_HESAPLAR",
    belirliHesaplar: "",
    yontem: "SMS",
    mesajIcerigiTipi: "SABLON",
    yeniMesajIcerigi: "",
  }
}

/**
 * "Toplu Mesaj Gonder" (crm/toplu-mesaj-gonder.zul / TopluMesajViewModel).
 * This is an action-only screen - no CRUD/table, just a form that
 * triggers a bulk send. Two sidebar entries ("Musteri Iletisim Panosu"
 * and "CRM") both route here (see menu-registry.ts).
 */
export function TopluMesajGonderPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Toplu Mesaj Gonder")
  }, [setTitle])

  const [form, setForm] = useState<BulkMessageRequestDto>(emptyForm())
  const [lastResult, setLastResult] = useState<BulkMessageResultDto | null>(null)

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  })

  const sendMutation = useMutation({
    mutationFn: (body: BulkMessageRequestDto) => sendBulkMessage(body),
    onSuccess: (result) => {
      setLastResult(result)
      if (result.gonderilenSayisi === 0) {
        toast.warning("Secilen kriterlere uyan hesap bulunamadi, mesaj gonderilemedi.")
      } else {
        toast.success(result.mesaj)
      }
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Gonderim sirasinda hata olustu"))
    },
  })

  const selectedCampaign = campaigns.find((c) => c.id === form.campaignId) ?? null

  function handleSubmit() {
    sendMutation.mutate(form)
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Middle column: bulk message form */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto border-r border-border">
        <div className="flex flex-col gap-1 border-b border-border px-6 py-4">
          <p className="text-sm font-medium text-foreground">Toplu Mesaj Gonder</p>
          <p className="text-xs text-foreground-faint">
            Secilen kampanya ve alici kriterlerine gore hesaplara toplu E-Mail / SMS gonderir.
          </p>
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          {/* Kampanya */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-foreground-muted">Kampanya</Label>
            <Select
              value={form.campaignId != null ? String(form.campaignId) : undefined}
              onValueChange={(v) => setForm({ ...form, campaignId: v ? Number(v) : null })}
              disabled={campaignsLoading}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Kampanya seciniz">
                  {selectedCampaign ? selectedCampaign.kampanyaAdi : "Kampanya seciniz"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.kampanyaAdi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alicilar */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-foreground-muted">Alicilar</Label>
            <RadioGroup
              value={form.aliciGrubu}
              onValueChange={(v) => setForm({ ...form, aliciGrubu: v as AliciGrubu })}
              className="gap-3"
            >
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {ALICI_GRUBU_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={opt.value} />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 pt-2 text-sm whitespace-nowrap">
                  <RadioGroupItem value="BELIRLI_HESAPLAR" />
                  Belirli Hesaplar:
                </label>
                <Textarea
                  rows={3}
                  className="max-w-md"
                  placeholder="Hesap numaralarini virgul veya yeni satirla giriniz"
                  value={form.belirliHesaplar}
                  onChange={(e) => setForm({ ...form, belirliHesaplar: e.target.value })}
                  disabled={form.aliciGrubu !== "BELIRLI_HESAPLAR"}
                />
              </div>
            </RadioGroup>
          </div>

          {/* Yontem */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-foreground-muted">Yontem</Label>
            <RadioGroup
              value={form.yontem}
              onValueChange={(v) => setForm({ ...form, yontem: v as MesajYontemi })}
            >
              <div className="flex gap-6">
                {YONTEM_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={opt.value} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Mesaj Icerigi */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-foreground-muted">Mesaj Icerigi</Label>
            <RadioGroup
              value={form.mesajIcerigiTipi}
              onValueChange={(v) => setForm({ ...form, mesajIcerigiTipi: v as MesajIcerigiTipi })}
              className="gap-3"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="SABLON" />
                E-Mail/SMS Sablonuyla Ayni
              </label>
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 pt-2 text-sm whitespace-nowrap">
                  <RadioGroupItem value="YENI" />
                  Yeni:
                </label>
                <Textarea
                  rows={3}
                  className="max-w-md"
                  value={form.yeniMesajIcerigi}
                  onChange={(e) => setForm({ ...form, yeniMesajIcerigi: e.target.value })}
                  disabled={form.mesajIcerigiTipi !== "YENI"}
                />
              </div>
            </RadioGroup>
          </div>

          <div>
            <Button onClick={handleSubmit} disabled={sendMutation.isPending}>
              Gonder
            </Button>
          </div>
        </div>
      </div>

      {/* Right column: campaign info + last send result */}
      <DetailAside>
        {!selectedCampaign && !lastResult && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-faint">
              i
            </div>
            <p className="text-sm text-foreground-muted">Bir kampanya secin</p>
          </div>
        )}

        {(selectedCampaign || lastResult) && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {selectedCampaign && (
              <div className="border-b border-border px-6 py-4">
                <p className="text-xs text-foreground-muted">Kampanya</p>
                <p className="text-lg font-semibold">{selectedCampaign.kampanyaAdi}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={
                      selectedCampaign.durum === "AKTIF"
                        ? "inline-block h-2 w-2 rounded-full bg-success"
                        : "inline-block h-2 w-2 rounded-full bg-foreground-faint"
                    }
                  />
                  <span className="text-xs text-foreground-muted">{selectedCampaign.durum}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <DetailRow
                    label="Baslangic"
                    value={new Date(selectedCampaign.baslangicTarihi).toLocaleDateString("tr-TR")}
                  />
                  {selectedCampaign.bitisTarihi && (
                    <DetailRow
                      label="Bitis"
                      value={new Date(selectedCampaign.bitisTarihi).toLocaleDateString("tr-TR")}
                    />
                  )}
                </div>
              </div>
            )}

            {lastResult && (
              <div className="flex flex-col gap-2 px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Son Gonderim Sonucu
                </p>
                <p
                  className={
                    lastResult.gonderilenSayisi > 0
                      ? "text-sm font-medium text-success"
                      : "text-sm font-medium text-warning"
                  }
                >
                  {lastResult.mesaj}
                </p>
              </div>
            )}
          </div>
        )}
      </DetailAside>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
