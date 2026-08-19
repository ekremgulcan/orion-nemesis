package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationTypeDto {
    private Long id;
    private String kod;
    private String ad;
    private String aciklama;
    private int sira;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdTime;
    private String lastUpdatedBy;
    private LocalDateTime lastUpdatedTime;
}
