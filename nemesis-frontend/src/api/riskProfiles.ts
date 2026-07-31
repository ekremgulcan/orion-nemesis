import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.risk.dto.RiskProfileDto field-for-field.
 */
export interface RiskProfileDto {
  id: number
  enstrumanTipi: string
  userName: string
  hesapNo: string
  alisKontrol: boolean
  satisKontrol: boolean
  acikSatisKontrol: boolean
  grupANakitKontrol: boolean
  grupBNakitKontrol: boolean
  grupCNakitKontrol: boolean
  grupDNakitKontrol: boolean
  aktif: boolean
}

/**
 * Mirrors com.orion.risk.dto.UserLimitDto field-for-field.
 */
export interface UserLimitDto {
  id: number
  enstrumanTipi: string
  userName: string
  gunlukToplamLimit: number
  anlikIslemLimiti: number
}

/**
 * "Yeni Hisse Emir Yonetimi" / "Sabit Getiri Risk Tanimlama" ekrani -
 * read-only, RiskParametreleriController'i tuketir.
 */
export async function fetchRiskProfiles(tip: string, q?: string): Promise<RiskProfileDto[]> {
  const { data } = await apiClient.get<RiskProfileDto[]>("/risk/risk-profiles", {
    params: { tip, q: q || undefined },
  })
  return data
}

export async function fetchUserLimits(tip: string, q?: string): Promise<UserLimitDto[]> {
  const { data } = await apiClient.get<UserLimitDto[]>("/risk/user-limits", {
    params: { tip, q: q || undefined },
  })
  return data
}
