import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.credit.dto.CreditOptimizationResultDto field-for-field.
 */
export interface CreditOptimizationResultDto {
  id: number
  hesapNo: string
  hesapAdi: string
  serbestBakiye: number
  mevcutOzkaynakOrani: number
  yeniOzkaynakOrani: number
  durum: "UYGUN" | "UYGUN_DEGIL"
  komposizyon: string | null
  uygulandi: boolean
  uygulamaTarihi: string | null
}

/**
 * Mirrors com.orion.credit.dto.CreditOptimizationRunDto field-for-field.
 */
export interface CreditOptimizationRunDto {
  id: number
  gunTipi: "GUNBASI" | "GUNICI"
  hedefOzkaynakOrani: number
  calismaTarihi: string
  calistiranKullaniciAdi: string
}

/**
 * Mirrors com.orion.credit.dto.OptimizationRunResponse field-for-field.
 */
export interface OptimizationRunResponse {
  run: CreditOptimizationRunDto | null
  uygunHaleGelenler: CreditOptimizationResultDto[]
  uygunHaleGelmeyenler: CreditOptimizationResultDto[]
  uygulananSayisi: number | null
}

export async function startGunbasi(hedefOzkaynakOrani: number): Promise<OptimizationRunResponse> {
  const { data } = await apiClient.post<OptimizationRunResponse>(
    "/credit/optimization-runs/gunbasi",
    { hedefOzkaynakOrani }
  )
  return data
}

export async function startGunici(hedefOzkaynakOrani: number): Promise<OptimizationRunResponse> {
  const { data } = await apiClient.post<OptimizationRunResponse>(
    "/credit/optimization-runs/gunici",
    { hedefOzkaynakOrani }
  )
  return data
}

export async function surecBaslat(runId: number): Promise<OptimizationRunResponse> {
  const { data } = await apiClient.post<OptimizationRunResponse>(
    `/credit/optimization-runs/${runId}/surec-baslat`
  )
  return data
}
