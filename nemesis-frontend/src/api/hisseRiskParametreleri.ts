import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.risk.dto.HisseRiskParametresiDto field-for-field.
 */
export interface HisseRiskParametresiDto {
  id: number
  kullaniciTipi: string
  hesapTipi: string
  hesapNo: string
  musteriNo: string
  musteriAdi: string
  alisKontrolTipi: string
  satisKontrolTipi: string
  acikSatisKontrolTipi: string
  acikTakasLimiti: number
  acigaSatisLimiti: number
  netVarlikLimitCarpani: number
  kredisizGrupAAlisYapabilir: boolean
  grupBAlisYapabilir: boolean
  grupCAlisYapabilir: boolean
  grupDAlisYapabilir: boolean
  kredisizGrupANakitKontrol: boolean
  grupBNakitKontrol: boolean
  grupCNakitKontrol: boolean
  grupDNakitKontrol: boolean
  kredisizPaylardaKontrolsuzSatis: boolean
  aktif: boolean
  guncellemeTarihi: string
}

/**
 * Mirrors com.orion.risk.dto.HisseRiskParametresiFormDto - the POST/PUT
 * body. Kullanici Tipi/Hesap Tipi/Musteri No/Musteri Adi are edit-mode
 * read-only in the UI, but ALL fields are editable in "Yeni Ekle" mode
 * (matching the ZK screen's explicit behavior) - hesapNo is the only
 * identity input, looked up via lookupAccount ("Bul").
 */
export interface HisseRiskParametresiFormDto {
  hesapNo: string
  kullaniciTipi: string
  alisKontrolTipi: string
  satisKontrolTipi: string
  acikSatisKontrolTipi: string
  acikTakasLimiti: number
  acigaSatisLimiti: number
  netVarlikLimitCarpani: number
  kredisizGrupAAlisYapabilir: boolean
  grupBAlisYapabilir: boolean
  grupCAlisYapabilir: boolean
  grupDAlisYapabilir: boolean
  kredisizGrupANakitKontrol: boolean
  grupBNakitKontrol: boolean
  grupCNakitKontrol: boolean
  grupDNakitKontrol: boolean
  kredisizPaylardaKontrolsuzSatis: boolean
}

/** Mirrors com.orion.risk.dto.AccountLookupDto - the "Bul" button response. */
export interface AccountLookupDto {
  musteriNo: string
  musteriAdi: string
  hesapTipi: string
}

/**
 * Mirrors com.orion.risk.dto.NetVarlikCarpaniTopluSatirDto. Round-trips:
 * the preview endpoint returns these, and the same shape is sent back
 * unmodified to confirm the bulk update - the backend keeps no
 * server-side preview session (see HisseRiskParametreleriController).
 */
export interface NetVarlikCarpaniTopluSatirDto {
  hesapNo: string
  eskiDeger: number | null
  yeniDeger: number | null
  parametreIdListesi: number[]
  gecerli: boolean
  durum: string
}

export interface HisseRiskParametreleriFilters {
  musteriNo?: string
  hesapNo?: string
  kullaniciTipi?: string
}

const BASE = "/risk/hisse-risk-parametreleri"

export async function fetchHisseRiskParametreleri(
  filters: HisseRiskParametreleriFilters = {}
): Promise<HisseRiskParametresiDto[]> {
  const { data } = await apiClient.get<HisseRiskParametresiDto[]>(BASE, { params: filters })
  return data
}

export async function lookupAccount(hesapNo: string): Promise<AccountLookupDto> {
  const { data } = await apiClient.get<AccountLookupDto>(`${BASE}/account/${encodeURIComponent(hesapNo)}`)
  return data
}

export async function createHisseRiskParametresi(
  body: HisseRiskParametresiFormDto
): Promise<HisseRiskParametresiDto> {
  const { data } = await apiClient.post<HisseRiskParametresiDto>(BASE, body)
  return data
}

export async function updateHisseRiskParametresi(
  id: number,
  body: HisseRiskParametresiFormDto
): Promise<HisseRiskParametresiDto> {
  const { data } = await apiClient.put<HisseRiskParametresiDto>(`${BASE}/${id}`, body)
  return data
}

export async function deleteHisseRiskParametresi(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

function downloadBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/** "Indir" toolbar button - full filtered result set as a real .xlsx download. */
export async function exportHisseRiskParametreleri(filters: HisseRiskParametreleriFilters): Promise<void> {
  const response = await apiClient.get(`${BASE}/export`, { params: filters, responseType: "blob" })
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  downloadBlob(response.data, `hisse-risk-parametreleri-${stamp}.xlsx`)
}

/** "Sablon Indir" button inside the bulk-update dialog. */
export async function downloadTopluGuncellemeSablonu(): Promise<void> {
  const response = await apiClient.get(`${BASE}/toplu-guncelleme/sablon`, { responseType: "blob" })
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  downloadBlob(response.data, `net-varlik-limit-carpani-sablon-${stamp}.xlsx`)
}

/** Uploaded Excel -> preview rows, before anything is written to the DB. */
export async function previewTopluGuncelleme(file: File): Promise<NetVarlikCarpaniTopluSatirDto[]> {
  const form = new FormData()
  form.append("file", file)
  const { data } = await apiClient.post<NetVarlikCarpaniTopluSatirDto[]>(
    `${BASE}/toplu-guncelleme/onizle`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return data
}

/** "Onaya Gonder" - sends back the (already displayed) preview rows to actually persist them. */
export async function confirmTopluGuncelleme(
  satirlar: NetVarlikCarpaniTopluSatirDto[]
): Promise<{ guncellenen: number }> {
  const { data } = await apiClient.post<{ guncellenen: number }>(`${BASE}/toplu-guncelleme`, satirlar)
  return data
}
