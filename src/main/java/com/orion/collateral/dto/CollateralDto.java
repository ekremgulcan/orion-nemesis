package com.orion.collateral.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * "Teminat Islemleri" (teminat-transfer.zul) REST API'sinin depo kalemi
 * JSON govdesi - {@link com.orion.collateral.domain.Collateral} entity'sinin
 * lazy iliskilerini duz alanlara indirger.
 */
@Getter
@Setter
public class CollateralDto {
    private Long id;
    private String hesapNo;
    private String customerName;
    private String depoTipi;
    private String varlikTipi;
    private String instrumentSymbol;
    private String paraBirimi;
    private BigDecimal miktar;
    private LocalDateTime guncellemeTarihi;
}
