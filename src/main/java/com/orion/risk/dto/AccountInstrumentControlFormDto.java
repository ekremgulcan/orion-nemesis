package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Hesap/Hisse Bazinda Kontrol" ekraninin POST/PUT body'si -
 * RiskProfileService.kaydetAccountInstrumentControl parametreleriyle
 * birebir eslesir (id haric, o path'ten gelir).
 */
@Getter
@Setter
public class AccountInstrumentControlFormDto {
    private String kullaniciAdi;
    private String hesapNo;
    private String enstrumanSembol;
    private boolean alisIzni;
    private boolean satisIzni;
    private boolean acikSatisIzni;
}
