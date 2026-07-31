package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "TradeMaster Yetkilendirme" ekranindaki Ekle/Duzenle formunun REST
 * karsiligi. Ayni DTO hem POST (yeni yetki) hem PUT (guncelleme) icin
 * kullanilir; id, path degiskeninden gelir, govdede tekrar edilmez.
 */
@Getter
@Setter
public class ChannelAuthorizationFormDto {
    private String kullaniciAdi;
    private String hesapNo;
    private String kanal = "TRADEMASTER";
    private String yetkiDurumu = "AKTIF";
}
