import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.workflow.dto.WorkflowTaskDto field-for-field.
 */
export interface WorkflowTaskDto {
  id: number
  surecNo: string
  surecTipi: string
  gorevOzeti: string
  sahipAdSoyad: string
  durum: string
  atanmaTarihi: string
  tamamlanmaTarihi: string | null
}

export async function fetchAcikGorevler(kullaniciAdi?: string): Promise<WorkflowTaskDto[]> {
  const { data } = await apiClient.get<WorkflowTaskDto[]>("/workflow/tasks/acik", {
    params: kullaniciAdi ? { kullaniciAdi } : undefined,
  })
  return data
}

export async function fetchTamamlanmisGorevler(kullaniciAdi?: string): Promise<WorkflowTaskDto[]> {
  const { data } = await apiClient.get<WorkflowTaskDto[]>("/workflow/tasks/tamamlanmis", {
    params: kullaniciAdi ? { kullaniciAdi } : undefined,
  })
  return data
}

export async function fetchTumGorevler(): Promise<WorkflowTaskDto[]> {
  const { data } = await apiClient.get<WorkflowTaskDto[]>("/workflow/tasks/tumu")
  return data
}
