package com.orion.meta.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class PositionShockScenarioDto {
    private Long id;
    private String senaryoAdi;
    private String currencyPair;
    private BigDecimal sokYuzdesi;
    private boolean aktif;
    private LocalDateTime olusturmaTarihi;
}
