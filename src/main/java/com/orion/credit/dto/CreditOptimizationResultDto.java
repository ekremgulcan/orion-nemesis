package com.orion.credit.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreditOptimizationResultDto {
    private Long id;
    private String hesapNo;
    private String hesapAdi;
    private BigDecimal serbestBakiye;
    private BigDecimal mevcutOzkaynakOrani;
    private BigDecimal yeniOzkaynakOrani;
    private String durum;
    private String komposizyon;
    private boolean uygulandi;
    private LocalDateTime uygulamaTarihi;
}
