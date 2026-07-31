package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Musteri Yonetim Sistemi" ekranindaki Ekle/Duzenle formunun REST
 * karsiligi. Ayni DTO hem POST (yeni musteri) hem PUT (guncelleme) icin
 * kullanilir; id, path degiskeninden gelir, govdede tekrar edilmez.
 */
@Getter
@Setter
public class CustomerFormDto {
    private String musteriNo;
    private String adSoyadUnvan;
    private String musteriTipi = "BIREYSEL";
    private String tcknVkn;
    private String riskGrubu = "ORTA";
    private String telefon;
    private String email;
    private boolean aktif = true;
}
