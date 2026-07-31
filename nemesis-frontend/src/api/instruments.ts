import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.core.dto.InstrumentDto field-for-field.
 */
export interface InstrumentDto {
  id: number
  isin: string
  sembol: string
  ad: string
  tip: string
  borsa: string
  aktif: boolean
}

/**
 * Mirrors com.orion.core.dto.InstrumentFormDto - the POST/PUT body for
 * creating or updating an instrument, matching InstrumentService.kaydet
 * parameters one-for-one (minus id, which comes from the path on update).
 */
export interface InstrumentFormDto {
  isin: string
  sembol: string
  ad: string
  tip: string
  borsa: string
  aktif: boolean
}

export async function fetchInstruments(tip?: string, q?: string): Promise<InstrumentDto[]> {
  const { data } = await apiClient.get<InstrumentDto[]>("/core/instruments", {
    params: { tip, q: q || undefined },
  })
  return data
}

export async function createInstrument(body: InstrumentFormDto): Promise<InstrumentDto> {
  const { data } = await apiClient.post<InstrumentDto>("/core/instruments", body)
  return data
}

export async function updateInstrument(id: number, body: InstrumentFormDto): Promise<InstrumentDto> {
  const { data } = await apiClient.put<InstrumentDto>(`/core/instruments/${id}`, body)
  return data
}

export async function deleteInstrument(id: number): Promise<void> {
  await apiClient.delete(`/core/instruments/${id}`)
}
