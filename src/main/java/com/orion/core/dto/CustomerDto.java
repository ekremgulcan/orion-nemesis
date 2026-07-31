package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CustomerDto {
    private Long id;
    private String musteriNo;
    private String adSoyadUnvan;
    private String musteriTipi;
    private String tcknVkn;
    private String riskGrubu;
    private String telefon;
    private String email;
    private boolean aktif;
    private LocalDateTime olusturmaTarihi;
}
