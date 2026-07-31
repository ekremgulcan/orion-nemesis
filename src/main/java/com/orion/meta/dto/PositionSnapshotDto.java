package com.orion.meta.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class PositionSnapshotDto {
    private Long id;
    private String hesapNo;
    private String customerName;
    private String instrumentSymbol;
    private BigDecimal miktar;
    private BigDecimal referansFiyat;
    private LocalDateTime kayitTarihi;
}
