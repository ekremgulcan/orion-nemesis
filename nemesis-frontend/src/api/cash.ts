import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.cash.dto.CashTransactionRequestDto field-for-field.
 * Keep field names identical to the Java DTO's JSON property names.
 */
export interface CashTransactionRequestDto {
  id: number
  hesapNo: string
  customerName: string
  talepKanali: string
  emirVeren: string
  valorTarihi: string
  tutar: number
  paraBirimi: string
  islemYonu: string
  yontem: string
  iban: string | null
  karsiHesapNo: string | null
  iymBankaHesabi: string | null
  durum: string
  aciklama: string | null
  olusturmaTarihi: string
}

/**
 * Mirrors com.orion.cash.dto.CreateCashTransactionRequestDto - the POST
 * body for creating a new request, matching CashTransactionService.talepOlustur
 * parameters one-for-one.
 */
export interface CreateCashTransactionRequestDto {
  hesapNo: string
  talepKanali: string
  emirVeren: string
  valorTarihi: string
  tutar: number
  paraBirimi: string
  islemYonu: string
  yontem: string
  iban?: string | null
  karsiHesapNo?: string | null
  iymBankaHesabi?: string | null
  aciklama?: string | null
}

export async function fetchCashTransactionRequests(): Promise<CashTransactionRequestDto[]> {
  const { data } = await apiClient.get<CashTransactionRequestDto[]>("/cash/transaction-requests")
  return data
}

export async function createCashTransactionRequest(
  body: CreateCashTransactionRequestDto
): Promise<CashTransactionRequestDto> {
  const { data } = await apiClient.post<CashTransactionRequestDto>("/cash/transaction-requests", body)
  return data
}

export async function approveCashTransactionRequest(id: number): Promise<CashTransactionRequestDto> {
  const { data } = await apiClient.post<CashTransactionRequestDto>(`/cash/transaction-requests/${id}/approve`)
  return data
}

export async function rejectCashTransactionRequest(id: number): Promise<CashTransactionRequestDto> {
  const { data } = await apiClient.post<CashTransactionRequestDto>(`/cash/transaction-requests/${id}/reject`)
  return data
}
