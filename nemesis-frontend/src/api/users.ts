import { apiClient } from "@/api/client"

/**
 * Mirrors com.orion.core.dto.RoleDto field-for-field.
 */
export interface RoleDto {
  id: number
  rolAdi: string
  aciklama: string | null
}

/**
 * Mirrors com.orion.core.dto.UserDto field-for-field.
 */
export interface UserDto {
  id: number
  kullaniciAdi: string
  adSoyad: string
  email: string | null
  aktif: boolean
  roller: RoleDto[]
  olusturmaTarihi: string
}

/**
 * Mirrors com.orion.core.dto.UserFormDto - the POST/PUT body for
 * creating or updating a user, matching UserService.kaydet parameters
 * one-for-one (minus id, which comes from the path on update).
 */
export interface UserFormDto {
  kullaniciAdi: string
  adSoyad: string
  email: string | null
  aktif: boolean
  rolIds: number[]
}

export async function fetchUsers(q?: string): Promise<UserDto[]> {
  const { data } = await apiClient.get<UserDto[]>("/core/users", {
    params: q ? { q } : undefined,
  })
  return data
}

export async function fetchRoles(): Promise<RoleDto[]> {
  const { data } = await apiClient.get<RoleDto[]>("/core/users/roles")
  return data
}

export async function createUser(body: UserFormDto): Promise<UserDto> {
  const { data } = await apiClient.post<UserDto>("/core/users", body)
  return data
}

export async function updateUser(id: number, body: UserFormDto): Promise<UserDto> {
  const { data } = await apiClient.put<UserDto>(`/core/users/${id}`, body)
  return data
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/core/users/${id}`)
}
