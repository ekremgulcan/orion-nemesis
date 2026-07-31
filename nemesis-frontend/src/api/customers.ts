import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.core.dto.CustomerDto field-for-field.
 */
export interface CustomerDto {
  id: number
  musteriNo: string
  adSoyadUnvan: string
  musteriTipi: string
  tcknVkn: string
  riskGrubu: string
  telefon: string | null
  email: string | null
  aktif: boolean
  olusturmaTarihi: string
}

/**
 * Mirrors com.orion.core.dto.CustomerFormDto - the POST/PUT body for
 * creating or updating a customer, matching CustomerService.kaydet
 * parameters one-for-one (minus id, which comes from the path on update).
 */
export interface CustomerFormDto {
  musteriNo: string
  adSoyadUnvan: string
  musteriTipi: string
  tcknVkn: string
  riskGrubu: string
  telefon: string | null
  email: string | null
  aktif: boolean
}

export async function fetchCustomers(q?: string): Promise<CustomerDto[]> {
  const { data } = await apiClient.get<CustomerDto[]>("/core/customers", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function createCustomer(body: CustomerFormDto): Promise<CustomerDto> {
  const { data } = await apiClient.post<CustomerDto>("/core/customers", body)
  return data
}

export async function updateCustomer(id: number, body: CustomerFormDto): Promise<CustomerDto> {
  const { data } = await apiClient.put<CustomerDto>(`/core/customers/${id}`, body)
  return data
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/core/customers/${id}`)
}
