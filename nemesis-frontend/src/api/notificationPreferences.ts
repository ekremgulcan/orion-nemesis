import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.notification.dto.NotifChannelStatusDto field-for-field.
 * `isEnabled`/`isEditable` are the literal JSON keys (backend forces them
 * via @JsonProperty - Jackson's default getter-derived name would have
 * been "enabled"/"editable").
 */
export interface NotifChannelStatusDto {
  isEnabled: boolean
  isEditable: boolean
}

/**
 * Mirrors com.orion.notification.dto.NotifChannelCodeDto - fixed push/sms/
 * email keys (English, lower-case), NOT the BildirimKanali enum names
 * (PUSH/SMS/EPOSTA) used by the separate "Bildirim Ayarlari" screen.
 */
export interface NotifChannelCodeDto {
  push: NotifChannelStatusDto
  sms: NotifChannelStatusDto
  email: NotifChannelStatusDto
}

/** Mirrors com.orion.notification.dto.NotifTypeSummaryDto - display-only. */
export interface NotifTypeSummaryDto {
  notifTypeCode: string
  templateHeader: string
}

/**
 * Mirrors com.orion.notification.dto.NotifCategoryDto - one category row.
 * The preference toggle lives at CATEGORY level (notifChannelCode), not
 * per notification type - `notifications` is only the badge/content list.
 */
export interface NotifCategoryDto {
  categoryCode: string
  categoryName: string
  isEditable: boolean
  notifications: NotifTypeSummaryDto[]
  notifChannelCode: NotifChannelCodeDto
}

/** Mirrors com.orion.notification.dto.NotifPreferencesGetAllResponse. */
export interface NotifPreferencesGetAllResponse {
  username: string
  notificationCategories: NotifCategoryDto[]
}

export type NotifChannelCode = "push" | "sms" | "email"

/** Mirrors com.orion.notification.dto.NotifPreferencesUpdateItem. */
export interface NotifPreferencesUpdateItem {
  categoryCode: string
  notifChannelCode: NotifChannelCode
  isEnabled: boolean
}

/**
 * Mirrors com.orion.notification.dto.NotifPreferencesUpdateResultItem.
 * DIKKAT: item-level status is "SUCCESS"/"FAILED", while the overall
 * response status below uses different words ("SUCCESS"/"PARTIAL_SUCCESS"/
 * "FAIL") - the backend documents this intentional wording split.
 */
export interface NotifPreferencesUpdateResultItem extends NotifPreferencesUpdateItem {
  status: "SUCCESS" | "FAILED"
}

/** Mirrors com.orion.notification.dto.NotifPreferencesUpdateResponse. */
export interface NotifPreferencesUpdateResponse {
  username: string
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAIL"
  updatedCount: number
  updatedFields: NotifPreferencesUpdateResultItem[]
}

export async function fetchNotifPreferences(username: string): Promise<NotifPreferencesGetAllResponse> {
  const { data } = await apiClient.get<NotifPreferencesGetAllResponse>(
    "/notification/notifPreferences/getAll",
    { params: { username } }
  )
  return data
}

export async function updateNotifPreferences(
  username: string,
  updates: NotifPreferencesUpdateItem[]
): Promise<NotifPreferencesUpdateResponse> {
  const { data } = await apiClient.post<NotifPreferencesUpdateResponse>(
    "/notification/notifPreferences/update",
    { username, updates }
  )
  return data
}
