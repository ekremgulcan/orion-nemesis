import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.notification.dto.NotificationTypeDto field-for-field.
 */
export interface NotificationTypeDto {
  id: number
  kod: string
  ad: string
  aciklama: string | null
  zorunlu: boolean
  sira: number
  active: boolean
  createdBy: string | null
  createdTime: string | null
  lastUpdatedBy: string | null
  lastUpdatedTime: string | null
}

/**
 * Mirrors com.orion.notification.dto.NotifChannelTemplateDto field-for-field.
 */
export interface NotifChannelTemplateDto {
  id: number
  notificationTypeId: number
  kanal: "PUSH" | "SMS" | "EPOSTA"
  templateHeader: string
  templateBody: string
  maxRetry: number
  errorBackoffTime: number
  musteriGorurVeDegistir: boolean
  active: boolean
  createdBy: string | null
  createdTime: string | null
  lastUpdatedBy: string | null
  lastUpdatedTime: string | null
  parametreler: string[]
}

export interface KanalAyarlariGuncelleRequest {
  musteriGorurVeDegistir: boolean
  maxRetry: number
  errorBackoffTime: number
  active: boolean
  templateBody: string
}

export async function fetchNotificationTypes(): Promise<NotificationTypeDto[]> {
  const { data } = await apiClient.get<NotificationTypeDto[]>("/notification/types")
  return data
}

export async function updateGenelDurum(id: number, active: boolean): Promise<NotificationTypeDto> {
  const { data } = await apiClient.post<NotificationTypeDto>(`/notification/types/${id}/genel-durum`, { active })
  return data
}

export async function fetchChannelTemplate(
  typeId: number,
  kanal: string,
): Promise<NotifChannelTemplateDto> {
  const { data } = await apiClient.get<NotifChannelTemplateDto>("/notification/channel-templates", {
    params: { typeId, kanal },
  })
  return data
}

export async function updateChannelTemplate(
  id: number,
  request: KanalAyarlariGuncelleRequest,
): Promise<NotifChannelTemplateDto> {
  const { data } = await apiClient.post<NotifChannelTemplateDto>(
    `/notification/channel-templates/${id}`,
    request,
  )
  return data
}
