import { apiClient } from "@/api/client"

export type AliciGrubu =
  | "HEPSI"
  | "ONAYLAYANLAR"
  | "ONAYLAMAYANLAR"
  | "AKSIYON_ALMAYANLAR"
  | "BELIRLI_HESAPLAR"

export type MesajYontemi = "EMAIL" | "SMS"

export type MesajIcerigiTipi = "SABLON" | "YENI"

/**
 * Mirrors com.orion.crm.dto.BulkMessageRequestDto field-for-field, and
 * the ZK TopluMesajViewModel's form fields one-for-one.
 */
export interface BulkMessageRequestDto {
  campaignId: number | null
  aliciGrubu: AliciGrubu
  belirliHesaplar: string
  yontem: MesajYontemi
  mesajIcerigiTipi: MesajIcerigiTipi
  yeniMesajIcerigi: string
}

export interface BulkMessageResultDto {
  gonderilenSayisi: number
  mesaj: string
}

export async function sendBulkMessage(
  body: BulkMessageRequestDto
): Promise<BulkMessageResultDto> {
  const { data } = await apiClient.post<BulkMessageResultDto>("/crm/bulk-messages", body)
  return data
}
