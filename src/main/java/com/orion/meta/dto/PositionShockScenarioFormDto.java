package com.orion.meta.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * "Senaryo Ekle / Duzenle" grubunun POST/PUT body'si -
 * MetaPozisyonService.kaydetScenario parametreleriyle birebir eslesir
 * (id haric, o path'ten gelir).
 */
@Getter
@Setter
public class PositionShockScenarioFormDto {
    private String senaryoAdi;
    private String currencyPair;
    private BigDecimal sokYuzdesi;
    private boolean aktif;
}
