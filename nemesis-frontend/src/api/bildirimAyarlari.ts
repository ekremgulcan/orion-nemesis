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

export async function fetchNotificationTypes(): Promise<NotificationTypeDto[]> {
  const { data } = await apiClient.get<NotificationTypeDto[]>("/notification/types")
  return data
}

export async function updateGenelDurum(id: number, active: boolean): Promise<NotificationTypeDto> {
  const { data } = await apiClient.post<NotificationTypeDto>(`/notification/types/${id}/genel-durum`, { active })
  return data
}
