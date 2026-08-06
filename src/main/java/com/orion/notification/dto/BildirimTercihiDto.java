package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BildirimTercihiDto {
    private Long notificationTypeId;
    private String kod;
    private String ad;
    private String aciklama;
    private boolean zorunlu;
    private int sira;
    private boolean pushAcik;
    private boolean smsAcik;
    private boolean epostaAcik;
}
