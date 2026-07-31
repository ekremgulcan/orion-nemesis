package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class AccountBalanceDto {
    private Long id;
    private String hesapNo;
    private String customerName;
    private BigDecimal bakiye;
    private BigDecimal blokeliBakiye;
    private LocalDateTime guncellemeTarihi;
}
