import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.meta.dto.PositionSnapshotDto field-for-field.
 */
export interface PositionSnapshotDto {
  id: number
  hesapNo: string
  customerName: string
  instrumentSymbol: string | null
  miktar: number
  referansFiyat: number
  kayitTarihi: string
}

/**
 * Mirrors com.orion.meta.dto.PositionShockScenarioDto field-for-field.
 */
export interface PositionShockScenarioDto {
  id: number
  senaryoAdi: string
  currencyPair: string
  sokYuzdesi: number
  aktif: boolean
  olusturmaTarihi: string
}

/**
 * Mirrors com.orion.meta.dto.PositionShockScenarioFormDto - the
 * POST/PUT body, matching MetaPozisyonService.kaydetScenario
 * parameters one-for-one (minus id, which comes from the path on
 * update).
 */
export interface PositionShockScenarioFormDto {
  senaryoAdi: string
  currencyPair: string
  sokYuzdesi: number
  aktif: boolean
}

export async function fetchPositionSnapshots(q?: string): Promise<PositionSnapshotDto[]> {
  const { data } = await apiClient.get<PositionSnapshotDto[]>("/meta/position-snapshots", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function fetchShockScenarios(q?: string): Promise<PositionShockScenarioDto[]> {
  const { data } = await apiClient.get<PositionShockScenarioDto[]>("/meta/shock-scenarios", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function createShockScenario(
  body: PositionShockScenarioFormDto
): Promise<PositionShockScenarioDto> {
  const { data } = await apiClient.post<PositionShockScenarioDto>("/meta/shock-scenarios", body)
  return data
}

export async function updateShockScenario(
  id: number,
  body: PositionShockScenarioFormDto
): Promise<PositionShockScenarioDto> {
  const { data } = await apiClient.put<PositionShockScenarioDto>(`/meta/shock-scenarios/${id}`, body)
  return data
}

export async function deleteShockScenario(id: number): Promise<void> {
  await apiClient.delete(`/meta/shock-scenarios/${id}`)
}
