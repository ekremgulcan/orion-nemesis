import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.crm.dto.CampaignDto field-for-field.
 */
export interface CampaignDto {
  id: number
  kampanyaAdi: string
  baslangicTarihi: string
  bitisTarihi: string | null
  durum: string
}

export async function fetchCampaigns(): Promise<CampaignDto[]> {
  const { data } = await apiClient.get<CampaignDto[]>("/crm/campaigns")
  return data
}
