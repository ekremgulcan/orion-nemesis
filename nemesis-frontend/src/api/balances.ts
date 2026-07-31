import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.core.dto.AccountBalanceDto field-for-field.
 * Keep field names identical to the Java DTO's JSON property names.
 */
export interface AccountBalanceDto {
  id: number
  hesapNo: string
  customerName: string
  bakiye: number
  blokeliBakiye: number
  guncellemeTarihi: string
}

export async function fetchAccountBalances(q?: string): Promise<AccountBalanceDto[]> {
  const { data } = await apiClient.get<AccountBalanceDto[]>("/cash/balances", {
    params: q ? { q } : undefined,
  })
  return data
}
