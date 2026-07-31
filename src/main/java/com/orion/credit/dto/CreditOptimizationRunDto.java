package com.orion.credit.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreditOptimizationRunDto {
    private Long id;
    private String gunTipi;
    private BigDecimal hedefOzkaynakOrani;
    private LocalDateTime calismaTarihi;
    private String calistiranKullaniciAdi;
}
