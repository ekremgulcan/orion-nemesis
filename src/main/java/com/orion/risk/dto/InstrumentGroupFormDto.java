package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

/**
 * "Hisse Grubu Tanimlama" ekraninin POST/PUT body'si -
 * RiskProfileService.kaydetInstrumentGroup parametreleriyle birebir
 * eslesir (id haric, o path'ten gelir).
 */
@Getter
@Setter
public class InstrumentGroupFormDto {
    private String grupKodu;
    private String aciklama;
    private boolean aktif;
    private Set<Long> instrumentIds;
}
