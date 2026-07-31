import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.report.dto.ReportDefinitionDto field-for-field.
 */
export interface ReportDefinitionDto {
  id: number
  raporAdi: string
  raporSinifi: string
  zamanlama: string
  mailGonder: boolean
  icerik: string | null
  aktif: boolean
  olusturanKullaniciAdi: string | null
  degistirenKullaniciAdi: string | null
  olusturmaTarihi: string
  guncellemeTarihi: string
}

/**
 * Mirrors com.orion.report.dto.ReportDefinitionFormDto - the POST/PUT
 * body, matching ReportDefinitionService.kaydet parameters one-for-one
 * (minus id, which comes from the path on update).
 */
export interface ReportDefinitionFormDto {
  raporAdi: string
  raporSinifi: string
  zamanlama: string
  mailGonder: boolean
  icerik: string
}

export const ZAMANLAMA_OPTIONS = ["MANUEL", "GUNLUK", "HAFTALIK", "AYLIK"] as const

export async function fetchReportDefinitions(q?: string): Promise<ReportDefinitionDto[]> {
  const { data } = await apiClient.get<ReportDefinitionDto[]>("/report/definitions", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function createReportDefinition(
  body: ReportDefinitionFormDto
): Promise<ReportDefinitionDto> {
  const { data } = await apiClient.post<ReportDefinitionDto>("/report/definitions", body)
  return data
}

export async function updateReportDefinition(
  id: number,
  body: ReportDefinitionFormDto
): Promise<ReportDefinitionDto> {
  const { data } = await apiClient.put<ReportDefinitionDto>(`/report/definitions/${id}`, body)
  return data
}

export async function deleteReportDefinition(id: number): Promise<void> {
  await apiClient.delete(`/report/definitions/${id}`)
}
