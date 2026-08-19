package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Bir kategorinin icerigindeki TEK bir bildirim tipi - servis
 * dokumanindaki notifications[].notifTypeCode/templateHeader'in birebir
 * karsiligi. Sadece goruntuleme amaclidir (rozet/badge listesi), ayri bir
 * tercih tasimaz - tercih kategori seviyesindedir (bkz. NotifCategoryDto).
 */
@Getter
@Setter
public class NotifTypeSummaryDto {
    private String notifTypeCode;
    private String templateHeader;

    public NotifTypeSummaryDto() {
    }

    public NotifTypeSummaryDto(String notifTypeCode, String templateHeader) {
        this.notifTypeCode = notifTypeCode;
        this.templateHeader = templateHeader;
    }
}
