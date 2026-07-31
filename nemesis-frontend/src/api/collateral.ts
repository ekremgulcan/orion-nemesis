import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.collateral.dto.CollateralTransferDto field-for-field.
 * Keep field names identical to the Java DTO's JSON property names.
 */
export interface CollateralTransferDto {
  id: number
  hesapNo: string
  customerName: string
  piyasa: string
  saklamaci: string
  teminatTipi: string
  kaynakDepo: string
  hedefDepo: string
  instrumentSymbol: string | null
  paraBirimi: string | null
  miktar: number
  dosyaliMi: boolean
  durum: string
  talepEdenKullaniciAdi: string | null
  onaylayanKullaniciAdi: string | null
  talepTarihi: string
  onayTarihi: string | null
  aciklama: string | null
}

/**
 * Mirrors com.orion.collateral.dto.CreateCollateralTransferDto - the POST
 * body for creating a new transfer request (Teminat Islemleri screen).
 */
export interface CreateCollateralTransferDto {
  hesapNo: string
  piyasa: string
  saklamaci: string
  teminatTipi: string
  kaynakDepo: string
  hedefDepo: string
  paraBirimi: string
  miktar: number
  aciklama?: string | null
}

export async function fetchCollateralTransfers(durum?: string): Promise<CollateralTransferDto[]> {
  const { data } = await apiClient.get<CollateralTransferDto[]>("/collateral/transfers", {
    params: durum ? { durum } : undefined,
  })
  return data
}

export async function createCollateralTransfer(
  body: CreateCollateralTransferDto
): Promise<CollateralTransferDto> {
  const { data } = await apiClient.post<CollateralTransferDto>("/collateral/transfers", body)
  return data
}

export async function approveCollateralTransfer(id: number): Promise<void> {
  await apiClient.post(`/collateral/transfers/${id}/approve`)
}

export async function cancelCollateralTransfer(id: number): Promise<void> {
  await apiClient.post(`/collateral/transfers/${id}/cancel`)
}

export async function reviseCollateralTransfer(id: number): Promise<void> {
  await apiClient.post(`/collateral/transfers/${id}/revise`)
}

export async function poolCollateralTransfer(id: number): Promise<void> {
  await apiClient.post(`/collateral/transfers/${id}/pool`)
}
