import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.notification.dto.NotificationEventDto field-for-field.
 * Field names match the external "CUSTOMER NOTIF" GET /events contract
 * (eventId/templateId/target/notifHeader/notifMessage/status/retryCount/
 * errorDescription/logDate/created/uuid) plus `investorNo`, an enriched
 * field this screen adds on top of that contract.
 */
export interface NotificationEventDto {
  eventId: number
  templateId: number
  investorNo: string
  target: string
  notifHeader: string
  notifMessage: string
  status: "SUCCESS" | "FAIL"
  retryCount: number
  errorDescription: string | null
  logDate: string
  created: string
  uuid: string
}

/**
 * Mirrors Spring Data's default Page<T> JSON serialization shape (the
 * same shape the given events_result sample uses) - only the fields
 * this UI actually reads are declared.
 */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export interface NotificationEventFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  hesapNo?: string
  kullaniciAdi?: string
  notifHeader?: string
}

export async function fetchNotificationEvents(
  filters: NotificationEventFilters,
  page: number,
  size: number
): Promise<PageResponse<NotificationEventDto>> {
  const { data } = await apiClient.get<PageResponse<NotificationEventDto>>("/notification/events", {
    params: { ...filters, page, size },
  })
  return data
}

/**
 * Downloads the real POI-generated .xlsx export of every record matching
 * the current filters (unpaged) and triggers a browser save - "Rapor
 * Olustur" button behavior.
 */
export async function exportNotificationEvents(filters: NotificationEventFilters): Promise<void> {
  const response = await apiClient.get("/notification/events/export", {
    params: filters,
    responseType: "blob",
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement("a")
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  link.href = url
  link.download = `bildirim-izleme-${stamp}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
