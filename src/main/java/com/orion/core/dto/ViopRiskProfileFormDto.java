package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * "Hesap Bazinda VIOP Risk Profili Tanim" ekranindaki Ekle/Duzenle
 * formunun REST karsiligi. Ayni DTO hem POST (yeni profil) hem PUT
 * (guncelleme) icin kullanilir; id, path degiskeninden gelir, govdede
 * tekrar edilmez.
 */
@Getter
@Setter
public class ViopRiskProfileFormDto {
    private String hesapNo;
    private String profilAdi;
    private BigDecimal carpan;
}
