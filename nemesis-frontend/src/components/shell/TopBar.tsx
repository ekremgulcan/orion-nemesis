import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bot, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchAktifKullanici, updateAktifKullanici } from "@/api/aktifKullanici"
import { fetchUsers } from "@/api/users"

export function TopBar({
  title,
  assistantOpen,
  onToggleAssistant,
}: {
  title: string
  assistantOpen: boolean
  onToggleAssistant: () => void
}) {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries()
      toast.success("Ekran verileri yenilendi")
    } catch {
      toast.error("Yenileme başarısız")
    } finally {
      setRefreshing(false)
    }
  }

  const { data: aktifKullanici } = useQuery({
    queryKey: ["aktif-kullanici"],
    queryFn: fetchAktifKullanici,
  })

  const { data: kullaniciSecenekleri = [] } = useQuery({
    queryKey: ["users", "aktif-kullanici-secenekleri"],
    queryFn: () => fetchUsers(),
  })

  const kullaniciDegistirMutation = useMutation({
    mutationFn: updateAktifKullanici,
    onSuccess: async (yeniKullanici) => {
      queryClient.setQueryData(["aktif-kullanici"], yeniKullanici)
      // Aktif kullanici tum ekranlarin verilerini etkiler (ozellikle
      // Ana Sayfa'daki gorev listesi) - ZK tarafindaki "Ana Sayfa'yi
      // yeniden ac" davranisinin React karsiligi olarak hepsini yenile.
      await queryClient.invalidateQueries()
      // Sabit id: art arda hizli kullanici degistirmede eski toast
      // birikmek yerine tek bir toast guncellenir; kisa sure sonra
      // otomatik kapanir (varsayilan 4sn yerine).
      toast.success(`Aktif kullanici: ${yeniKullanici.adSoyad}`, {
        id: "aktif-kullanici-toast",
        duration: 1500,
      })
    },
    onError: () => toast.error("Kullanici degistirilemedi", { id: "aktif-kullanici-toast", duration: 1500 }),
  })

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="gap-2"
          title="Bu ekranın verilerini yenile"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
        <Button
          variant={assistantOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleAssistant}
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          Danışman
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-muted">Aktif Kullanıcı:</span>
          <Select
            // Base UI Select, "controlled" mi "uncontrolled" mu oldugunu
            // ILK render'da karar verir (value undefined ise uncontrolled
            // kalir ve sonraki gercek deger asla yansitilmaz - bkz.
            // konsoldaki "changing the uncontrolled value state" uyarisi).
            // Sorgular henuz yuklenmemisken value'yu undefined birakmak
            // yerine "" (bos string, hicbir secenekle eslesmez) veriyoruz
            // ki component ilk render'dan itibaren hep controlled kalsin.
            value={aktifKullanici?.kullaniciAdi ?? ""}
            onValueChange={(v) => v && kullaniciDegistirMutation.mutate(v)}
            disabled={kullaniciSecenekleri.length === 0}
          >
            <SelectTrigger className="h-8 w-40" title="Aktif kullaniciyi degistir (gecici - gercek oturum yok)">
              {/* Base UI's <Select.Value> shows the raw value string by
                  default (e.g. "ademir") - it does NOT auto-resolve to the
                  matching <SelectItem>'s label unless you pass an `items`
                  map to Select.Root or use this children-render-prop form.
                  Resolve adSoyad ourselves from the same options list. */}
              <SelectValue>
                {(value: string | null) =>
                  kullaniciSecenekleri.find((u) => u.kullaniciAdi === value)?.adSoyad ?? "Yukleniyor..."
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kullaniciSecenekleri.map((u) => (
                <SelectItem key={u.id} value={u.kullaniciAdi}>
                  {u.adSoyad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
