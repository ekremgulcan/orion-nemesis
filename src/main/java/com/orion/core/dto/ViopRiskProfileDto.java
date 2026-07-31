package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ViopRiskProfileDto {
    private Long id;
    private String hesapNo;
    private String customerName;
    private String profilAdi;
    private BigDecimal carpan;
    private LocalDateTime guncellemeTarihi;
}
