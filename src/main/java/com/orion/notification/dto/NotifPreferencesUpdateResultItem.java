package com.orion.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * "POST /notifPreferences/update" cevabindaki updatedFields[] elemani.
 * `status` burada ITEM seviyesindedir ve dokumana gore "SUCCESS"/"FAILED"
 * degerlerini alir - DIKKAT: bunun tam karsiligi olan
 * {@link NotifPreferencesUpdateResponse#getStatus()} (istegin GENEL
 * sonucu) ise "SUCCESS"/"PARTIAL_SUCCESS"/"FAIL" degerlerini alir (item
 * "FAILED", genel sonuc "FAIL" - dokuman bu ikisini KASITLI olarak farkli
 * kelimelerle tanimliyor, bkz. section 3.6).
 */
@Getter
@Setter
public class NotifPreferencesUpdateResultItem {
    private String categoryCode;
    private String notifChannelCode;

    @JsonProperty("isEnabled")
    private boolean enabled;

    private String status;
}
