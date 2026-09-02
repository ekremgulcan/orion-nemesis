package com.orion.notification.dto;

import com.orion.notification.domain.BildirimKanali;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class BildirimAyarlariUpdateDto {
    private Boolean isActive; // Genel Durum
    // Sadece degisen kanallari icerecek
    private Map<BildirimKanali, KanalAyarlariGuncelleRequest> kanalGuncellemeleri;
}
