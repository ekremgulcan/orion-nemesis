package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * "POST /notifPreferences/update" cevabi - servis dokumaninin section
 * 3.5/3.5.1 ile birebir ayni sekil. `status` burada istegin GENEL
 * sonucudur ve "SUCCESS"/"PARTIAL_SUCCESS"/"FAIL" degerlerini alir - bkz.
 * {@link NotifPreferencesUpdateResultItem#getStatus()} icin item
 * seviyesindeki ("SUCCESS"/"FAILED") farkli kelime secimi.
 */
@Getter
@Setter
public class NotifPreferencesUpdateResponse {
    private String username;
    private String status;
    private int updatedCount;
    private List<NotifPreferencesUpdateResultItem> updatedFields;
}
