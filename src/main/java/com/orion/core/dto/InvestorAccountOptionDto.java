package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InvestorAccountOptionDto {
    private Long id;
    private String hesapNo;
    private Long customerId;
    private String customerName;
    private Long yatirimciNo;
    private String tcknVkn;
    private String yatirimciDurumu;
    private String musteriSiniflandirmasi;
    private boolean nitelikliYatirimci;
    private String durum;
    private String hesapSinifi;
}
