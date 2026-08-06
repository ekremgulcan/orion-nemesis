package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Onaya Gonder" ile gonderilen tek bir bildirim tipi guncellemesi.
 * `notificationTypeId` zorunlu (VIOP Margin Call) bir tipe ait ise
 * MusteriBildirimTercihleriService bu istegi sessizce yok sayar.
 */
@Getter
@Setter
public class BildirimTercihiGuncelleRequest {
    private Long notificationTypeId;
    private boolean pushAcik;
    private boolean smsAcik;
    private boolean epostaAcik;
}
