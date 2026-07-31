package com.orion.crm.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CampaignDto {
    private Long id;
    private String kampanyaAdi;
    private LocalDateTime baslangicTarihi;
    private LocalDateTime bitisTarihi;
    private String durum;
}
