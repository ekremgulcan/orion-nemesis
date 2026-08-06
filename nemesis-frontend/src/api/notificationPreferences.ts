import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.notification.dto.BildirimTercihiDto field-for-field.
 */
export interface BildirimTercihiDto {
  notificationTypeId: number
  kod: string
  ad: string
  aciklama: string | null
  zorunlu: boolean
  sira: number
  pushAcik: boolean
  smsAcik: boolean
  epostaAcik: boolean
}

/**
 * Mirrors com.orion.notification.dto.MusteriBildirimTercihleriDto - the
 * combined GET/POST response for the "Musteri Bildirim Tercihleri" screen
 * (musteri ozet bilgisi + bildirim tipi bazinda tercih listesi in a single
 * round trip, matching the ZK ViewModel's own single-fetch approach).
 */
export interface MusteriBildirimTercihleriDto {
  musteriNo: string
  musteriAdi: string
  tcknVkn: string
  durum: string
  sonGuncelleme: string | null
  tercihler: BildirimTercihiDto[]
}

export interface BildirimTercihiGuncelleRequest {
  notificationTypeId: number
  pushAcik: boolean
  smsAcik: boolean
  epostaAcik: boolean
}

export async function fetchMusteriBildirimTercihleri(musteriNo: string): Promise<MusteriBildirimTercihleriDto> {
  const { data } = await apiClient.get<MusteriBildirimTercihleriDto>(
    `/notification/preferences/customer/${encodeURIComponent(musteriNo)}`
  )
  return data
}

export async function updateMusteriBildirimTercihleri(
  musteriNo: string,
  updates: BildirimTercihiGuncelleRequest[]
): Promise<MusteriBildirimTercihleriDto> {
  const { data } = await apiClient.post<MusteriBildirimTercihleriDto>(
    `/notification/preferences/customer/${encodeURIComponent(musteriNo)}`,
    updates
  )
  return data
}
