import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.risk.dto.AccountInstrumentControlDto field-for-field.
 */
export interface AccountInstrumentControlDto {
  id: number
  userName: string
  kullaniciAdi: string
  hesapNo: string
  customerName: string
  instrumentSymbol: string
  alisIzni: boolean
  satisIzni: boolean
  acikSatisIzni: boolean
  guncellemeTarihi: string
}

/**
 * Mirrors com.orion.risk.dto.AccountInstrumentControlFormDto - the
 * POST/PUT body, matching
 * RiskProfileService.kaydetAccountInstrumentControl parameters
 * one-for-one (minus id, which comes from the path on update). Lookup
 * is free-text (kullaniciAdi / hesapNo / enstrumanSembol) same as the
 * ZK screen - no dropdowns/autocomplete.
 */
export interface AccountInstrumentControlFormDto {
  kullaniciAdi: string
  hesapNo: string
  enstrumanSembol: string
  alisIzni: boolean
  satisIzni: boolean
  acikSatisIzni: boolean
}

export async function fetchAccountInstrumentControls(
  q?: string
): Promise<AccountInstrumentControlDto[]> {
  const { data } = await apiClient.get<AccountInstrumentControlDto[]>(
    "/risk/account-instrument-controls",
    { params: q ? { q } : undefined }
  )
  return data
}

export async function createAccountInstrumentControl(
  body: AccountInstrumentControlFormDto
): Promise<AccountInstrumentControlDto> {
  const { data } = await apiClient.post<AccountInstrumentControlDto>(
    "/risk/account-instrument-controls",
    body
  )
  return data
}

export async function updateAccountInstrumentControl(
  id: number,
  body: AccountInstrumentControlFormDto
): Promise<AccountInstrumentControlDto> {
  const { data } = await apiClient.put<AccountInstrumentControlDto>(
    `/risk/account-instrument-controls/${id}`,
    body
  )
  return data
}

export async function deleteAccountInstrumentControl(id: number): Promise<void> {
  await apiClient.delete(`/risk/account-instrument-controls/${id}`)
}
