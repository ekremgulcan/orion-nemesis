package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Bildirim Ayarlari" ekraninda "Onaya Gonder" ile gonderilen kanallardan
 * bagimsiz genel durum guncellemesi.
 */
@Getter
@Setter
public class GenelDurumGuncelleRequest {
    private boolean active;
}
