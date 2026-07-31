import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.risk.dto.InstrumentGroupDto field-for-field.
 */
export interface InstrumentGroupDto {
  id: number
  grupKodu: string
  aciklama: string | null
  aktif: boolean
  uyeler: InstrumentRefDto[]
}

export interface InstrumentRefDto {
  id: number
  sembol: string
}

/**
 * Mirrors com.orion.risk.dto.InstrumentGroupFormDto - the POST/PUT body
 * for creating or updating a group, matching
 * RiskProfileService.kaydetInstrumentGroup parameters one-for-one
 * (minus id, which comes from the path on update).
 */
export interface InstrumentGroupFormDto {
  grupKodu: string
  aciklama: string
  aktif: boolean
  instrumentIds: number[]
}

export async function fetchInstrumentGroups(q?: string): Promise<InstrumentGroupDto[]> {
  const { data } = await apiClient.get<InstrumentGroupDto[]>("/risk/instrument-groups", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function createInstrumentGroup(
  body: InstrumentGroupFormDto
): Promise<InstrumentGroupDto> {
  const { data } = await apiClient.post<InstrumentGroupDto>("/risk/instrument-groups", body)
  return data
}

export async function updateInstrumentGroup(
  id: number,
  body: InstrumentGroupFormDto
): Promise<InstrumentGroupDto> {
  const { data } = await apiClient.put<InstrumentGroupDto>(`/risk/instrument-groups/${id}`, body)
  return data
}

export async function deleteInstrumentGroup(id: number): Promise<void> {
  await apiClient.delete(`/risk/instrument-groups/${id}`)
}
