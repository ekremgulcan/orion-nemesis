import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.core.dto.ChannelAuthorizationDto field-for-field.
 */
export interface ChannelAuthorizationDto {
  id: number
  kullaniciAdi: string
  adSoyad: string
  hesapNo: string
  customerName: string
  kanal: string
  yetkiDurumu: string
  tanimlamaTarihi: string
}

/**
 * Mirrors com.orion.core.dto.ChannelAuthorizationFormDto - the POST/PUT
 * body for creating or updating a channel authorization, matching
 * ChannelAuthorizationService.kaydet parameters one-for-one (minus id,
 * which comes from the path on update).
 */
export interface ChannelAuthorizationFormDto {
  kullaniciAdi: string
  hesapNo: string
  kanal: string
  yetkiDurumu: string
}

export async function fetchChannelAuthorizations(q?: string): Promise<ChannelAuthorizationDto[]> {
  const { data } = await apiClient.get<ChannelAuthorizationDto[]>("/core/channel-authorizations", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function createChannelAuthorization(
  body: ChannelAuthorizationFormDto
): Promise<ChannelAuthorizationDto> {
  const { data } = await apiClient.post<ChannelAuthorizationDto>("/core/channel-authorizations", body)
  return data
}

export async function updateChannelAuthorization(
  id: number,
  body: ChannelAuthorizationFormDto
): Promise<ChannelAuthorizationDto> {
  const { data } = await apiClient.put<ChannelAuthorizationDto>(`/core/channel-authorizations/${id}`, body)
  return data
}

export async function deleteChannelAuthorization(id: number): Promise<void> {
  await apiClient.delete(`/core/channel-authorizations/${id}`)
}
