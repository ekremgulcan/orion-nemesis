package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RiskProfileDto {
    private Long id;
    private String enstrumanTipi;
    private String userName;
    private String hesapNo;
    private boolean alisKontrol;
    private boolean satisKontrol;
    private boolean acikSatisKontrol;
    private boolean grupANakitKontrol;
    private boolean grupBNakitKontrol;
    private boolean grupCNakitKontrol;
    private boolean grupDNakitKontrol;
    private boolean aktif;
}
