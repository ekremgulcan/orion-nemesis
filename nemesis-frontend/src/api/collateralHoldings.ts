import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.collateral.dto.CollateralDto field-for-field.
 * Keep field names identical to the Java DTO's JSON property names.
 */
export interface CollateralDto {
  id: number
  hesapNo: string
  customerName: string
  depoTipi: string
  varlikTipi: string
  instrumentSymbol: string | null
  paraBirimi: string | null
  miktar: number
  guncellemeTarihi: string
}

export async function fetchCollateralHoldings(q?: string): Promise<CollateralDto[]> {
  const { data } = await apiClient.get<CollateralDto[]>("/collateral/holdings", {
    params: q ? { q } : undefined,
  })
  return data
}
