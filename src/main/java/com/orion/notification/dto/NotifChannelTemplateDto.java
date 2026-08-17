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
     * Bu bildirim tipinde kullanilabilecek SABIT parametre listesi
     * (entity'nin allowedParametreler kolonundan, bkz.
     * NotifChannelTemplateMapper) - templateBody'nin o anki icerigine
     * BAKILMAKSIZIN sabittir, "Sablonda Kullanilabilecek Parametreler"
     * bolumu bu listeyi gosterir.
     */
    private List<String> parametreler;
}
