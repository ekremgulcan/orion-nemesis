import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  addAccountChannel,
  addAccountContract,
  addAccountControl,
  addAccountCustody,
  addAccountDerivative,
  addAccountGroup,
  addAccountHidden,
  addAccountPartner,
  addAccountProxy,
  addAccountReporting,
  addInvestorAddress,
  addInvestorBank,
  addInvestorChannel,
  addInvestorContact,
  addInvestorEducation,
  addInvestorExternalUser,
  addInvestorNote,
  addInvestorReference,
  addInvestorTest,
  applyCommissionTemplate,
  deleteInvestorNote,
  fetchAccountExtras,
  fetchInvestor,
  fetchInvestorAccounts,
  fetchInvestorBlank,
  fetchInvestorByAccount,
  saveInvestor,
  saveInvestorAccount,
  saveInvestorDocuments,
  saveInvestorWebmailer,
  type InvestorAccountDto,
  type InvestorSnapshotDto,
} from "@/api/investors"
import { extractErrorMessage } from "@/api/client"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DetailAside } from "@/components/layout/DetailAside"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-foreground-muted">{label}</span>
      {children}
    </label>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        className="h-4 w-4 accent-[--accent]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

function emptyAccount(): InvestorAccountDto {
  return {
    id: null,
    hesapNo: null,
    hesapTipi: "NAKIT",
    durum: "AKTIF",
    acilisTarihi: null,
    hesapSinifi: "Genel",
    yatirimDanismani: null,
    profilTanimi: null,
    afkKodu: "IYM",
    mpfTipi: "M",
    altSube: null,
    hesapMusteriTipi: "Musteri",
    acenta: null,
    hesapSube: "Genel Mudurluk",
    sikKullanilan: false,
    ozelSozlesme: false,
    portfoyHesabi: false,
    kolokasyonHesabi: false,
    viop: false,
    webmailerEkstre: false,
    lme: false,
    ytmHisse: false,
    ytmFon: false,
    ytmViop: false,
  }
}

export function BireyselYatirimciPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Bireysel Yatirimci Bilgileri")
  }, [setTitle])

  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [mode, setMode] = useState<"view" | "new">("view")
  const [snap, setSnap] = useState<InvestorSnapshotDto | null>(null)
  const [tab, setTab] = useState("hesaplar")
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountForm, setAccountForm] = useState<InvestorAccountDto>(emptyAccount())
  const [accountTab, setAccountTab] = useState("vekil")

  const [adresTipi, setAdresTipi] = useState("Ikametgah")
  const [adresIl, setAdresIl] = useState("")
  const [iletisimTipi, setIletisimTipi] = useState("Cep")
  const [iletisimDeger, setIletisimDeger] = useState("")
  const [notTipi, setNotTipi] = useState("Bilgi")
  const [notMetni, setNotMetni] = useState("")
  const [kanal, setKanal] = useState("Sube")
  const [disKurum, setDisKurum] = useState("")
  const [disHesapNo, setDisHesapNo] = useState("")
  const [egitimDerecesi, setEgitimDerecesi] = useState("Lisans")
  const [okul, setOkul] = useState("")
  const [referansAdi, setReferansAdi] = useState("")
  const [testTipi, setTestTipi] = useState("Yerindelik Testi")
  const [testSonucu, setTestSonucu] = useState("")
  const [disSistem, setDisSistem] = useState("")
  const [disKullanici, setDisKullanici] = useState("")
  const [vekilIsim, setVekilIsim] = useState("")
  const [vekilSoyisim, setVekilSoyisim] = useState("")
  const [komisyonDeger, setKomisyonDeger] = useState("0")
  const [hizmetTipi, setHizmetTipi] = useState("")
  const [sozlesmeAdi, setSozlesmeAdi] = useState("")
  const [grupAdi, setGrupAdi] = useState("")
  const [saklamaci, setSaklamaci] = useState("")
  const [saklamaHesapNo, setSaklamaHesapNo] = useState("")
  const [kontrolAdi, setKontrolAdi] = useState("")
  const [kontrolDegeri, setKontrolDegeri] = useState("")
  const [raporTipi, setRaporTipi] = useState("")
  const [raporKanal, setRaporKanal] = useState("E-Posta")
  const [gizliHesapNo, setGizliHesapNo] = useState("")
  const [turevIslem, setTurevIslem] = useState("")
  const [turevDeger, setTurevDeger] = useState("0")

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["investor-accounts"],
    queryFn: fetchInvestorAccounts,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter(
      (a) =>
        a.hesapNo.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        (a.tcknVkn ?? "").toLowerCase().includes(q) ||
        String(a.yatirimciNo ?? "").includes(q)
    )
  }, [accounts, query])

  const uniqueCustomers = useMemo(() => {
    const map = new Map<number, (typeof accounts)[0]>()
    for (const a of accounts) {
      if (!map.has(a.customerId)) map.set(a.customerId, a)
    }
    return [...map.values()]
  }, [accounts])

  const aktifSayisi = uniqueCustomers.filter((c) => c.yatirimciDurumu === "Aktif").length
  const pasifSayisi = uniqueCustomers.filter((c) => c.yatirimciDurumu === "Pasif").length
  const nitelikliSayisi = uniqueCustomers.filter((c) => c.nitelikliYatirimci).length
  const profesyonelSayisi = uniqueCustomers.filter((c) => c.musteriSiniflandirmasi === "Profesyonel Musteri").length

  const snapQuery = useQuery({
    queryKey: ["investor-snap", mode, selectedAccountId],
    queryFn: () => (mode === "new" ? fetchInvestorBlank() : fetchInvestorByAccount(selectedAccountId!)),
    enabled: mode === "new" || selectedAccountId != null,
  })

  useEffect(() => {
    if (snapQuery.data) setSnap(snapQuery.data)
  }, [snapQuery.data])

  const extrasQuery = useQuery({
    queryKey: ["investor-extras", accountForm.id],
    queryFn: () => fetchAccountExtras(accountForm.id!),
    enabled: accountOpen && accountForm.id != null,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["investor-accounts"] })
    queryClient.invalidateQueries({ queryKey: ["investor-snap"] })
    queryClient.invalidateQueries({ queryKey: ["investor-extras"] })
  }

  const saveMut = useMutation({
    mutationFn: () => {
      if (!snap) throw new Error("Kayit yok")
      return saveInvestor({ customer: snap.customer, identity: snap.identity })
    },
    onSuccess: (data) => {
      setSnap(data)
      setMode("view")
      invalidate()
      toast.success("Yatirimci kaydedildi.")
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Kayit sirasinda hata olustu")),
  })

  const customerId = snap?.customer.id ?? null
  const c = snap?.customer
  const idn = snap?.identity

  function patchCustomer<K extends keyof NonNullable<typeof c>>(key: K, value: NonNullable<typeof c>[K]) {
    setSnap((prev) => (prev ? { ...prev, customer: { ...prev.customer, [key]: value } } : prev))
  }

  function patchIdentity<K extends keyof NonNullable<typeof idn>>(key: K, value: NonNullable<typeof idn>[K]) {
    setSnap((prev) => (prev ? { ...prev, identity: { ...prev.identity, [key]: value } } : prev))
  }

  async function runChild(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn()
      if (selectedAccountId) {
        setSnap(await fetchInvestorByAccount(selectedAccountId))
      } else if (customerId) {
        setSnap(await fetchInvestor(customerId))
      }
      await queryClient.invalidateQueries({ queryKey: ["investor-extras"] })
      await queryClient.invalidateQueries({ queryKey: ["investor-accounts"] })
      if (ok) toast.success(ok)
    } catch (err) {
      toast.error(extractErrorMessage(err, "Islem sirasinda hata olustu"))
    }
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="grid grid-cols-2 gap-3 px-6 pt-4 sm:grid-cols-4">
          <KpiCard label="Aktif" value={String(aktifSayisi)} tone="success" />
          <KpiCard label="Pasif" value={String(pasifSayisi)} tone="warning" />
          <KpiCard label="Nitelikli" value={String(nitelikliSayisi)} tone="info" />
          <KpiCard label="Profesyonel" value={String(profesyonelSayisi)} />
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
          <Input
            placeholder="Hesap No / Musteri / TCKN / Yatirimci No"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button
            onClick={() => {
              setMode("new")
              setSelectedAccountId(null)
              setTab("hesaplar")
            }}
          >
            Yeni Yatirimci
          </Button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-max rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Hesap No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead className="w-24">Yatirimci No</TableHead>
                  <TableHead className="w-28">TCKN/YKN</TableHead>
                  <TableHead className="w-24">Durum</TableHead>
                  <TableHead className="w-28">Hesap Sinifi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-foreground-muted">
                      Yukleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-foreground-muted">
                      Kayit bulunamadi
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => {
                      setMode("view")
                      setSelectedAccountId(row.id)
                    }}
                    className={
                      row.id === selectedAccountId
                        ? "cursor-pointer bg-accent-muted/60"
                        : "cursor-pointer"
                    }
                  >
                    <TableCell className="font-mono tnum">{row.hesapNo}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell className="font-mono tnum">{row.yatirimciNo}</TableCell>
                    <TableCell className="font-mono tnum">{row.tcknVkn}</TableCell>
                    <TableCell>{row.yatirimciDurumu}</TableCell>
                    <TableCell>{row.hesapSinifi}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <DetailAside title="Yatirimci" storageKey="orion-investor-detail-width-v1">
        {!snap || (!selectedAccountId && mode !== "new") ? (
          <p className="p-4 text-sm text-foreground-muted">Listeden hesap secin veya Yeni Yatirimci ile baslayin.</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="TCKN / YKN">
                  <Input value={c?.tcknVkn ?? ""} onChange={(e) => patchCustomer("tcknVkn", e.target.value)} />
                </Field>
                <Field label="Yatirimci No">
                  <Input value={String(c?.yatirimciNo ?? 0)} readOnly className="font-mono" />
                </Field>
                <Field label="Isim">
                  <Input value={c?.isim ?? ""} onChange={(e) => patchCustomer("isim", e.target.value)} />
                </Field>
                <Field label="Soyisim">
                  <Input value={c?.soyisim ?? ""} onChange={(e) => patchCustomer("soyisim", e.target.value)} />
                </Field>
                <Field label="Baba Adi">
                  <Input value={c?.babaAdi ?? ""} onChange={(e) => patchCustomer("babaAdi", e.target.value)} />
                </Field>
                <Field label="Cinsiyet">
                  <Select value={c?.cinsiyet || "Kadin"} onValueChange={(v) => patchCustomer("cinsiyet", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kadin">Kadin</SelectItem>
                      <SelectItem value="Erkek">Erkek</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Uyruk">
                  <Input value={c?.uyruk ?? ""} onChange={(e) => patchCustomer("uyruk", e.target.value)} />
                </Field>
                <Field label="Sube">
                  <Input value={c?.sube ?? ""} onChange={(e) => patchCustomer("sube", e.target.value)} />
                </Field>
                <Field label="Dogum Yeri">
                  <Input value={c?.dogumYeri ?? ""} onChange={(e) => patchCustomer("dogumYeri", e.target.value)} />
                </Field>
                <Field label="Dogum Tarihi">
                  <Input type="date" value={c?.dogumTarihi ?? ""} onChange={(e) => patchCustomer("dogumTarihi", e.target.value)} />
                </Field>
                <Field label="Lokasyon Tipi">
                  <Input value={c?.yatirimciLokasyonTipi ?? ""} onChange={(e) => patchCustomer("yatirimciLokasyonTipi", e.target.value)} />
                </Field>
                <Field label="Vergi Mukellefiyeti">
                  <Input value={c?.vergiMukellefiyeti ?? ""} onChange={(e) => patchCustomer("vergiMukellefiyeti", e.target.value)} />
                </Field>
                <Field label="Vergi Numarasi">
                  <Input value={c?.vergiNumarasi ?? ""} onChange={(e) => patchCustomer("vergiNumarasi", e.target.value)} />
                </Field>
                <Field label="Vergi Dairesi">
                  <Input value={c?.vergiDairesi ?? ""} onChange={(e) => patchCustomer("vergiDairesi", e.target.value)} />
                </Field>
                <Field label="MKK Sicil No">
                  <Input value={c?.mkkSicilNo ?? ""} onChange={(e) => patchCustomer("mkkSicilNo", e.target.value)} />
                </Field>
                <Field label="Takasbank Sicil No">
                  <Input value={c?.takasbankSicilNo ?? ""} onChange={(e) => patchCustomer("takasbankSicilNo", e.target.value)} />
                </Field>
                <Field label="Yatirimci Tipi">
                  <Input value={c?.yatirimciTipi ?? ""} onChange={(e) => patchCustomer("yatirimciTipi", e.target.value)} />
                </Field>
                <Field label="Yatirimci Durumu">
                  <Select value={c?.yatirimciDurumu || "Aktif"} onValueChange={(v) => patchCustomer("yatirimciDurumu", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Pasif">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Siniflandirma">
                  <Input value={c?.musteriSiniflandirmasi ?? ""} onChange={(e) => patchCustomer("musteriSiniflandirmasi", e.target.value)} />
                </Field>
                <Field label="Meslek">
                  <Input value={c?.kisininMeslegi ?? ""} onChange={(e) => patchCustomer("kisininMeslegi", e.target.value)} />
                </Field>
                <Field label="Profil">
                  <Input value={c?.yatirimciProfili ?? ""} onChange={(e) => patchCustomer("yatirimciProfili", e.target.value)} />
                </Field>
                <Field label="Segment">
                  <Input value={c?.yatirimciSegmenti ?? ""} onChange={(e) => patchCustomer("yatirimciSegmenti", e.target.value)} />
                </Field>
                <Field label="IYS Arama">
                  <Input value={c?.iysAramaIzni ?? ""} onChange={(e) => patchCustomer("iysAramaIzni", e.target.value)} />
                </Field>
                <Field label="IYS E-Posta">
                  <Input value={c?.iysEpostaIzni ?? ""} onChange={(e) => patchCustomer("iysEpostaIzni", e.target.value)} />
                </Field>
                <Field label="IYS SMS">
                  <Input value={c?.iysSmsIzni ?? ""} onChange={(e) => patchCustomer("iysSmsIzni", e.target.value)} />
                </Field>
                <Field label="Musteri Tanimi">
                  <Input value={c?.musteriTanimiTipi ?? ""} onChange={(e) => patchCustomer("musteriTanimiTipi", e.target.value)} />
                </Field>
                <Field label="Dogum Ulkesi">
                  <Input value={c?.dogumUlkesi ?? ""} onChange={(e) => patchCustomer("dogumUlkesi", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Check label="Green Card" checked={!!c?.greenCard} onChange={(v) => patchCustomer("greenCard", v)} />
                <Check label="ABD Vergi Mukellefi" checked={!!c?.abdVergiMukellefi} onChange={(v) => patchCustomer("abdVergiMukellefi", v)} />
                <Check label="Nitelikli Yatirimci" checked={!!c?.nitelikliYatirimci} onChange={(v) => patchCustomer("nitelikliYatirimci", v)} />
                <Check label="Nitelikli (Dusuk Tutar)" checked={!!c?.nitelikliYatirimciDusukTutar} onChange={(v) => patchCustomer("nitelikliYatirimciDusukTutar", v)} />
                <Check label="Interaktif Kullanici" checked={!!c?.interaktifKullanici} onChange={(v) => patchCustomer("interaktifKullanici", v)} />
                <Check label="Web Mailer Raporlari" checked={!!c?.webMailerRaporlari} onChange={(v) => patchCustomer("webMailerRaporlari", v)} />
              </div>

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList variant="line" className="h-auto w-full flex-wrap justify-start">
                  <TabsTrigger value="hesaplar">Hesaplar</TabsTrigger>
                  <TabsTrigger value="adresler">Adresler</TabsTrigger>
                  <TabsTrigger value="iletisim">Iletisim</TabsTrigger>
                  <TabsTrigger value="kimlik">Kimlik</TabsTrigger>
                  <TabsTrigger value="kanallar">Kanallar</TabsTrigger>
                  <TabsTrigger value="belgeler">Belgeler</TabsTrigger>
                  <TabsTrigger value="notlar">Notlar</TabsTrigger>
                  <TabsTrigger value="banka">Dis Banka</TabsTrigger>
                  <TabsTrigger value="egitim">Egitim</TabsTrigger>
                  <TabsTrigger value="referans">Referans</TabsTrigger>
                  <TabsTrigger value="webmailer">WebMailer</TabsTrigger>
                  <TabsTrigger value="test">Yerindelik</TabsTrigger>
                  <TabsTrigger value="disid">Dis Sistem ID</TabsTrigger>
                </TabsList>

                <TabsContent value="hesaplar" className="mt-2 space-y-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!customerId) {
                        toast.error("Once yatirimci kaydedilmelidir")
                        return
                      }
                      setAccountForm(emptyAccount())
                      setAccountOpen(true)
                    }}
                  >
                    + Hesap
                  </Button>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hesap No</TableHead>
                        <TableHead>Sinif</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(snap.hesaplar ?? []).map((h) => (
                        <TableRow key={h.id ?? h.hesapNo}>
                          <TableCell className="font-mono">{h.hesapNo}</TableCell>
                          <TableCell>{h.hesapSinifi}</TableCell>
                          <TableCell>{h.durum}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => { setAccountForm(h); setAccountOpen(true) }}>
                              Duzenle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="adresler" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={adresTipi} onChange={(e) => setAdresTipi(e.target.value)} placeholder="Tip" />
                    <Input value={adresIl} onChange={(e) => setAdresIl(e.target.value)} placeholder="Il" />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorAddress(customerId, { adresTipi, il: adresIl, ulke: "TURKIYE" }))}>+</Button>
                  </div>
                  {(snap.adresler ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.adresTipi} — {a.il} {a.ilce} {a.caddeSokak}</p>
                  ))}
                </TabsContent>

                <TabsContent value="iletisim" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={iletisimTipi} onChange={(e) => setIletisimTipi(e.target.value)} className="w-28" />
                    <Input value={iletisimDeger} onChange={(e) => setIletisimDeger(e.target.value)} />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorContact(customerId, { iletisimTipi, deger: iletisimDeger }))}>+</Button>
                  </div>
                  {(snap.iletisimler ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.iletisimTipi}: {a.deger}</p>
                  ))}
                </TabsContent>

                <TabsContent value="kimlik" className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Seri No"><Input value={idn?.seriNo ?? ""} onChange={(e) => patchIdentity("seriNo", e.target.value)} /></Field>
                  <Field label="Medeni Hali"><Input value={idn?.medeniHali ?? ""} onChange={(e) => patchIdentity("medeniHali", e.target.value)} /></Field>
                  <Field label="Anne Adi"><Input value={idn?.anneAdi ?? ""} onChange={(e) => patchIdentity("anneAdi", e.target.value)} /></Field>
                  <Field label="Verildigi Yer"><Input value={idn?.verildigiYer ?? ""} onChange={(e) => patchIdentity("verildigiYer", e.target.value)} /></Field>
                  <Field label="Il"><Input value={idn?.il ?? ""} onChange={(e) => patchIdentity("il", e.target.value)} /></Field>
                  <Field label="Ilce"><Input value={idn?.ilce ?? ""} onChange={(e) => patchIdentity("ilce", e.target.value)} /></Field>
                  <Field label="Cilt No"><Input value={idn?.ciltNo ?? ""} onChange={(e) => patchIdentity("ciltNo", e.target.value)} /></Field>
                  <Field label="Es TCKN"><Input value={idn?.esTckn ?? ""} onChange={(e) => patchIdentity("esTckn", e.target.value)} /></Field>
                </TabsContent>

                <TabsContent value="kanallar" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={kanal} onChange={(e) => setKanal(e.target.value)} />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorChannel(customerId, kanal))}>+</Button>
                  </div>
                  {(snap.kanallar ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.kanal} / {a.durum}</p>
                  ))}
                </TabsContent>

                <TabsContent value="belgeler" className="mt-2 space-y-2">
                  {(snap.belgeler ?? []).map((d, i) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-[--accent]"
                        checked={d.secili}
                        onChange={(e) => {
                          const next = [...snap.belgeler]
                          next[i] = { ...d, secili: e.target.checked }
                          setSnap({ ...snap, belgeler: next })
                        }}
                      />
                      {d.dokumanTipi}
                    </label>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => customerId && runChild(() => saveInvestorDocuments(customerId, snap.belgeler), "Belgeler kaydedildi.")}>
                    Belgeleri Kaydet
                  </Button>
                </TabsContent>

                <TabsContent value="notlar" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={notTipi} onChange={(e) => setNotTipi(e.target.value)} className="w-28" />
                    <Input value={notMetni} onChange={(e) => setNotMetni(e.target.value)} />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorNote(customerId, notTipi, notMetni))}>+</Button>
                  </div>
                  {(snap.notlar ?? []).map((n) => (
                    <div key={n.id} className="flex items-center justify-between text-sm">
                      <span>{n.notTipi}: {n.notMetni}</span>
                      <Button size="sm" variant="destructive" onClick={() => runChild(() => deleteInvestorNote(n.id))}>Sil</Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="banka" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={disKurum} onChange={(e) => setDisKurum(e.target.value)} placeholder="Kurum" />
                    <Input value={disHesapNo} onChange={(e) => setDisHesapNo(e.target.value)} placeholder="Hesap No" />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorBank(customerId, { referansKurum: disKurum, hesapNo: disHesapNo }))}>+</Button>
                  </div>
                  {(snap.disHesaplar ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.referansKurum} {a.hesapNo} {a.iban}</p>
                  ))}
                </TabsContent>

                <TabsContent value="egitim" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={egitimDerecesi} onChange={(e) => setEgitimDerecesi(e.target.value)} className="w-28" />
                    <Input value={okul} onChange={(e) => setOkul(e.target.value)} placeholder="Okul" />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorEducation(customerId, { egitimDerecesi, okul }))}>+</Button>
                  </div>
                  {(snap.egitimler ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.egitimDerecesi} — {a.okul} {a.bolum}</p>
                  ))}
                </TabsContent>

                <TabsContent value="referans" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={referansAdi} onChange={(e) => setReferansAdi(e.target.value)} placeholder="Ad" />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorReference(customerId, { referansAdi }))}>+</Button>
                  </div>
                  {(snap.referanslar ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.referansAdi} {a.referansTelefon}</p>
                  ))}
                </TabsContent>

                <TabsContent value="webmailer" className="mt-2 space-y-2">
                  {(snap.webmailer ?? []).map((w, i) => (
                    <label key={w.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-[--accent]"
                        checked={w.secili}
                        onChange={(e) => {
                          const next = [...snap.webmailer]
                          next[i] = { ...w, secili: e.target.checked }
                          setSnap({ ...snap, webmailer: next })
                        }}
                      />
                      {w.raporAciklamasi}
                    </label>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => customerId && runChild(() => saveInvestorWebmailer(customerId, snap.webmailer), "WebMailer tercihleri kaydedildi.")}>
                    Tercihleri Kaydet
                  </Button>
                </TabsContent>

                <TabsContent value="test" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={testTipi} onChange={(e) => setTestTipi(e.target.value)} />
                    <Input value={testSonucu} onChange={(e) => setTestSonucu(e.target.value)} placeholder="Sonuc" />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorTest(customerId, { testTipi, testSonucu }))}>+</Button>
                  </div>
                  {(snap.testler ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.testTipi} {a.testTarihi} {a.testSonucu}</p>
                  ))}
                </TabsContent>

                <TabsContent value="disid" className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input value={disSistem} onChange={(e) => setDisSistem(e.target.value)} placeholder="Sistem" />
                    <Input value={disKullanici} onChange={(e) => setDisKullanici(e.target.value)} placeholder="Kod" />
                    <Button size="sm" onClick={() => customerId && runChild(() => addInvestorExternalUser(customerId, { disSistem, kullaniciKodu: disKullanici }))}>+</Button>
                  </div>
                  {(snap.disKullanicilar ?? []).map((a) => (
                    <p key={a.id} className="text-sm">{a.disSistem}: {a.kullaniciKodu}</p>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
            <div className="border-t border-border p-3">
              <Button className="w-full" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                Kaydet!
              </Button>
            </div>
          </div>
        )}
      </DetailAside>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Hesap Duzenle</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Hesap Tipi"><Input value={accountForm.hesapSinifi ?? ""} onChange={(e) => setAccountForm({ ...accountForm, hesapSinifi: e.target.value })} /></Field>
            <Field label="Yatirim Danismani"><Input value={accountForm.yatirimDanismani ?? ""} onChange={(e) => setAccountForm({ ...accountForm, yatirimDanismani: e.target.value })} /></Field>
            <Field label="AFK Kodu"><Input value={accountForm.afkKodu ?? ""} onChange={(e) => setAccountForm({ ...accountForm, afkKodu: e.target.value })} /></Field>
            <Field label="MPF Tipi"><Input value={accountForm.mpfTipi ?? ""} onChange={(e) => setAccountForm({ ...accountForm, mpfTipi: e.target.value })} /></Field>
            <Field label="Alt Sube"><Input value={accountForm.altSube ?? ""} onChange={(e) => setAccountForm({ ...accountForm, altSube: e.target.value })} /></Field>
            <Field label="Profil Tanimi"><Input value={accountForm.profilTanimi ?? ""} onChange={(e) => setAccountForm({ ...accountForm, profilTanimi: e.target.value })} /></Field>
            <Field label="Hesap Durumu">
              <Select value={accountForm.durum || "AKTIF"} onValueChange={(v) => { if (v) setAccountForm({ ...accountForm, durum: v }) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">AKTIF</SelectItem>
                  <SelectItem value="DONDURULMUS">DONDURULMUS</SelectItem>
                  <SelectItem value="KAPALI">KAPALI</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sube"><Input value={accountForm.hesapSube ?? ""} onChange={(e) => setAccountForm({ ...accountForm, hesapSube: e.target.value })} /></Field>
            <Check label="Viop" checked={accountForm.viop} onChange={(v) => setAccountForm({ ...accountForm, viop: v })} />
            <Check label="WebMailer - Ekstre" checked={accountForm.webmailerEkstre} onChange={(v) => setAccountForm({ ...accountForm, webmailerEkstre: v })} />
            <Check label="YTM - Hisse" checked={accountForm.ytmHisse} onChange={(v) => setAccountForm({ ...accountForm, ytmHisse: v })} />
          </div>
          {accountForm.id && extrasQuery.data && (
            <Tabs value={accountTab} onValueChange={setAccountTab} className="mt-3">
              <TabsList variant="line" className="h-auto w-full flex-wrap">
                <TabsTrigger value="vekil">Vekil</TabsTrigger>
                <TabsTrigger value="ortak">Ortaklar</TabsTrigger>
                <TabsTrigger value="komisyon">Komisyonlar</TabsTrigger>
                <TabsTrigger value="sozlesme">Sozlesmeler</TabsTrigger>
                <TabsTrigger value="kanal">Kanallar</TabsTrigger>
                <TabsTrigger value="grup">Gruplar</TabsTrigger>
                <TabsTrigger value="saklama">Saklama</TabsTrigger>
                <TabsTrigger value="kontrol">Kontrol</TabsTrigger>
                <TabsTrigger value="rapor">Raporlama</TabsTrigger>
                <TabsTrigger value="gizli">Gizli</TabsTrigger>
                <TabsTrigger value="turev">Turev</TabsTrigger>
              </TabsList>
              <TabsContent value="vekil" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={vekilIsim} onChange={(e) => setVekilIsim(e.target.value)} placeholder="Isim" />
                  <Input value={vekilSoyisim} onChange={(e) => setVekilSoyisim(e.target.value)} placeholder="Soyisim" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountProxy(accountForm.id!, { isim: vekilIsim, soyisim: vekilSoyisim, vekilTipi: "Vekil" }))}>+</Button>
                </div>
                {extrasQuery.data.vekiller.map((v) => (
                  <p key={v.id} className="text-sm">{v.isim} {v.soyisim} ({v.vekilTipi})</p>
                ))}
              </TabsContent>
              <TabsContent value="ortak" className="mt-2 space-y-2">
                <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountPartner(accountForm.id!, { isim: vekilIsim, soyisim: vekilSoyisim }))}>+ Ortak</Button>
                {extrasQuery.data.ortaklar.map((v) => (
                  <p key={v.id} className="text-sm">{v.isim} {v.soyisim} pay:{v.ortaklikPayi}</p>
                ))}
              </TabsContent>
              <TabsContent value="komisyon" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={komisyonDeger} onChange={(e) => setKomisyonDeger(e.target.value)} className="w-28" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => applyCommissionTemplate(accountForm.id!, Number(komisyonDeger)))}>Sablon Getir</Button>
                </div>
                {extrasQuery.data.komisyonlar.map((v) => (
                  <p key={v.id} className="text-sm">{v.islem} {v.komisyonDegeri} {v.paraBirimi}</p>
                ))}
              </TabsContent>
              <TabsContent value="sozlesme" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={hizmetTipi} onChange={(e) => setHizmetTipi(e.target.value)} placeholder="Hizmet" />
                  <Input value={sozlesmeAdi} onChange={(e) => setSozlesmeAdi(e.target.value)} placeholder="Sozlesme" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountContract(accountForm.id!, { hizmetTipi, sozlesmeAdi }))}>+</Button>
                </div>
                {extrasQuery.data.sozlesmeler.map((v) => (
                  <p key={v.id} className="text-sm">{v.hizmetTipi} {v.sozlesmeAdi}</p>
                ))}
              </TabsContent>
              <TabsContent value="kanal" className="mt-2 space-y-2">
                <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountChannel(accountForm.id!, "Sube"))}>+ Sube kanali</Button>
                {(extrasQuery.data.hesapKanallari ?? []).map((v) => (
                  <p key={v.id} className="text-sm">{v.kanal} / {v.durum}</p>
                ))}
              </TabsContent>
              <TabsContent value="grup" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={grupAdi} onChange={(e) => setGrupAdi(e.target.value)} placeholder="Grup adi" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountGroup(accountForm.id!, grupAdi))}>+</Button>
                </div>
                {(extrasQuery.data.gruplar ?? []).map((v) => (
                  <p key={v.id} className="text-sm">{v.grupAdi} {v.aciklama}</p>
                ))}
              </TabsContent>
              <TabsContent value="saklama" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={saklamaci} onChange={(e) => setSaklamaci(e.target.value)} placeholder="Saklamaci" />
                  <Input value={saklamaHesapNo} onChange={(e) => setSaklamaHesapNo(e.target.value)} placeholder="Hesap No" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountCustody(accountForm.id!, { saklamaci, saklamaHesapNo }))}>+</Button>
                </div>
                {(extrasQuery.data.saklama ?? []).map((v) => (
                  <p key={v.id} className="text-sm">{v.saklamaci} {v.saklamaHesapNo} {v.paraBirimi}</p>
                ))}
              </TabsContent>
              <TabsContent value="kontrol" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={kontrolAdi} onChange={(e) => setKontrolAdi(e.target.value)} placeholder="Kontrol adi" />
                  <Input value={kontrolDegeri} onChange={(e) => setKontrolDegeri(e.target.value)} placeholder="Deger" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountControl(accountForm.id!, { kontrolAdi, kontrolDegeri }))}>+</Button>
                </div>
                {(extrasQuery.data.kontroller ?? []).map((v) => (
                  <p key={v.id} className="text-sm">{v.kontrolAdi}: {v.kontrolDegeri}</p>
                ))}
              </TabsContent>
              <TabsContent value="rapor" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={raporTipi} onChange={(e) => setRaporTipi(e.target.value)} placeholder="Rapor tipi" />
                  <Input value={raporKanal} onChange={(e) => setRaporKanal(e.target.value)} placeholder="Kanal" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountReporting(accountForm.id!, { raporTipi, kanal: raporKanal }))}>+</Button>
                </div>
                {(extrasQuery.data.raporlar ?? []).map((v) => (
                  <p key={v.id} className="text-sm">{v.raporTipi} / {v.kanal}</p>
                ))}
              </TabsContent>
              <TabsContent value="gizli" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={gizliHesapNo} onChange={(e) => setGizliHesapNo(e.target.value)} placeholder="Gizli hesap no" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountHidden(accountForm.id!, gizliHesapNo))}>+</Button>
                </div>
                {(extrasQuery.data.gizliHesaplar ?? []).map((v) => (
                  <p key={v.id} className="text-sm">{v.gizliHesapNo} {v.aciklama}</p>
                ))}
              </TabsContent>
              <TabsContent value="turev" className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={turevIslem} onChange={(e) => setTurevIslem(e.target.value)} placeholder="Islem" />
                  <Input value={turevDeger} onChange={(e) => setTurevDeger(e.target.value)} className="w-28" />
                  <Button size="sm" onClick={() => accountForm.id && runChild(() => addAccountDerivative(accountForm.id!, { islem: turevIslem, komisyonDegeri: Number(turevDeger) }))}>+</Button>
                </div>
                {(extrasQuery.data.turevKomisyonlari ?? []).map((v) => (
                  <p key={v.id} className="text-sm">{v.islem} {v.komisyonDegeri} {v.paraBirimi}</p>
                ))}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!customerId) {
                  toast.error("Once yatirimci kaydedilmelidir")
                  return
                }
                try {
                  const saved = await saveInvestorAccount(customerId, accountForm)
                  setAccountForm(saved)
                  toast.success("Hesap kaydedildi.")
                  invalidate()
                  if (selectedAccountId) {
                    setSnap(await fetchInvestorByAccount(selectedAccountId))
                  }
                } catch (err) {
                  toast.error(extractErrorMessage(err, "Hesap kaydedilemedi"))
                }
              }}
            >
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
