package com.orion.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * "POST /notifPreferences/update" istegindeki updates[] elemani - TEK bir
 * kategori/kanal kombinasyonunun yeni acik/kapali durumu. notifChannelCode
 * burada dokumandaki gibi bir STRING'dir ("push"/"sms"/"email", kucuk
 * harf) - BildirimKanali enum degerleriyle (PUSH/SMS/EPOSTA) birebir
 * uyusmadigi icin donusum MusteriBildirimTercihleriService'te yapilir
 * (bkz. NotifChannelCodeDto javadoc).
 */
@Getter
@Setter
public class NotifPreferencesUpdateItem {
    private String categoryCode;
    private String notifChannelCode;

    @JsonProperty("isEnabled")
    private boolean enabled;
}
