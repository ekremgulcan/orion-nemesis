package com.orion.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Servis dokumanindaki notificationCategories[] elemani - kategori
 * seviyesindeki isEditable (gorunurluk/UI kurali, bkz.
 * NotificationCategory javadoc), o kategorinin icerdigi bildirim
 * tipleri (rozet listesi) ve kanal bazli isEnabled/isEditable objesi.
 */
@Getter
@Setter
public class NotifCategoryDto {
    private String categoryCode;
    private String categoryName;

    @JsonProperty("isEditable")
    private boolean editable;

    private List<NotifTypeSummaryDto> notifications;
    private NotifChannelCodeDto notifChannelCode;
}
