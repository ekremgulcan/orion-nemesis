import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.core.dto.ViopRiskProfileDto field-for-field.
 */
export interface ViopRiskProfileDto {
  id: number
  hesapNo: string
  customerName: string
  profilAdi: string
  carpan: number
  guncellemeTarihi: string
}

/**
 * Mirrors com.orion.core.dto.ViopRiskProfileFormDto - the POST/PUT body
 * for creating or updating a profile, matching ViopRiskProfileService.kaydet
 * parameters one-for-one (minus id, which comes from the path on update).
 */
export interface ViopRiskProfileFormDto {
  hesapNo: string
  profilAdi: string
  carpan: number
}

export async function fetchViopRiskProfiles(q?: string): Promise<ViopRiskProfileDto[]> {
  const { data } = await apiClient.get<ViopRiskProfileDto[]>("/core/viop-risk-profiles", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function createViopRiskProfile(body: ViopRiskProfileFormDto): Promise<ViopRiskProfileDto> {
  const { data } = await apiClient.post<ViopRiskProfileDto>("/core/viop-risk-profiles", body)
  return data
}

export async function updateViopRiskProfile(
  id: number,
  body: ViopRiskProfileFormDto
): Promise<ViopRiskProfileDto> {
  const { data } = await apiClient.put<ViopRiskProfileDto>(`/core/viop-risk-profiles/${id}`, body)
  return data
}

export async function deleteViopRiskProfile(id: number): Promise<void> {
  await apiClient.delete(`/core/viop-risk-profiles/${id}`)
}
