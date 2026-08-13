package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class NotifChannelTemplateDto {
    private Long id;
    private Long notificationTypeId;
    private String kanal;
    private String templateHeader;
    private String templateBody;
    private int maxRetry;
    private int errorBackoffTime;
    private boolean musteriGorurVeDegistir;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdTime;
    private String lastUpdatedBy;
    private LocalDateTime lastUpdatedTime;

    /**
     * templateBody icindeki ${Param} tokenlarindan turetilir (bkz.
     * NotifChannelTemplateMapper) - "Sablonda Kullanilabilecek
     * Parametreler" listesi icin, ayri bir kolon olarak saklanmaz.
     */
    private List<String> parametreler;
}
