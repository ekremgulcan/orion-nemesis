import { apiClient } from "@/api/client"
import type { UserDto } from "@/api/users"

/**
 * Mirrors com.orion.core.controller.AktifKullaniciController. Reads/
 * switches the process-wide simulated "logged-in" user (see
 * AktifKullaniciServisi on the backend) - a stand-in for real auth,
 * shared with the ZK header's own "Aktif Kullanici" selector.
 */
export async function fetchAktifKullanici(): Promise<UserDto> {
  const { data } = await apiClient.get<UserDto>("/core/aktif-kullanici")
  return data
}

export async function updateAktifKullanici(kullaniciAdi: string): Promise<UserDto> {
  const { data } = await apiClient.put<UserDto>("/core/aktif-kullanici", { kullaniciAdi })
  return data
}
